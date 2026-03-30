/**
 * SceneObjects.tsx — Individual 3D object components with animations.
 * Each wraps a Three.js primitive and applies the animation from scene data.
 */

import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { SceneObject, SceneConnection } from './scenePresets';

/* ───── helpers ───── */
const vec3 = (arr: [number, number, number]) => new THREE.Vector3(...arr);

/* ───── Animated wrapper — applies animation to any mesh ref ───── */
function useAnimation(
  ref: React.RefObject<THREE.Mesh | THREE.Group>,
  animation: string,
  speed: number,
  basePos: [number, number, number],
) {
  const offset = useMemo(() => Math.random() * Math.PI * 2, []);
  const radius = useMemo(() => Math.sqrt(basePos[0] ** 2 + basePos[2] ** 2) || 2, [basePos]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed + offset;

    switch (animation) {
      case 'rotate':
        ref.current.rotation.y = t;
        break;
      case 'pulse': {
        const s = 1 + Math.sin(t * 2) * 0.08;
        ref.current.scale.setScalar(s);
        break;
      }
      case 'orbit':
        ref.current.position.x = Math.cos(t) * radius;
        ref.current.position.z = Math.sin(t) * radius;
        break;
      case 'wave':
        ref.current.position.y = Math.sin(t * 2) * 1.2;
        break;
      case 'float':
        ref.current.position.y = basePos[1] + Math.sin(t) * 0.3;
        ref.current.position.x = basePos[0] + Math.cos(t * 0.5) * 0.4;
        break;
      default:
        break;
    }
  });
}

/* ───── Tooltip on hover ───── */
interface TooltipProps { text: string; visible: boolean }
const Tooltip: React.FC<TooltipProps> = ({ text, visible }) =>
  visible ? (
    <Html center distanceFactor={8} style={{ pointerEvents: 'none' }}>
      <div style={{
        background: 'rgba(15,23,42,0.92)',
        color: '#f1f5f9',
        padding: '8px 14px',
        borderRadius: '12px',
        fontSize: '12px',
        maxWidth: '220px',
        lineHeight: '1.4',
        fontWeight: 600,
        border: '1px solid rgba(148,163,184,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(8px)',
      }}>
        {text}
      </div>
    </Html>
  ) : null;

/* ───── Single scene object ───── */
export const SceneObjectMesh: React.FC<{ 
  obj: SceneObject; 
  isFocused?: boolean; 
}> = ({ obj, isFocused }) => {
  const ref = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  useAnimation(ref, obj.animation, obj.animationSpeed, obj.position);

  const materialProps: any = {
    color: obj.color,
    transparent: obj.opacity < 1,
    opacity: obj.opacity,
  };
  if (obj.emissive || isFocused) {
    materialProps.emissive = isFocused ? '#ffffff' : obj.color;
    materialProps.emissiveIntensity = isFocused ? 0.8 : 0.4;
  }

  const geometry = (() => {
    switch (obj.type) {
      case 'sphere': return <sphereGeometry args={[0.5, 32, 32]} />;
      case 'box': return <boxGeometry args={[1, 1, 1]} />;
      case 'cylinder': return <cylinderGeometry args={[0.3, 0.3, 1, 32]} />;
      case 'torus': return <torusGeometry args={[0.5, 0.15, 16, 48]} />;
      case 'ring': return <ringGeometry args={[0.9, 1, 64]} />;
      case 'cone': return <coneGeometry args={[0.5, 1, 32]} />;
      default: return <sphereGeometry args={[0.5, 32, 32]} />;
    }
  })();

  if (obj.type === 'text3d') {
    return (
      <group position={obj.position}>
        <Text
          fontSize={0.35}
          color={obj.color}
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          {obj.label}
        </Text>
      </group>
    );
  }

  return (
    <mesh
      ref={ref}
      position={obj.position}
      scale={obj.scale}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
    >
      {geometry}
      <meshStandardMaterial {...materialProps} />
      {obj.label && hovered && (
        <Html center distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: obj.color,
            color: '#fff',
            padding: '3px 10px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          }}>
            {obj.label}
          </div>
        </Html>
      )}
      <Tooltip text={obj.tooltip} visible={hovered} />
    </mesh>
  );
};

/* ───── Connection line between two objects ───── */
export const ConnectionLine: React.FC<{
  conn: SceneConnection;
  objectsMap: Record<string, SceneObject>;
}> = ({ conn, objectsMap }) => {
  const from = objectsMap[conn.from];
  const to = objectsMap[conn.to];
  if (!from || !to) return null;

  const points = [vec3(from.position), vec3(to.position)];
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = useMemo(() => new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({
    color: conn.color || '#64748b',
    transparent: true,
    opacity: 0.5
  })), [lineGeometry, conn.color]);

  return <primitive object={line} />;
};

/* ───── Floating annotation ───── */
export const AnnotationLabel: React.FC<{ text: string; position: [number, number, number] }> = ({
  text,
  position,
}) => (
  <Html center position={position} style={{ pointerEvents: 'none' }}>
    <div style={{
      background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
      border: '1px solid rgba(99,102,241,0.3)',
      color: '#e2e8f0',
      padding: '6px 14px',
      borderRadius: '10px',
      fontSize: '11px',
      fontWeight: 700,
      maxWidth: '200px',
      textAlign: 'center',
      backdropFilter: 'blur(4px)',
    }}>
      {text}
    </div>
  </Html>
);
