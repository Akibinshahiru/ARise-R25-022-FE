import { Asset } from "expo-asset";
import { CameraView, useCameraPermissions } from "expo-camera";
import { GLView } from "expo-gl";
import { Renderer } from "expo-three";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import * as THREE from "three";
import { Object3D, PerspectiveCamera } from "three";
import { DRACOLoader, GLTFLoader } from "three-stdlib";

type Props = { query?: string };

// 1) Local bundled yacht model (ensure this path exists)
const LOCAL_MODELS: Record<string, number> = {
  yacht: require("../../../../assets/IT21832826/models/yacht.glb"),
  boat: require("../../../../assets/IT21832826/models/yacht.glb"),
};

// 2) Optional remote fallbacks
const FREE_MODELS = [
  { name: "Parrot", url: "https://threejs.org/examples/models/gltf/Parrot.glb", keywords: ["parrot", "bird"] },
  { name: "Duck", url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb", keywords: ["duck"] },
];

function findFreeModel(query: string) {
  const q = (query || "").toLowerCase().trim();
  if (!q) return null;
  return (
    FREE_MODELS.find((m) => m.name.toLowerCase().includes(q)) ||
    FREE_MODELS.find((m) => (m.keywords || []).some((k) => q.includes(k))) ||
    null
  );
}

export default function ARThreeOverlay({ query = "yacht" }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [debug, setDebug] = useState("Initializing…");
  const [modelLoaded, setModelLoaded] = useState(false);

  const glRef = useRef<any>(null);
  const cameraRef = useRef<typeof PerspectiveCamera | null>(null); // ✅ inline type
  const rendererRef = useRef<Renderer | null>(null);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission?.granted]);

  const createFallbackYacht = useCallback(() => {
    const group = new THREE.Group();

    const hull = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.35, 2.5, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.3, roughness: 0.7 })
    );
    hull.rotation.z = Math.PI / 2;
    hull.position.y = -0.2;

    const deck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.3, 2.2, 12),
      new THREE.MeshStandardMaterial({ color: 0xf4f1e8, metalness: 0.1, roughness: 0.9 })
    );
    deck.rotation.z = Math.PI / 2;
    deck.position.y = 0.05;
    deck.scale.y = 0.8;

    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 2),
      new THREE.MeshStandardMaterial({ color: 0x8b4513, metalness: 0.1, roughness: 0.9 })
    );
    mast.position.set(0, 1.2, 0);

    const sailMat = new THREE.MeshStandardMaterial({
      color: 0xf8f8ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
      roughness: 0.85,
    });
    const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.5), sailMat);
    sail.position.set(0.4, 1.2, 0);

    const jib = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1), sailMat);
    jib.position.set(-0.3, 0.8, 0);
    jib.rotation.y = Math.PI * 0.1;

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.4, 1.2),
      new THREE.MeshStandardMaterial({ color: 0xe6e6fa, metalness: 0.1, roughness: 0.8 })
    );
    cabin.position.set(0.3, 0.4, 0);

    group.add(hull, deck, mast, sail, jib, cabin);
    return group;
  }, []);

  // ✅ Avoid `GLTFLoader` as a type; just use runtime value & inline return type
  async function loadLocalGLB(loader: any, moduleId: number): Promise<typeof Object3D> {
    const asset = Asset.fromModule(moduleId);
    if (!asset.localUri) await asset.downloadAsync();
    const uri = asset.localUri || asset.uri;
    if (!uri) throw new Error("Local asset URI missing");

    try {
      const base = uri.replace(/\/[^\/]*$/, "/");
      loader.setResourcePath(base);
    } catch {}

    return await new Promise((resolve, reject) => {
      loader.load(
        uri,
        (gltf: any) => {
          const root: typeof Object3D | undefined = gltf.scene || gltf.scenes?.[0];
          if (!root) return reject(new Error("No scene in GLB"));
          resolve(root);
        },
        undefined,
        (err: any) => reject(err)
      );
    });
  }

  async function loadRemoteGLB(loader: any, url: string): Promise<typeof Object3D> {
    const draco = new DRACOLoader();
    draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
    draco.setDecoderConfig({ type: "js" });
    loader.setDRACOLoader(draco);

    const base = url.replace(/\/[^\/]*$/, "/");
    loader.setResourcePath(base);

    return await new Promise((resolve, reject) => {
      loader.load(
        url,
        (gltf: any) => {
          const root: typeof Object3D | undefined = gltf.scene || gltf.scenes?.[0];
          if (!root) return reject(new Error("No scene in GLB"));
          resolve(root);
        },
        undefined,
        (err: any) => reject(err)
      );
    });
  }

  const onContextCreate = async (gl: any) => {
    glRef.current = gl;
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 100);
    camera.position.set(0, 0, 3);
    cameraRef.current = camera;

    const renderer = new Renderer({ gl, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);

    try {
      (THREE as any).ColorManagement && ((THREE as any).ColorManagement.enabled = true);
      (renderer as any).outputColorSpace = (THREE as any).SRGBColorSpace || "srgb";
    } catch {}

    // Silence EXGL unsupported pnames
    const ctx: WebGLRenderingContext = (renderer as any).getContext?.() || gl;
    const orig = (ctx as any).pixelStorei?.bind(ctx);
    if (orig) {
      (ctx as any).pixelStorei = (pname: number, param: any) => {
        try { orig(pname, param); } catch {}
      };
    }

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 1.4));
    const dir = new THREE.DirectionalLight(0xffffff, 2.2);
    dir.position.set(3, 4, 2); scene.add(dir);
    const fill = new THREE.DirectionalLight(0x9bbcff, 0.8);
    fill.position.set(-2, 1, -1); scene.add(fill);

    const group = new THREE.Group();
    scene.add(group);

    // Load model
    try {
      const q = (query || "").toLowerCase();
      const loader = new GLTFLoader();
      (loader as any).ktx2Loader = undefined;

      if (LOCAL_MODELS.yacht && (q.includes("yacht") || q.includes("boat") || q.includes("ship"))) {
        setDebug("Loading local yacht model…");
        const root = await loadLocalGLB(loader, LOCAL_MODELS.yacht);
        postProcess(root);
        group.add(root);
        setDebug("Local yacht loaded ✅");
        setModelLoaded(true);
      } else {
        const match = findFreeModel(query);
        if (match) {
          setDebug(`Loading ${match.name}…`);
          const root = await loadRemoteGLB(loader, match.url);
          postProcess(root);
          group.add(root);
          setDebug(`${match.name} loaded ✅`);
          setModelLoaded(true);
        } else {
          throw new Error("No model matched query");
        }
      }
    } catch (e: any) {
      setDebug(`Model load failed: ${e?.message || e}. Using fallback yacht.`);
      const root = createFallbackYacht();
      postProcess(root);
      group.add(root);
      setModelLoaded(true);
    }

    function postProcess(root: typeof Object3D) {
      root.traverse?.((child: any) => {
        if (child.isMesh && child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((m: any) => {
            if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) {
              if (m.metalness == null) m.metalness = 0.15;
              if (m.roughness == null) m.roughness = 0.85;
            }
            m.needsUpdate = true;
          });
          child.castShadow = false;
          child.receiveShadow = false;
        }
      });

      const box = new THREE.Box3().setFromObject(root as any);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size); box.getCenter(center);
      (root as any).position?.sub?.(center);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      (root as any).scale?.setScalar?.(1.6 / maxDim);
    }

    const animate = () => {
      requestAnimationFrame(animate);
      const t = Date.now() * 0.001;
      group.rotation.y += 0.01;
      group.position.y = Math.sin(t * 0.5) * 0.08;
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    animate();
  };

  const onLayout = () => {
    const gl = glRef.current;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (!gl || !renderer || !camera) return;
    const w = gl.drawingBufferWidth;
    const h = gl.drawingBufferHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  return (
    <View style={styles.root} onLayout={onLayout}>
      {permission?.granted ? <CameraView style={StyleSheet.absoluteFill} facing="back" /> : null}
      <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} />
      <View pointerEvents="none" style={styles.debugBox}>
        <Text style={styles.debugText} numberOfLines={4}>🚤 {debug}</Text>
        {modelLoaded && <Text style={[styles.debugText, { marginTop: 4, color: "#4ade80" }]}>Model ready</Text>}
      </View>
      <View pointerEvents="none" style={styles.instructionsBox}>
        <Text style={styles.instructionsText}>Move your camera — the yacht overlays the real world.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  debugBox: {
    position: "absolute", top: 50, left: 8, right: 8,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  debugText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  instructionsBox: {
    position: "absolute", bottom: 100, left: 16, right: 16,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  instructionsText: { color: "#1f2937", fontSize: 14, fontWeight: "600", textAlign: "center" },
});
