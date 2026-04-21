import React, { Suspense, useEffect, useState, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, useVideoTexture } from '@react-three/drei';
import * as THREE from 'three';

/* ─────────────────────────────────────────────────────────
 * CONFIGURATION — Video texture mesh targets
 * ───────────────────────────────────────────────────────── */
const PC_SCREEN_MESH_NAME = 'Object_34';    // ← mesh name for the PC monitor
const WINDOW_MESH_NAME = 'Object_6';        // ← mesh name for the window glass

/* ─────────────────────────────────────────────────────────
 * FRIENDLY NAMES — Maps raw mesh names to display labels.
 * Only meshes listed here will open the control panel.
 * Add more entries as you identify objects in the scene.
 * ───────────────────────────────────────────────────────── */
const friendlyNames = {
    'Object_34': 'Smart Hub',
    'Object_6':  'Window Display',
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
    // Add more as needed: 'Object_XX': 'Friendly Name',
};

/* ── VIDEO TEXTURES — loaded inside the Canvas via Drei ── */
function VideoTextures({ scene }) {
    // useVideoTexture auto-creates a <video> element that loops + autoplays
    const pcTexture = useVideoTexture('/pc-screen.mp4', {
        loop: true,
        muted: true,    // required for autoplay in most browsers
        start: true,
    });

    const windowTexture = useVideoTexture('/window-view.mp4', {
        loop: true,
        muted: true,
        start: true,
    });

    useEffect(() => {
        if (!scene) return;

        /* ── Fix texture encoding so colors look correct ── */
        pcTexture.encoding = THREE.sRGBEncoding;
        windowTexture.encoding = THREE.sRGBEncoding;

        /* ──────────────────────────────────────────────────
         * TEXTURE FLIP / ROTATION FIX
         * If a video maps upside-down or mirrored, uncomment
         * the relevant lines below:
         *
         * Flip vertically:
         *   pcTexture.flipY = false;
         *
         * Rotate 180°:
         *   pcTexture.center.set(0.5, 0.5);
         *   pcTexture.rotation = Math.PI;
         *
         * Rotate 90° clockwise:
         *   pcTexture.center.set(0.5, 0.5);
         *   pcTexture.rotation = -Math.PI / 2;
         *
         * Mirror horizontally:
         *   pcTexture.repeat.x = -1;
         *   pcTexture.wrapS = THREE.RepeatWrapping;
         * ────────────────────────────────────────────────── */

        scene.traverse((child) => {
            if (!child.isMesh) return;

            // Apply PC screen video to the monitor mesh
            if (child.name === PC_SCREEN_MESH_NAME) {
                child.material = new THREE.MeshBasicMaterial({
                    map: pcTexture,
                    toneMapped: false,   // keep video colors vibrant (no tone-mapping)
                });
                child.material.needsUpdate = true;
                console.log('[VideoTex] Applied pc-screen.mp4 →', child.name);
            }

            // Apply window view video to the window mesh
            if (child.name === WINDOW_MESH_NAME) {
                child.material = new THREE.MeshBasicMaterial({
                    map: windowTexture,
                    toneMapped: false,
                });
                child.material.needsUpdate = true;
                console.log('[VideoTex] Applied window-view.mp4 →', child.name);
            }
        });
    }, [scene, pcTexture, windowTexture]);

    return null; // This component only applies side-effects
}

/* ── ROOM MODEL — loads the GLTF, auto-scales, and handles click raycasting ── */
function RoomModel({ onMeshClick }) {
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
            {/* Video textures are applied as a child so they share the Canvas context */}
            <VideoTextures scene={scene} />
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

export default function Dashboard() {
    const [selectedObject, setSelectedObject] = useState(null);

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
        // TODO: send command to backend
    }, [selectedObject]);

    const handleTurnOff = useCallback(() => {
        console.log(`[SmartHome] Turning OFF: ${selectedObject}`);
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

                <ambientLight intensity={2} />
                <directionalLight position={[10, 10, 5]} intensity={1.5} />

                <Suspense fallback={null}>
                    <RoomModel onMeshClick={handleMeshClick} />
                </Suspense>

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