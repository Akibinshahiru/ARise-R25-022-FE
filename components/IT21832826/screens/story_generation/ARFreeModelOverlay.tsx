import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { DRACOLoader, GLTFLoader } from 'three-stdlib';

type FreeModel = {
  name: string;
  url: string; // Direct GLB URL
  keywords?: string[];
};

// Minimal curated list of free, open models hosted by KhronosGroup
const FREE_MODELS: FreeModel[] = [
  {
    name: 'Duck',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb',
    keywords: ['duck', 'animal', 'bird'],
  },
  {
    name: 'Fox',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb',
    keywords: ['fox', 'animal'],
  },
  {
    name: 'Avocado',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb',
    keywords: ['fruit', 'food'],
  },
  {
    name: 'Damaged Helmet',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
    keywords: ['helmet'],
  },
  {
    name: 'BoomBox',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF-Binary/BoomBox.glb',
    keywords: ['boombox', 'radio', 'music'],
  },
];

function findModel(query?: string): FreeModel | null {
  const q = (query || '').toLowerCase().trim();
  if (!q) return FREE_MODELS[0] || null;
  return (
    FREE_MODELS.find((m) => m.name.toLowerCase().includes(q)) ||
    FREE_MODELS.find((m) => (m.keywords || []).some((k) => k.toLowerCase().includes(q))) ||
    null
  );
}

type Props = {
  modelName?: string; // e.g., 'duck', 'fox'
  showCamera?: boolean; // render camera preview behind GL
};

export default function ARFreeModelOverlay({ modelName = 'duck', showCamera = true }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [debug, setDebug] = useState<string>('');

  useEffect(() => {
    if (showCamera && !permission?.granted) requestPermission();
  }, [permission?.granted, showCamera]);

  const onContextCreate = async (gl: any) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 100);
    camera.position.set(0, 0, 2.5);

    const renderer = new Renderer({ gl, alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    try {
      (renderer as any).outputColorSpace = (THREE as any).SRGBColorSpace || 'srgb';
    } catch {}

    // Lights
    const key = new THREE.DirectionalLight(0xffffff, 2);
    key.position.set(3, 4, 2);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x89a6ff, 0.6);
    fill.position.set(-2, 1, -1);
    scene.add(fill);
    const amb = new THREE.AmbientLight(0x404040, 1.3);
    scene.add(amb);

    const group = new THREE.Group();
    scene.add(group);

    const candidate = findModel(modelName);
    if (!candidate) {
      setDebug('No model matched; using primitive fallback');
      const geo = new THREE.TorusKnotGeometry(0.6, 0.2, 100, 16);
      const mat = new THREE.MeshStandardMaterial({ color: 0x89cff0, metalness: 0.3, roughness: 0.7 });
      group.add(new THREE.Mesh(geo, mat));
    } else {
      try {
        setDebug(`Fetching ${candidate.name}...`);
        const resp = await fetch(candidate.url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const arrayBuffer = await resp.arrayBuffer();

        await new Promise<void>((resolve, reject) => {
          const loader = new GLTFLoader();
          try {
            const draco = new DRACOLoader();
            draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
            draco.setDecoderConfig({ type: 'js' });
            loader.setDRACOLoader(draco);
          } catch {}

          loader.parse(arrayBuffer, '', (gltf: any) => {
            try {
              const model = gltf.scene || gltf.scenes?.[0];
              if (!model) throw new Error('No scene');

              model.traverse((child: any) => {
                if (child.isMesh && child.material) {
                  const mats = Array.isArray(child.material) ? child.material : [child.material];
                  mats.forEach((m: any) => {
                    m.needsUpdate = true;
                    if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) {
                      m.metalness = m.metalness ?? 0.1;
                      m.roughness = m.roughness ?? 0.8;
                    }
                  });
                }
              });

              // Center and scale
              const box = new THREE.Box3().setFromObject(model);
              const size = new THREE.Vector3();
              const center = new THREE.Vector3();
              box.getSize(size);
              box.getCenter(center);
              model.position.sub(center);
              const maxDim = Math.max(size.x, size.y, size.z) || 1;
              model.scale.setScalar(1.4 / maxDim);

              group.add(model);
              setDebug(`Loaded: ${candidate.name}`);
              resolve();
            } catch (e) {
              reject(e);
            }
          }, reject);
        });
      } catch (e: any) {
        setDebug(`Load failed: ${e?.message || 'unknown'}`);
        const geo = new THREE.IcosahedronGeometry(0.8, 1);
        const mat = new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.2, roughness: 0.6 });
        group.add(new THREE.Mesh(geo, mat));
      }
    }

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      group.rotation.y += 0.007;
      const t = Date.now() * 0.001;
      group.position.y = Math.sin(t * 0.7) * 0.06;
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    animate();
  };

  return (
    <View style={styles.root}>
      {showCamera && permission?.granted ? (
        <CameraView style={StyleSheet.absoluteFill} facing="back" />
      ) : null}
      <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} />
      {!!debug && (
        <View pointerEvents="none" style={styles.debugBox}>
          <Text style={styles.debugText} numberOfLines={2}>{debug}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  debugBox: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
  },
  debugText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});

