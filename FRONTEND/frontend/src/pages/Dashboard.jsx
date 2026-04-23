import React, { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useVideoTexture } from '@react-three/drei';
import * as THREE from 'three';

/* ─────────────────────────────────────────────────────────
 * CONFIGURATION — Video texture mesh target
 * ───────────────────────────────────────────────────────── */
const PC_SCREEN_MESH_NAME = 'Object_34';    // ← mesh name for the PC monitor

/* ─────────────────────────────────────────────────────────
 * FRIENDLY NAMES — Maps raw mesh names to display labels.
 * Only meshes listed here will open the control panel.
 * ───────────────────────────────────────────────────────── */
const friendlyNames = {
    'Object_34': 'Smart Hub',
    'Object_49': 'Bedside Lamp',
    'Object_0':  'Room Wall',
    'Object_1':  'Floor',
    'Object_2':  'Outside View',
    'Object_3':  'Door',
    'Object_4':  'Dark Trim',
    'Object_5':  'Bed Frame',
    'Object_7':  'Mattress',
    'Object_8':  'Bed Sheets',
    'Object_9':  'PC Interior',
    'Object_10': 'PC Screen',
    'Object_11': 'Ceiling Light',
    'Object_12': 'Chair',
    'Object_13': 'Desk Surface',
    'Object_14': 'Accent Piece',
    'Object_15': 'Desk Lamp',
    'Object_16': 'Book Pages',
    'Object_17': 'Book Cover',
    'Wall Fan':  'Wall Fan',
    // Add more as needed: 'Object_XX': 'Friendly Name',
};

/* ── Black material used when the monitor is OFF ── */
const blackMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

/* ──────────────────────────────────────────────────────────
 * MONITOR VIDEO CONTROLLER
 * Manages the PC screen video texture with fade-in on ON,
 * instant black on OFF.
 * ────────────────────────────────────────────────────────── */
function MonitorController({ scene, deviceStatus }) {
    const pcTexture = useVideoTexture('/pc-screen.mp4', {
        loop: true,
        muted: true,
        start: true,
    });

    const monitorMeshRef = useRef(null);
    const videoMaterialRef = useRef(null);
    const fadeRef = useRef({ active: false, progress: 0 });

    // Find the monitor mesh once the scene is ready
    useEffect(() => {
        if (!scene) return;
        scene.traverse((child) => {
            if (child.isMesh && child.name === PC_SCREEN_MESH_NAME) {
                monitorMeshRef.current = child;
            }
        });
    }, [scene]);

    // Create the video material once the texture is loaded
    useEffect(() => {
        if (!pcTexture) return;
        pcTexture.encoding = THREE.sRGBEncoding;

        videoMaterialRef.current = new THREE.MeshBasicMaterial({
            map: pcTexture,
            toneMapped: false,
            transparent: true,
            opacity: 0,
        });
    }, [pcTexture]);

    // React to ON/OFF state changes for the monitor
    useEffect(() => {
        const mesh = monitorMeshRef.current;
        if (!mesh) return;

        const isOn = deviceStatus[PC_SCREEN_MESH_NAME] === true;

        if (isOn && videoMaterialRef.current) {
            // Switch to video material and start fade-in
            videoMaterialRef.current.opacity = 0;
            mesh.material = videoMaterialRef.current;
            mesh.material.needsUpdate = true;
            fadeRef.current = { active: true, progress: 0 };
            console.log('[Monitor] Turning ON — starting fade-in');
        } else {
            // Instantly switch to black
            mesh.material = blackMaterial;
            mesh.material.needsUpdate = true;
            fadeRef.current = { active: false, progress: 0 };
            console.log('[Monitor] Turned OFF — black screen');
        }
    }, [deviceStatus]);

    // Animate opacity from 0 → 1 over 1.5 seconds
    useFrame((_, delta) => {
        if (!fadeRef.current.active) return;
        if (!videoMaterialRef.current) return;

        const fadeDuration = 1.5; // seconds
        fadeRef.current.progress += delta / fadeDuration;

        if (fadeRef.current.progress >= 1) {
            fadeRef.current.progress = 1;
            fadeRef.current.active = false;
        }

        videoMaterialRef.current.opacity = fadeRef.current.progress;
    });

    return null;
}

