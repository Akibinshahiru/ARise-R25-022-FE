import React, { useMemo, useEffect } from "react";
import { StyleSheet, View, Text } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { WebView } from "react-native-webview";

type Props = {
  word?: string;
  storyText?: string;
};

const DEFAULT_STORY =
  "On a sunny morning, a small yacht glided over the sparkling sea. The wind filled its sail like a kite, and the bow cut gentle waves that whispered, 'yacht, yacht' as it danced toward the horizon.";

export default function ARWordStory({ word = "yacht", storyText = DEFAULT_STORY }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission?.granted]);

  const html = useMemo(() => getHtml(word, storyText), [word, storyText]);
  return (
    <View style={styles.root}>
      {/* Native camera preview behind WebView */}
      {permission?.granted ? (
        <CameraView style={StyleSheet.absoluteFill} facing="back" />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.permissionOverlay]}>
          <Text style={styles.permissionText}>Grant camera permission to use AR</Text>
        </View>
      )}

      <WebView
        originWhitelist={["*"]}
        javaScriptEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        domStorageEnabled
        allowFileAccess
        // Android: grant camera/mic when the page requests it
        onPermissionRequest={(e: any) => {
          try { e.grant(e.resources); } catch {}
        }}
        style={{ backgroundColor: "transparent" }}
        androidLayerType="hardware"
        source={{ html }}
      />
    </View>
  );
}

function getHtml(word: string, story: string) {
  return `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
  <style>
    html,body,#app{height:100%;margin:0;overflow:hidden;background:transparent}
    #three{position:fixed;inset:0;z-index:1;}
    .story{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);max-width:88%;padding:14px 16px;border-radius:16px;background:rgba(255,255,255,0.85);backdrop-filter:blur(6px);font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;line-height:1.35;color:#3b0764;z-index:2;box-shadow:0 10px 24px rgba(0,0,0,.25)}
    .title{font-weight:900;margin:0 0 6px 0;font-size:18px}
  </style>
</head>
<body>
  <canvas id="three"></canvas>
  <div class="story">
    <div class="title">Word: ${word}</div>
    <div>${story}</div>
  </div>

  <script>
    // Camera handled natively; no getUserMedia here
  </script>

  <script src="https://unpkg.com/three@0.161.0/build/three.min.js"></script>
  <script>
    // Basic three setup
    const canvas = document.getElementById('three');
    const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.01, 100);
    camera.position.set(0, 1.2, 3);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(2,4,3);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // Simple 'yacht' made from primitives
    const group = new THREE.Group();
    scene.add(group);

    // Hull
    const hullGeom = new THREE.CapsuleGeometry(0.8, 1.2, 4, 16);
    const hullMat = new THREE.MeshStandardMaterial({color:0x8b5cf6, metalness:.2, roughness:.6});
    const hull = new THREE.Mesh(hullGeom, hullMat);
    hull.rotation.z = Math.PI/2; // lay sideways
    hull.scale.set(1.2, .6, .6);
    group.add(hull);

    // Deck
    const deck = new THREE.Mesh(new THREE.BoxGeometry(1.4, .12, .5), new THREE.MeshStandardMaterial({color:0xf0e7ff}));
    deck.position.y = .05;
    group.add(deck);

    // Mast
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1.2, 12), new THREE.MeshStandardMaterial({color:0x5b21b6}));
    mast.position.set(0, .7, 0);
    group.add(mast);

    // Sail
    const sailGeom = new THREE.PlaneGeometry(0.9, 1.0, 1, 1);
    const sailMat = new THREE.MeshStandardMaterial({color:0xfff4cc, side:THREE.DoubleSide});
    const sail = new THREE.Mesh(sailGeom, sailMat);
    sail.position.set(0.2, .75, 0);
    sail.rotation.y = Math.PI/8;
    group.add(sail);

    // Water plane for subtle reflection
    const water = new THREE.Mesh(new THREE.PlaneGeometry(10,10), new THREE.MeshBasicMaterial({color:0x000000, transparent:true, opacity:0}));
    water.rotation.x = -Math.PI/2;
    scene.add(water);

    function resize(){
      const w = innerWidth, h = innerHeight;
      renderer.setSize(w,h,false);
      camera.aspect = w/h; camera.updateProjectionMatrix();
    }
    addEventListener('resize', resize); resize();

    // Device motion -> tilt boat
    let alpha=0, beta=0, gamma=0, hasMotion=false;
    function handleOrientation(e){ hasMotion=true; alpha=e.alpha||0; beta=e.beta||0; gamma=e.gamma||0; }
    window.addEventListener('deviceorientation', handleOrientation, true);

    let t = 0;
    (function loop(){
      requestAnimationFrame(loop);
      t += 0.01;
      // gentle bobbing
      group.position.y = Math.sin(t)*0.05;
      // rotate with phone tilt if available
      if(hasMotion){
        group.rotation.z = THREE.MathUtils.degToRad(gamma*0.2);
        group.rotation.x = THREE.MathUtils.degToRad(beta*0.1);
      } else {
        group.rotation.y += 0.003; // idle spin as fallback
      }
      renderer.render(scene,camera);
    })();
  </script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  permissionOverlay: { justifyContent: "flex-end", alignItems: "center", padding: 16 },
  permissionText: { color: "#fff", fontWeight: "700" },
});

