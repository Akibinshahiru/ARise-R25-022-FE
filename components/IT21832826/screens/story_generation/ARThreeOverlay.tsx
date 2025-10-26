import { Asset } from "expo-asset";
import { CameraView, useCameraPermissions } from "expo-camera";
import { GLView } from "expo-gl";
import { Renderer } from "expo-three";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  PanResponder,
  PanResponderGestureState,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as THREE from "three";
// import { DRACOLoader, GLTFLoader } from "three-stdlib";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

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
  const rendererRef = useRef<Renderer | null>(null);
  const cameraRef = useRef<typeof THREE.PerspectiveCamera | null>(null);
  const groupRef = useRef<typeof THREE.Group | null>(null);

  // Rotation + inertia
  const yawVelRef = useRef(0);           // rad per frame (inertial)
  const autoSpinRef = useRef(0.007);     // baseline idle spin
  const pitchRef = useRef(0);            // tilt up/down (rad)
  const scaleRef = useRef(1);            // current scale

  // Gesture state
  const gestureModeRef = useRef<"none" | "drag" | "two">("none");
  const lastTouchesRef = useRef<{ x: number; y: number }[]>([]);
  const lastDistanceRef = useRef<number | null>(null);
  const lastAngleRef = useRef<number | null>(null);
  const lastCenterRef = useRef<{ x: number; y: number } | null>(null);

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

  async function loadLocalGLB(loader: any, moduleId: number): Promise<typeof THREE.Object3D> {
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
          const root = (gltf.scene || gltf.scenes?.[0]) as typeof THREE.Object3D | undefined;
          if (!root) return reject(new Error("No scene in GLB"));
          resolve(root);
        },
        undefined,
        (err: any) => reject(err)
      );
    });
  }

  async function loadRemoteGLB(loader: any, url: string): Promise<typeof THREE.Object3D> {
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
          const root = (gltf.scene || gltf.scenes?.[0]) as typeof THREE.Object3D | undefined;
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
    groupRef.current = group;
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

    function postProcess(root: typeof THREE.Object3D) {
      // normalize materials + size
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

      // start state
      pitchRef.current = 0.0;
      scaleRef.current = 1.0;
      if (groupRef.current) {
        groupRef.current.rotation.set(0, 0, 0);
        groupRef.current.position.set(0, 0, 0);
        groupRef.current.scale.setScalar(1);
      }
    }

    // ---- Animation loop (auto-spin + inertial spin)
    const animate = () => {
      requestAnimationFrame(animate);

      const g = groupRef.current;
      if (g) {
        // Yaw: baseline auto spin when idle + inertia from gestures
        let spin = gestureModeRef.current === "none" ? autoSpinRef.current : 0;
        if (Math.abs(yawVelRef.current) > 0.0001) {
          spin += yawVelRef.current;
          yawVelRef.current *= 0.95; // friction
        }
        g.rotation.y += spin;

        // Pitch (clamped) and scale application
        g.rotation.x = THREE.MathUtils.clamp(pitchRef.current, -0.95, 0.9);
        g.scale.setScalar(THREE.MathUtils.clamp(scaleRef.current, 0.4, 2.5));
      }

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    animate();
  };

  // ---------- Gesture helpers ----------
  const getTouches = (evt: any) =>
    (evt?.nativeEvent?.touches as { pageX: number; pageY: number }[]) || [];

  const centerOf = (ts: { pageX: number; pageY: number }[]) => {
    const n = ts.length;
    if (n === 0) return { x: 0, y: 0 };
    const s = ts.reduce(
      (acc, t) => ({ x: acc.x + t.pageX, y: acc.y + t.pageY }),
      { x: 0, y: 0 }
    );
    return { x: s.x / n, y: s.y / n };
  };

  const distanceOf = (a: { pageX: number; pageY: number }, b: { pageX: number; pageY: number }) => {
    const dx = a.pageX - b.pageX;
    const dy = a.pageY - b.pageY;
    return Math.hypot(dx, dy);
  };

  const angleOf = (a: { pageX: number; pageY: number }, b: { pageX: number; pageY: number }) =>
    Math.atan2(b.pageY - a.pageY, b.pageX - a.pageX);

  // Convert screen delta to world movement (rough scale)
  const toWorldDelta = (dx: number, dy: number) => {
    // Smaller factor = slower movement across table plane
    const factor = 0.003;
    return { wx: dx * factor, wz: dy * factor };
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        const touches = getTouches(evt);
        lastTouchesRef.current = touches.map(t => ({ x: t.pageX, y: t.pageY }));
        if (touches.length >= 2) {
          gestureModeRef.current = "two";
          lastDistanceRef.current = distanceOf(touches[0], touches[1]);
          lastAngleRef.current = angleOf(touches[0], touches[1]);
          lastCenterRef.current = centerOf(touches);
        } else {
          gestureModeRef.current = "drag";
          lastDistanceRef.current = null;
          lastAngleRef.current = null;
          lastCenterRef.current = touches[0] ? { x: touches[0].pageX, y: touches[0].pageY } : null;
        }
      },

      onPanResponderMove: (evt, gs: PanResponderGestureState) => {
        const touches = getTouches(evt);
        const g = groupRef.current;
        if (!g || touches.length === 0) return;

        if (touches.length >= 2) {
          // Two-finger: pinch (scale), twist (yaw), vertical center move (pitch)
          gestureModeRef.current = "two";
          const d = distanceOf(touches[0], touches[1]);
          const a = angleOf(touches[0], touches[1]);
          const c = centerOf(touches);

          if (lastDistanceRef.current != null) {
            const pinchRatio = d / Math.max(1, lastDistanceRef.current);
            scaleRef.current = THREE.MathUtils.clamp(scaleRef.current * pinchRatio, 0.4, 2.5);
          }
          if (lastAngleRef.current != null) {
            let deltaA = a - lastAngleRef.current;
            // normalize angle to [-PI, PI]
            deltaA = Math.atan2(Math.sin(deltaA), Math.cos(deltaA));
            g.rotation.y += deltaA;
            // store inertial spin (small fraction)
            yawVelRef.current = deltaA * 0.25;
          }
          if (lastCenterRef.current) {
            const dy = c.y - lastCenterRef.current.y;
            pitchRef.current += -dy * 0.003; // swipe up → look down
          }

          lastDistanceRef.current = d;
          lastAngleRef.current = a;
          lastCenterRef.current = c;
        } else {
          // One-finger: move object over a plane (x/z)
          gestureModeRef.current = "drag";
          const prev = lastCenterRef.current;
          const cur = touches[0] ? { x: touches[0].pageX, y: touches[0].pageY } : null;
          if (prev && cur) {
            const dx = cur.x - prev.x;
            const dy = cur.y - prev.y;
            const { wx, wz } = toWorldDelta(dx, dy);
            g.position.x += wx;
            g.position.z += wz;
            lastCenterRef.current = cur;
          }
        }
      },

      onPanResponderRelease: () => {
        // Let inertia/auto-spin take over
        gestureModeRef.current = "none";
        lastTouchesRef.current = [];
        lastDistanceRef.current = null;
        lastAngleRef.current = null;
        lastCenterRef.current = null;
      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderTerminate: () => {
        gestureModeRef.current = "none";
      },
    })
  ).current;

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
      {/* Gesture catcher on top */}
      <View {...pan.panHandlers} style={StyleSheet.absoluteFill} />

      {/* Debug / tips */}
      <View pointerEvents="none" style={styles.debugBox}>
        <Text style={styles.debugText} numberOfLines={4}>🚤 {debug}</Text>
        {modelLoaded && (
          <Text style={[styles.debugText, { marginTop: 4, color: "#4ade80" }]}>
            Tip: 1-finger drag = move • 2-finger pinch = zoom • twist = rotate • vertical = tilt
          </Text>
        )}
      </View>

      <View pointerEvents="none" style={styles.instructionsBox}>
        <Text style={styles.instructionsText}>
          Place the yacht on your table, then twist/pinch/drag to explore.
        </Text>
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