/* ──────────────────────────────────────────────────────────
 * WALL FAN — built from R3F primitives
 * Cylinder base mount → Sphere motor housing → 4 Box blades
 * Spins when deviceStatus['Wall Fan'] is true,
 * smoothly decelerates when turned off.
 * ────────────────────────────────────────────────────────── */
function WallFan({ isOn, onPointerDown }) {
    const bladesRef = useRef();
    const speedRef = useRef(0);

    const TARGET_SPEED = 15;      // rad/s when ON
    const ACCELERATION = 8;       // how fast it spins up
    const DECELERATION = 4;       // how fast it winds down

    useFrame((_, delta) => {
        if (!bladesRef.current) return;

        // Smoothly ramp speed toward target or zero
        if (isOn) {
            speedRef.current = THREE.MathUtils.lerp(
                speedRef.current,
                TARGET_SPEED,
                1 - Math.exp(-ACCELERATION * delta)
            );
        } else {
            speedRef.current = THREE.MathUtils.lerp(
                speedRef.current,
                0,
                1 - Math.exp(-DECELERATION * delta)
            );
            // Snap to zero when close enough
            if (Math.abs(speedRef.current) < 0.01) speedRef.current = 0;
        }

        bladesRef.current.rotation.z += speedRef.current * delta;
    });

    const handleClick = useCallback((e) => {
        e.stopPropagation();
        console.log('[Raycast] Clicked mesh: Wall Fan');
        if (onPointerDown) onPointerDown('Wall Fan');
    }, [onPointerDown]);

    // Shared blade geometry: thin flat box
    const bladeWidth = 1.35;
    const bladeLength = 0.08;
    const bladeDepth = 0.02;

    return (
        /*
         * ── WALL FAN POSITIONING ──────────────────────────────
         * To nudge the fan, tweak the three numbers in position={[X, Y, Z]}:
         *   X  → left / right   (decrease to move LEFT, increase to move RIGHT)
         *   Y  → up / down      (increase to move UP, decrease to move DOWN)
         *   Z  → toward / away from back wall (decrease to push CLOSER to wall)
         *
         * Current:  position={[-1.9, 1.35, -2.48]}
         * rotation {[0, 0, 0]} keeps the fan facing into the room.
         */
        <group
            position={[-4.5, 1.35, -2.48]}
            rotation={[0, 1.5, 0]}
            onPointerDown={handleClick}
        >
            {/* ── Base mount (dark grey cylinder flush to wall) ── */}
            <mesh position={[0, 0, -0.06]}>
                <cylinderGeometry args={[0.12, 0.12, 0.12, 24]} />
                <meshStandardMaterial color="#3a3a3a" metalness={0.6} roughness={0.3} />
            </mesh>

            {/* ── Arm connecting mount to motor ── */}
            <mesh position={[0, 0, 0.05]}>
                <cylinderGeometry args={[0.03, 0.03, 0.2, 12]} />
                <meshStandardMaterial color="#4a4a4a" metalness={0.5} roughness={0.4} />
            </mesh>

            {/* ── Motor housing (sphere) ── */}
            <mesh position={[0, 0, 0.18]}>
                <sphereGeometry args={[0.1, 24, 24]} />
                <meshStandardMaterial
                    color={isOn ? '#60a5fa' : '#555555'}
                    metalness={0.7}
                    roughness={0.2}
                    emissive={isOn ? '#1e40af' : '#000000'}
                    emissiveIntensity={isOn ? 0.3 : 0}
                />
            </mesh>

            {/* ── Blades group (rotates on Z-axis) ── */}
            <group ref={bladesRef} position={[0, 0, 0.22]}>
                {[0, 1, 2, 3].map((i) => (
                    <mesh
                        key={i}
                        position={[
                            Math.cos((i * Math.PI) / 2) * 0.28,
                            Math.sin((i * Math.PI) / 2) * 0.28,
                            0,
                        ]}
                        rotation={[0, 0, (i * Math.PI) / 2]}
                    >
                        <boxGeometry args={[bladeWidth, bladeLength, bladeDepth]} />
                        <meshStandardMaterial
                            color="#e2e8f0"
                            metalness={0.3}
                            roughness={0.5}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                ))}
            </group>

            {/* ── Nose cap ── */}
            <mesh position={[0, 0, 0.26]}>
                <sphereGeometry args={[0.04, 16, 16]} />
                <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.2} />
            </mesh>
        </group>
    );
}

