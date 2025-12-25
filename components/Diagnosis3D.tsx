
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Diagnosis3DProps {
  disease: string;
}

const Diagnosis3D: React.FC<Diagnosis3DProps> = ({ disease }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const scrollY = useRef(0);

  const diseaseLower = disease.toLowerCase();
  const isHealthy = diseaseLower.includes('healthy');
  const isWilting = diseaseLower.includes('wilt') || diseaseLower.includes('droop') || diseaseLower.includes('blast');
  const isSpotty = diseaseLower.includes('spot') || diseaseLower.includes('fungal');
  const isYellow = diseaseLower.includes('yellow') || diseaseLower.includes('deficiency');

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // Dynamic Physics Parameters based on Disease
    const physics = {
      swayAmp: isWilting ? 0.05 : (isHealthy ? 0.15 : 0.1),
      swayFreq: isWilting ? 0.4 : (isHealthy ? 1.2 : 0.8),
      buoyancy: isWilting ? 1.8 : 0.6, // Wilting leaves hang lower
      elasticity: isHealthy ? 1.0 : 0.3
    };

    // Stem
    const stemColor = isHealthy ? 0x065f46 : (isYellow ? 0xb45309 : 0x2d2d2d);
    const stemGeo = new THREE.CylinderGeometry(0.08, 0.14, 5.5, 24);
    // Add subtle bend to stem geometry
    const stemMat = new THREE.MeshStandardMaterial({ 
      color: stemColor,
      roughness: 0.8,
      metalness: 0.1
    });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    group.add(stem);

    // Leaves
    const leafCount = 14;
    const leaves: { pivot: THREE.Group; mesh: THREE.Mesh; phaseOffset: number }[] = [];
    
    for (let i = 0; i < leafCount; i++) {
      const leafPivot = new THREE.Group();
      
      const leafShape = new THREE.Shape();
      leafShape.moveTo(0, 0);
      leafShape.bezierCurveTo(0.7, 0.5, 0.7, 2.0, 0, 2.6);
      leafShape.bezierCurveTo(-0.7, 2.0, -0.7, 0.5, 0, 0);
      
      const leafGeo = new THREE.ShapeGeometry(leafShape);
      const leafColor = isHealthy ? 0x10b981 : (isYellow ? 0xf59e0b : 0x4d7c0f);
      const leafMat = new THREE.MeshStandardMaterial({ 
        color: leafColor, 
        side: THREE.DoubleSide,
        transparent: isWilting,
        opacity: isWilting ? 0.85 : 1.0,
        roughness: 0.7
      });
      
      const leafMesh = new THREE.Mesh(leafGeo, leafMat);
      
      const angle = (i / leafCount) * Math.PI * 2 + (Math.random() * 0.5);
      leafPivot.position.y = (i - leafCount / 2) * 0.4 - 0.5;
      leafPivot.rotation.y = angle;
      
      // Vertical orientation based on health
      leafMesh.rotation.x = physics.buoyancy + (Math.random() * 0.2);
      leafMesh.scale.set(0.9, 0.9, 0.9);
      
      leafPivot.add(leafMesh);
      leaves.push({ 
        pivot: leafPivot, 
        mesh: leafMesh, 
        phaseOffset: Math.random() * Math.PI * 2 
      });
      group.add(leafPivot);
    }

    // Lighting for depth
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    camera.position.set(0, 1, 10);

    const handleScroll = () => { scrollY.current = window.scrollY; };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const animate = () => {
      requestAnimationFrame(animate);
      const time = Date.now() * 0.001;
      
      // Scroll-linked specimen reaction
      const scrollRotation = (scrollY.current * 0.0004);
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, scrollRotation % 0.4, 0.1);
      group.rotation.y += 0.004;

      // Simulated Wind Multi-layer Noise
      const windForce = Math.sin(time * 0.5) * 0.5 + Math.sin(time * 1.3) * 0.2;
      
      leaves.forEach((leafObj, idx) => {
        const { pivot, mesh, phaseOffset } = leafObj;
        
        // 1. Primary Sway (Global Wind)
        const primarySway = Math.sin(time * physics.swayFreq + phaseOffset) * physics.swayAmp;
        
        // 2. Micro-turbulence (Localized life-jitter)
        const turbulence = Math.sin(time * 4.0 + phaseOffset * 2.0) * (isHealthy ? 0.015 : 0.005);
        
        // Apply wind-gust response
        const gustEffect = windForce * 0.1 * physics.elasticity;
        
        // Update leaf x-rotation (The nodding/sway)
        // Lerp to avoid mechanical snaps
        const targetRotX = physics.buoyancy + primarySway + turbulence + gustEffect;
        mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, targetRotX, 0.1);
        
        // Update leaf z-rotation (The side-to-side flutter)
        mesh.rotation.z = Math.cos(time * 1.1 + phaseOffset) * (physics.swayAmp * 0.4);
        
        // Stem interaction: subtle nudge to the pivot based on wind
        pivot.position.x = Math.sin(time * 0.8 + idx) * 0.01;
      });

      // Subtle stem micro-bend
      stem.rotation.z = Math.sin(time * 0.6) * 0.015 * physics.elasticity;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, [disease]);

  return (
    <div className="relative w-full h-[550px] rounded-[64px] overflow-hidden bg-[#0a0f0d] border border-white/10 shadow-3xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.12),transparent)]" />
      <div ref={mountRef} className="w-full h-full cursor-crosshair" />
      <div className="absolute top-8 left-8 bg-emerald-950/70 backdrop-blur-2xl px-8 py-4 rounded-full border border-emerald-500/30 flex items-center gap-4 shadow-2xl">
         <div className="relative">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute inset-0 animate-ping"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 relative block"></span>
         </div>
         <span className="text-xs font-black text-emerald-50 uppercase tracking-[0.3em]">Haptic Bio-Specimen Feed</span>
      </div>
    </div>
  );
};

export default Diagnosis3D;
