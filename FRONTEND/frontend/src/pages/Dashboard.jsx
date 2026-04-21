import React, { useRef, Suspense, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, Center } from '@react-three/drei';
import * as THREE from 'three';

/* ── TEST CUBE — proves the Canvas + WebGL pipeline works ── */
function SpinningCube() {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta;
      ref.current.rotation.y += delta * 0.5;
    }
  });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  );
}

/* ── ROOM MODEL — loads the GLTF and auto-scales ── */
function RoomModel() {
  const { scene } = useGLTF('/room-model/scene.gltf');
  const { camera } = useThree();

  useEffect(() => {
    if (scene) {
      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) scene.scale.setScalar(5 / maxDim);

      const newBox = new THREE.Box3().setFromObject(scene);
      const center = newBox.getCenter(new THREE.Vector3());
      scene.position.sub(center);

      camera.position.set(8, 6, 8);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      console.log('[RoomModel] loaded — size:', size);
    }
  }, [scene, camera]);

  return <primitive object={scene} />;
}

export default function Dashboard() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        background: '#1e1e1e',
      }}
    >
      <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
        <color attach="background" args={['#1e1e1e']} />

        <ambientLight intensity={2} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />

        <axesHelper args={[5]} />
        <gridHelper args={[20, 20]} />

        {/* TEST: spinning pink cube at origin — should be visible immediately */}
        <SpinningCube />

        <OrbitControls />
      </Canvas>
    </div>
  );
}