/* ── ROOM MODEL — loads the GLTF, auto-scales, and handles click raycasting ── */
function RoomModel({ onMeshClick, deviceStatus }) {
    const { scene } = useGLTF('/room-model/scene.gltf');
    const { camera } = useThree();

    useEffect(() => {
        if (scene) {
            // Compute bounding box to auto-scale oversized / tiny models
            const box = new THREE.Box3().setFromObject(scene);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);

            // Normalize so the longest axis fits in ~5 units
            if (maxDim > 0) {
                const scale = 5 / maxDim;
                scene.scale.setScalar(scale);
            }

            // Re-center after scaling
            const newBox = new THREE.Box3().setFromObject(scene);
            const center = newBox.getCenter(new THREE.Vector3());
            scene.position.sub(center);

            // Move camera to fit
            camera.position.set(5, 5, 5);
            camera.lookAt(0, 0, 0);
            camera.updateProjectionMatrix();

            // Set the monitor to black initially
            scene.traverse((child) => {
                if (child.isMesh && child.name === PC_SCREEN_MESH_NAME) {
                    child.material = blackMaterial;
                }
            });

            // Log all mesh names for debugging
            console.log('[RoomModel] loaded ✔ — meshes in scene:');
            scene.traverse((child) => {
                if (child.isMesh) console.log('  •', child.name || '(unnamed)');
            });
        }
    }, [scene, camera]);

    const handlePointerDown = useCallback(
        (e) => {
            // Stop propagation so only the first (closest) hit registers
            e.stopPropagation();

            const clickedName = e.object.name || e.object.type || 'Unnamed Object';
            console.log('[Raycast] Clicked mesh:', clickedName, e.object);

            if (onMeshClick) {
                onMeshClick(clickedName);
            }
        },
        [onMeshClick]
    );

    return (
        <>
            <primitive object={scene} onPointerDown={handlePointerDown} />
            <MonitorController scene={scene} deviceStatus={deviceStatus} />
        </>
    );
}

/* ── OVERLAY PANEL STYLES ── */
const overlayStyles = {
    panel: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 280,
        background: 'rgba(22, 22, 30, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 14,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
        padding: '20px 22px',
        color: '#f0f0f0',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        zIndex: 100,
        animation: 'fadeSlideIn 0.25s ease-out',
    },
    label: {
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '1.2px',
        color: 'rgba(255, 255, 255, 0.4)',
        marginBottom: 6,
    },
    objectName: {
        fontSize: 16,
        fontWeight: 600,
        color: '#ffffff',
        marginBottom: 18,
        wordBreak: 'break-word',
    },
    buttonRow: {
        display: 'flex',
        gap: 10,
        marginBottom: 12,
    },
    btnOn: {
        flex: 1,
        padding: '10px 0',
        fontSize: 13,
        fontWeight: 600,
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        background: 'linear-gradient(135deg, #34d399, #059669)',
        color: '#fff',
        transition: 'transform 0.15s, box-shadow 0.15s',
    },
    btnOff: {
        flex: 1,
        padding: '10px 0',
        fontSize: 13,
        fontWeight: 600,
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        background: 'linear-gradient(135deg, #f87171, #dc2626)',
        color: '#fff',
        transition: 'transform 0.15s, box-shadow 0.15s',
    },
    btnClose: {
        width: '100%',
        padding: '9px 0',
        fontSize: 12,
        fontWeight: 500,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        cursor: 'pointer',
        background: 'transparent',
        color: 'rgba(255, 255, 255, 0.5)',
        transition: 'background 0.15s, color 0.15s',
    },
};

/* ──────────────────────────────────────────────────────────
 * ROOM LIGHTS (MASTER SWITCH)
 * Bound to the Bedside Lamp ('Object_49'). If ON (or undefined),
 * the room is bright. If OFF, transitions smoothly to a dark/moody state.
 * ────────────────────────────────────────────────────────── */
