
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Hero3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const scrollPos = useRef(0);
  const velocity = useRef(0);
  const lastScrollPos = useRef(0);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // 1. Biological "Neural Seed"
    const seedGeo = new THREE.IcosahedronGeometry(2, 6);
    const seedMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
      emissive: 0x10b981,
      emissiveIntensity: 0.5
    });
    const seed = new THREE.Mesh(seedGeo, seedMat);
    group.add(seed);

    // Solid growing core
    const coreGeo = new THREE.IcosahedronGeometry(0.5, 2);
    const coreMat = new THREE.MeshStandardMaterial({ 
      color: 0x065f46,
      emissive: 0x34d399,
      emissiveIntensity: 0.3
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // 2. Pollen Field (Particle System)
    const pollenCount = 1000;
    const pollenPos = new Float32Array(pollenCount * 3);
    for (let i = 0; i < pollenCount * 3; i++) {
        pollenPos[i] = (Math.random() - 0.5) * 40;
    }
    const pollenGeo = new THREE.BufferGeometry();
    pollenGeo.setAttribute('position', new THREE.BufferAttribute(pollenPos, 3));
    const pollenMat = new THREE.PointsMaterial({ 
      size: 0.04, 
      color: 0x34d399, 
      transparent: true, 
      opacity: 0.4,
      blending: THREE.AdditiveBlending 
    });
    const pollenPoints = new THREE.Points(pollenGeo, pollenMat);
    scene.add(pollenPoints);

    // 3. AI Bird Flock
    const birds: THREE.Mesh[] = [];
    const birdCount = 30;
    const birdGeo = new THREE.ConeGeometry(0.06, 0.3, 3);
    birdGeo.rotateX(Math.PI / 2);
    const birdMat = new THREE.MeshStandardMaterial({ color: 0x064e3b });

    for (let i = 0; i < birdCount; i++) {
      const bird = new THREE.Mesh(birdGeo, birdMat);
      bird.userData = {
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.7,
        radius: 6 + Math.random() * 8,
        yOffset: (Math.random() - 0.5) * 5
      };
      birds.push(bird);
      scene.add(bird);
    }

    const light = new THREE.PointLight(0xffffff, 35);
    light.position.set(5, 5, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));

    camera.position.z = 15;

    const onScroll = () => {
      scrollPos.current = window.scrollY;
      velocity.current = Math.abs(scrollPos.current - lastScrollPos.current);
      lastScrollPos.current = scrollPos.current;
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const animate = () => {
      requestAnimationFrame(animate);
      const time = Date.now() * 0.001;
      const scrollFactor = scrollPos.current * 0.0012;
      const v = velocity.current * 0.01;
      velocity.current *= 0.9; // Decay

      // Scroll-Sync Transformations
      group.position.y = -scrollFactor * 8;
      group.position.z = Math.min(scrollFactor * 10, 10); // Seed approaches camera
      group.rotation.y = time * 0.2 + scrollFactor * 4;
      group.rotation.z = Math.sin(time * 0.5) * 0.1;
      
      // Seed "Blooms" (Expands wireframe)
      seed.scale.setScalar(1 + scrollFactor * 0.8 + Math.sin(time) * 0.05);
      seedMat.opacity = 0.2 + (scrollFactor * 0.3) + (v * 0.2);
      core.scale.setScalar(0.7 + Math.sin(time * 2) * 0.1);

      // Flocking formation reacts to scroll speed
      birds.forEach(bird => {
        const d = bird.userData;
        const formationSpeed = (d.speed + v * 3) * (1 + scrollFactor);
        const angle = (time * formationSpeed) + d.phase;
        
        const prevPos = bird.position.clone();
        bird.position.set(
          Math.cos(angle) * d.radius,
          d.yOffset + Math.sin(time * 0.5 + d.phase) * 2 - (scrollFactor * 5),
          Math.sin(angle) * d.radius
        );
        bird.lookAt(bird.position.clone().add(bird.position.clone().sub(prevPos)));
      });

      pollenPoints.rotation.y += 0.001 + v * 0.01;
      pollenPoints.position.y = -scrollFactor * 10;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', handleResize);
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="w-full h-[500px] md:h-[750px] pointer-events-none" />;
};

export default Hero3D;
