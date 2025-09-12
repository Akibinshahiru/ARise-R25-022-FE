import { CameraView, useCameraPermissions } from 'expo-camera';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as THREE from 'three';
import { DRACOLoader, GLTFLoader } from 'three-stdlib';

/** Curated, CORS-friendly free GLB sources (no auth, direct links) */
const FREE_MODELS: Array<{ name: string; url: string; keywords?: string[] }> = [
  // Three.js examples CDN
  { name: 'Parrot', url: 'https://threejs.org/examples/models/gltf/Parrot.glb', keywords: ['bird', 'parrot', 'animal'] },

  // Khronos glTF Sample Models
  { name: 'Damaged Helmet', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb', keywords: ['helmet'] },
  { name: 'BoomBox', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF-Binary/BoomBox.glb', keywords: ['radio', 'speaker', 'music', 'boombox'] },
  { name: 'Water Bottle', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF-Binary/WaterBottle.glb', keywords: ['bottle', 'water'] },
  { name: 'Duck', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb', keywords: ['duck', 'bird', 'animal'] },
  { name: 'Cesium Milk Truck', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb', keywords: ['truck', 'vehicle', 'car'] },
  { name: 'Fox', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb', keywords: ['fox', 'animal'] },
  { name: 'Horse', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Horse/glTF-Binary/Horse.glb', keywords: ['horse', 'animal'] },
];

// Simple fuzzy match over curated sources
function findFreeModel(query: string) {
  const q = (query || '').toLowerCase().trim();
  if (!q) return null;
  return (
    FREE_MODELS.find(m => m.name.toLowerCase().includes(q)) ||
    FREE_MODELS.find(m => (m.keywords || []).some(k => k.toLowerCase().includes(q))) ||
    null
  );
}

type Props = { query?: string };

export default function ARThreeOverlay({ query = 'Duck' }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [debug, setDebug] = useState<string>('Initializing…');
  const [modelLoaded, setModelLoaded] = useState(false);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission?.granted]);

  const createFallbackYacht = () => {
    const group = new THREE.Group();

    // Hull
    const hullGeometry = new THREE.CylinderGeometry(0.15, 0.35, 2.5, 12);
    const hullMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.3,
      roughness: 0.7,
    });
    const hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.rotation.z = Math.PI / 2;
    hull.position.y = -0.2;

    // Deck
    const deckGeometry = new THREE.CylinderGeometry(0.25, 0.3, 2.2, 12);
    const deckMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4f1e8,
      metalness: 0.1,
      roughness: 0.9,
    });
    const deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.rotation.z = Math.PI / 2;
    deck.position.y = 0.05;
    deck.scale.y = 0.8;

    // Mast
    const mastGeometry = new THREE.CylinderGeometry(0.03, 0.03, 2);
    const mastMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      metalness: 0.1,
      roughness: 0.9,
    });
    const mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(0, 1.2, 0);

    // Main sail
    const sailGeometry = new THREE.PlaneGeometry(1.2, 1.5);
    const sailMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8f8ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      metalness: 0,
      roughness: 0.8,
    });
    const sail = new THREE.Mesh(sailGeometry, sailMaterial);
    sail.position.set(0.4, 1.2, 0);

    // Jib
    const jibGeometry = new THREE.PlaneGeometry(0.8, 1);
    const jib = new THREE.Mesh(jibGeometry, sailMaterial);
    jib.position.set(-0.3, 0.8, 0);
    jib.rotation.y = Math.PI * 0.1;

    // Cabin
    const cabinGeometry = new THREE.BoxGeometry(0.8, 0.4, 1.2);
    const cabinMaterial = new THREE.MeshStandardMaterial({
      color: 0xe6e6fa,
      metalness: 0.1,
      roughness: 0.8,
    });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0.3, 0.4, 0);

    group.add(hull, deck, mast, sail, jib, cabin);
    return group;
  };

  const onContextCreate = async (gl: any) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 100);
    camera.position.set(0, 0, 3);

    const renderer = new Renderer({ gl, alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);

    // ---- Color & pipeline tweaks
    try {
      (THREE as any).ColorManagement && ((THREE as any).ColorManagement.enabled = true);
    } catch {}
    try {
      (renderer as any).outputColorSpace = (THREE as any).SRGBColorSpace || 'srgb';
    } catch {}

    // ---- Patch pixelStorei to silence EXGL unsupported pname warnings
    const ctx: WebGLRenderingContext = (renderer as any).getContext
      ? (renderer as any).getContext()
      : (gl as any);

    const originalPixelStorei = (ctx as any).pixelStorei?.bind(ctx);
    if (originalPixelStorei) {
      (ctx as any).pixelStorei = (pname: number, param: any) => {
        try {
          originalPixelStorei(pname, param);
        } catch {
          // Ignore unsupported pname (e.g., UNPACK_COLORSPACE_CONVERSION_WEBGL)
          // console.warn('pixelStorei unsupported pname:', pname);
        }
      };
    }

    // ---- Lighting
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    directionalLight.position.set(3, 4, 2);
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0x404040, 1.8);
    scene.add(ambientLight);

    const fillLight = new THREE.DirectionalLight(0x6495ed, 1);
    fillLight.position.set(-2, 1, -1);
    scene.add(fillLight);

    const group = new THREE.Group();
    scene.add(group);

    // ---- Load model from curated free sources (or fallback)
    try {
      const match = findFreeModel(query);
      if (!match) {
        setDebug('No curated free model matched. Using fallback yacht.');
        group.add(createFallbackYacht());
        setModelLoaded(true);
      } else {
        setDebug(`Loading free model: ${match.name} …`);
        const loader = new GLTFLoader();

        // Disable KTX2/Basis if present in three-stdlib env
        (loader as any).ktx2Loader = undefined;

        // Optional DRACO for compressed assets
        const draco = new DRACOLoader();
        draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
        draco.setDecoderConfig({ type: 'js' });
        loader.setDRACOLoader(draco);

        // If model references external textures, resolve from its base URL
        const base = match.url.replace(/\/[^\/]*$/, '/') + '';
        loader.setResourcePath(base);

        await new Promise<void>((resolve, reject) => {
          loader.load(
            match.url,
            (gltf: any) => {
              try {
                const loaded = gltf.scene || gltf.scenes?.[0];
                if (!loaded) throw new Error('No scene in model');

                // Normalize materials for mobile lighting
                loaded.traverse((child: any) => {
                  if (child.isMesh && child.material) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach((mat: any) => {
                      mat.needsUpdate = true;
                      if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
                        if (mat.metalness == null) mat.metalness = 0.1;
                        if (mat.roughness == null) mat.roughness = 0.85;
                      }
                    });
                  }
                });

                // Center & scale to reasonable size
                const box = new THREE.Box3().setFromObject(loaded);
                const size = new THREE.Vector3();
                const center = new THREE.Vector3();
                box.getSize(size);
                box.getCenter(center);
                loaded.position.sub(center);
                const maxDim = Math.max(size.x, size.y, size.z) || 1;
                loaded.scale.setScalar(1.5 / maxDim);

                group.add(loaded);
                setDebug(`Loaded: ${match.name}`);
                setModelLoaded(true);
                resolve();
              } catch (e) {
                reject(e);
              }
            },
            undefined,
            (err: any) => reject(err)
          );
        });
      }
    } catch (error: any) {
      setDebug(`Load error: ${error?.message || error}. Using fallback yacht.`);
      group.add(createFallbackYacht());
      setModelLoaded(true);
    }

    // ---- Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      group.rotation.y += 0.008;
      const t = Date.now() * 0.001;
      group.position.y = Math.sin(t * 0.5) * 0.1;
      group.rotation.z = Math.sin(t * 0.3) * 0.02;
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    animate();
  };

  return (
    <View style={styles.root}>
      {permission?.granted ? <CameraView style={StyleSheet.absoluteFill} facing="back" /> : null}
      <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} />

      {/* Debug info */}
      <View pointerEvents="none" style={styles.debugBox}>
        <Text style={styles.debugText} numberOfLines={4}>🚤 {debug}</Text>
        {modelLoaded && (
          <Text style={[styles.debugText, { marginTop: 4, color: '#4ade80' }]}>
            Model loaded successfully!
          </Text>
        )}
      </View>

      {/* Instructions */}
      <View pointerEvents="none" style={styles.instructionsBox}>
        <Text style={styles.instructionsText}>
          Point your camera around to see the model in AR!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  debugBox: {
    position: 'absolute',
    top: 50,
    left: 8,
    right: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  debugText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  instructionsBox: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  instructionsText: { color: '#1f2937', fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
