"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface Page3DScrollSceneProps {
  className?: string;
}

export function Page3DScrollScene({ className = "" }: Page3DScrollSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // WebGL Renderer setup
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      window.setTimeout(() => setIsSupported(false), 0);
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // Scene & Perspective Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 15);

    // Studio Lighting matching Midnight Indigo & Electric Periwinkle
    const ambientLight = new THREE.AmbientLight(0x1a2a4b, 1.6);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0x7185ff, 3.2);
    mainLight.position.set(8, 10, 8);
    scene.add(mainLight);

    const cyanPointLight = new THREE.PointLight(0x55d6e8, 4.0, 25);
    cyanPointLight.position.set(-8, -6, 6);
    scene.add(cyanPointLight);

    const purplePointLight = new THREE.PointLight(0x899aff, 3.0, 20);
    purplePointLight.position.set(6, -8, -4);
    scene.add(purplePointLight);

    // Master Group
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // =========================================================================
    // The Single Central 3D Knowledge Core Model
    // =========================================================================
    const coreModel = new THREE.Group();
    masterGroup.add(coreModel);

    // 1. Central Faceted Polyhedron
    const coreGeo = new THREE.IcosahedronGeometry(2.2, 0);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x080d1c,
      emissive: 0x7185ff,
      emissiveIntensity: 0.55,
      roughness: 0.2,
      metalness: 0.85,
      transmission: 0.5,
      ior: 1.5,
      reflectivity: 0.9,
      transparent: true,
      opacity: 0.9,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreModel.add(coreMesh);

    // Wireframe overlay in Electric Cyan
    const coreWireGeo = new THREE.IcosahedronGeometry(2.22, 0);
    const coreWireMat = new THREE.MeshBasicMaterial({
      color: 0x55d6e8,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    });
    const coreWireMesh = new THREE.Mesh(coreWireGeo, coreWireMat);
    coreModel.add(coreWireMesh);

    // Inner Glowing Core
    const innerGlowGeo = new THREE.SphereGeometry(1.1, 24, 24);
    const innerGlowMat = new THREE.MeshBasicMaterial({
      color: 0x7185ff,
      transparent: true,
      opacity: 0.5,
    });
    const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    coreModel.add(innerGlow);

    // 2. Gyroscopic Orbital Rings (Precision Data Paths)
    const ringGroup = new THREE.Group();
    coreModel.add(ringGroup);

    const createRing = (radius: number, tube: number, color: number, rotX: number, rotY: number) => {
      const ringGeo = new THREE.TorusGeometry(radius, tube, 16, 120);
      const ringMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.45,
        metalness: 0.9,
        roughness: 0.15,
        transparent: true,
        opacity: 0.8,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = rotX;
      ring.rotation.y = rotY;
      return ring;
    };

    const ring1 = createRing(3.4, 0.03, 0x7185ff, Math.PI / 4, 0);
    const ring2 = createRing(3.9, 0.025, 0x55d6e8, -Math.PI / 3, Math.PI / 6);
    const ring3 = createRing(4.4, 0.02, 0x4adea6, Math.PI / 6, -Math.PI / 4);
    ringGroup.add(ring1);
    ringGroup.add(ring2);
    ringGroup.add(ring3);

    // 3. Constellation Knowledge Nodes & Connectors
    const nodeTopics = [
      { pos: [3.2, 1.5, 1.2], color: 0x55d6e8 },
      { pos: [-2.8, 2.4, -0.8], color: 0x7185ff },
      { pos: [1.8, -3.1, 2.0], color: 0x4adea6 },
      { pos: [-3.0, -1.8, 1.5], color: 0x899aff },
      { pos: [0.5, 3.4, -1.6], color: 0xf4f7ff },
    ];

    const nodeGroup = new THREE.Group();
    coreModel.add(nodeGroup);

    nodeTopics.forEach((topic) => {
      const nodeGeo = new THREE.SphereGeometry(0.24, 16, 16);
      const nodeMat = new THREE.MeshStandardMaterial({
        color: topic.color,
        emissive: topic.color,
        emissiveIntensity: 0.9,
        roughness: 0.1,
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.set(topic.pos[0], topic.pos[1], topic.pos[2]);
      nodeGroup.add(nodeMesh);

      // Connecting filament to center
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(topic.pos[0], topic.pos[1], topic.pos[2]),
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: topic.color,
        transparent: true,
        opacity: 0.35,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      nodeGroup.add(line);
    });

    // 4. Ambient Constellation Particle Field
    const particleCount = 350;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 45;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 4;

      const choice = Math.random();
      if (choice > 0.6) {
        // Cyan
        particleColors[i * 3] = 0.33;
        particleColors[i * 3 + 1] = 0.84;
        particleColors[i * 3 + 2] = 0.91;
      } else if (choice > 0.3) {
        // Periwinkle
        particleColors[i * 3] = 0.44;
        particleColors[i * 3 + 1] = 0.52;
        particleColors[i * 3 + 2] = 1.0;
      } else {
        // Soft Star
        particleColors[i * 3] = 0.85;
        particleColors[i * 3 + 1] = 0.88;
        particleColors[i * 3 + 2] = 0.95;
      }
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.065,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    masterGroup.add(particles);

    // =========================================================================
    // Scroll & Mouse Parallax System
    // =========================================================================
    let scrollProgress = 0;
    const targetScroll = { progress: 0 };
    const mouse = { x: 0, y: 0 };
    const targetMouse = { x: 0, y: 0 };

    function onScroll() {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll > 0) {
        targetScroll.progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      }
    }

    function onPointerMove(e: PointerEvent) {
      targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    onScroll();

    // Resize Handler
    function handleResize() {
      if (!container) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }

    window.addEventListener("resize", handleResize);

    // =========================================================================
    // Animation Loop with Cinematic Scroll Transformation
    // =========================================================================
    let animId: number;
    const clock = new THREE.Clock();

    function animate() {
      animId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth interpolation for scroll and mouse
      scrollProgress += (targetScroll.progress - scrollProgress) * 0.05;
      mouse.x += (targetMouse.x - mouse.x) * 0.04;
      mouse.y += (targetMouse.y - mouse.y) * 0.04;

      // Master subtle mouse parallax
      masterGroup.rotation.x = -mouse.y * 0.15;
      masterGroup.rotation.y = mouse.x * 0.2;

      // Continuous Gyroscopic Spin
      if (!prefersReducedMotion) {
        ring1.rotation.z += delta * 0.3;
        ring2.rotation.z -= delta * 0.24;
        ring3.rotation.y += delta * 0.18;
        coreMesh.rotation.y += delta * 0.15;
        coreWireMesh.rotation.y += delta * 0.15;

        // Subtle core pulsing
        const pulse = Math.sin(elapsed * 2.0) * 0.04 + 1.0;
        coreMesh.scale.set(pulse, pulse, pulse);
        coreWireMesh.scale.set(pulse, pulse, pulse);
        innerGlow.scale.set(pulse * 1.05, pulse * 1.05, pulse * 1.05);

        // Slow constellation drift
        particles.rotation.y = elapsed * 0.015;
      }

      // =======================================================================
      // Scroll Transformation Path
      // Moves the single 3D model through 5 stages of the landing page:
      // 0.00 (Hero): Right flank, elevated
      // 0.25 (Sandbox): Center-right, tilted
      // 0.50 (Features): Left flank, expanded
      // 0.75 (Workflow): Center-depth, elevated
      // 1.00 (FAQ/CTA): Center lower horizon
      // =======================================================================
      const sp = scrollProgress; // 0.0 to 1.0

      let targetX = 0;
      let targetY = 0;
      let targetZ = 0;
      let targetRotY = 0;
      let targetRotX = 0;
      let targetScale = 1.0;

      if (sp < 0.25) {
        // Stage 1: Hero -> Sandbox transition
        const t = sp / 0.25;
        // On desktop, Hero puts model on right side; on small screens, center
        const isDesktop = window.innerWidth >= 1024;
        const startX = isDesktop ? 4.2 : 0;
        targetX = THREE.MathUtils.lerp(startX, 0.5, t);
        targetY = THREE.MathUtils.lerp(0.3, -0.6, t);
        targetZ = THREE.MathUtils.lerp(0, -1.5, t);
        targetRotY = THREE.MathUtils.lerp(0, 1.4, t);
        targetRotX = THREE.MathUtils.lerp(0.2, 0.4, t);
        targetScale = THREE.MathUtils.lerp(1.0, 0.9, t);
      } else if (sp < 0.50) {
        // Stage 2: Sandbox -> Features transition
        const t = (sp - 0.25) / 0.25;
        targetX = THREE.MathUtils.lerp(0.5, -4.0, t);
        targetY = THREE.MathUtils.lerp(-0.6, 0.2, t);
        targetZ = THREE.MathUtils.lerp(-1.5, -0.8, t);
        targetRotY = THREE.MathUtils.lerp(1.4, 2.8, t);
        targetRotX = THREE.MathUtils.lerp(0.4, -0.2, t);
        targetScale = THREE.MathUtils.lerp(0.9, 1.1, t);
      } else if (sp < 0.75) {
        // Stage 3: Features -> Workflow transition
        const t = (sp - 0.50) / 0.25;
        targetX = THREE.MathUtils.lerp(-4.0, 0.0, t);
        targetY = THREE.MathUtils.lerp(0.2, 0.8, t);
        targetZ = THREE.MathUtils.lerp(-0.8, -2.5, t);
        targetRotY = THREE.MathUtils.lerp(2.8, 4.2, t);
        targetRotX = THREE.MathUtils.lerp(-0.2, 0.3, t);
        targetScale = THREE.MathUtils.lerp(1.1, 1.25, t);
      } else {
        // Stage 4: Workflow -> FAQ & CTA
        const t = (sp - 0.75) / 0.25;
        targetX = THREE.MathUtils.lerp(0.0, 0.0, t);
        targetY = THREE.MathUtils.lerp(0.8, -2.8, t);
        targetZ = THREE.MathUtils.lerp(-2.5, -1.0, t);
        targetRotY = THREE.MathUtils.lerp(4.2, 5.8, t);
        targetRotX = THREE.MathUtils.lerp(0.3, 0.1, t);
        targetScale = THREE.MathUtils.lerp(1.25, 0.85, t);
      }

      // Smoothly apply scroll transformation to coreModel
      coreModel.position.x += (targetX - coreModel.position.x) * 0.08;
      coreModel.position.y += (targetY - coreModel.position.y) * 0.08;
      coreModel.position.z += (targetZ - coreModel.position.z) * 0.08;
      coreModel.rotation.y += (targetRotY - coreModel.rotation.y) * 0.06;
      coreModel.rotation.x += (targetRotX - coreModel.rotation.x) * 0.06;
      coreModel.scale.setScalar(
        coreModel.scale.x + (targetScale - coreModel.scale.x) * 0.08
      );

      renderer.render(scene, camera);
    }

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", handleResize);

      scene.clear();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (!isSupported) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    />
  );
}