function RoomLights({ deviceStatus }) {
    const ambientRef = useRef(null);
    const directionalRef = useRef(null);

    // If undefined (initial load), treat as ON so it starts bright
    const isLampOn = deviceStatus['Object_49'] !== false;

    // The user-requested targets for ON vs. OFF
    const targetAmbient = isLampOn ? 1.5 : 0.2;
    const targetDirectional = isLampOn ? 1 : 0.1;

    useFrame((_, delta) => {
        if (!ambientRef.current || !directionalRef.current) return;

        // speed=5 yields ~99% completion over 1 second (1 - e^-5)
        const speed = 5;
        
        ambientRef.current.intensity = THREE.MathUtils.lerp(
            ambientRef.current.intensity,
            targetAmbient,
            1 - Math.exp(-speed * delta)
        );

        directionalRef.current.intensity = THREE.MathUtils.lerp(
            directionalRef.current.intensity,
            targetDirectional,
            1 - Math.exp(-speed * delta)
        );
    });

    return (
        <>
            {/* Initialize with 'ON' values so the first frame is correct */}
            <ambientLight ref={ambientRef} intensity={1.5} />
            <directionalLight ref={directionalRef} position={[10, 10, 5]} intensity={1} />
        </>
    );
}

export default function Dashboard() {
    const [selectedObject, setSelectedObject] = useState(null);

    // Tracks ON/OFF state per device — keyed by mesh name
    const [deviceStatus, setDeviceStatus] = useState({});

    // Only open the panel if the mesh has a friendly name in the dictionary
    const handleMeshClick = useCallback((name) => {
        if (friendlyNames[name]) {
            setSelectedObject(name);
        }
    }, []);

    const handleClose = useCallback(() => {
        setSelectedObject(null);
    }, []);

    const handleTurnOn = useCallback(() => {
        console.log(`[SmartHome] Turning ON: ${selectedObject}`);
        setDeviceStatus((prev) => ({ ...prev, [selectedObject]: true }));
        // TODO: send command to backend
    }, [selectedObject]);

    const handleTurnOff = useCallback(() => {
        console.log(`[SmartHome] Turning OFF: ${selectedObject}`);
        setDeviceStatus((prev) => ({ ...prev, [selectedObject]: false }));
        // TODO: send command to backend
    }, [selectedObject]);

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
            {/* Inline keyframes for the overlay slide-in animation */}
            <style>{`
                @keyframes fadeSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>

            {/* ── 3D Canvas ── */}
            <Canvas camera={{ position: [5, 5, 5], fov: 35 }}>
                <color attach="background" args={['#1e1e1e']} />

                {/* ── Dynamic Room Lighting ── */}
                <RoomLights deviceStatus={deviceStatus} />

                <Suspense fallback={null}>
                    <RoomModel
                        onMeshClick={handleMeshClick}
                        deviceStatus={deviceStatus}
                    />
                </Suspense>

                {/* ── Custom Wall Fan (outside GLTF, R3F primitives) ── */}
                <WallFan
                    isOn={deviceStatus['Wall Fan'] === true}
                    onPointerDown={handleMeshClick}
                />

                <OrbitControls
                    enablePan={false}
                    minPolarAngle={Math.PI / 6}
                    maxPolarAngle={Math.PI / 2.5}
                />
            </Canvas>

            {/* ── Control Overlay (outside Canvas, absolute positioned) ── */}
            {selectedObject && (
                <div style={overlayStyles.panel}>
                    <div style={overlayStyles.label}>Selected Device</div>
                    <div style={overlayStyles.objectName}>{friendlyNames[selectedObject] || selectedObject}</div>

                    <div style={overlayStyles.buttonRow}>
                        <button
                            style={overlayStyles.btnOn}
                            onClick={handleTurnOn}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.04)';
                                e.currentTarget.style.boxShadow = '0 4px 16px rgba(52, 211, 153, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            Turn ON
                        </button>
                        <button
                            style={overlayStyles.btnOff}
                            onClick={handleTurnOff}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.04)';
                                e.currentTarget.style.boxShadow = '0 4px 16px rgba(248, 113, 113, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            Turn OFF
                        </button>
                    </div>

                    <button
                        style={overlayStyles.btnClose}
                        onClick={handleClose}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
                        }}
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
}