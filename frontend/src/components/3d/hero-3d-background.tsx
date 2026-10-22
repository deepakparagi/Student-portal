"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface Hero3DBackgroundProps {
  className?: string;
}

export function Hero3DBackground({ className = "" }: Hero3DBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Renderer setup
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

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 700;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // Scene & Perspective Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 18);

    // Dynamic Lighting matching Midnight Indigo & Electric Periwinkle
    const ambientLight = new THREE.AmbientLight(0x1a2a4b, 1.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x7185ff, 3.2);
    keyLight.position.set(10, 12, 10);
    scene.add(keyLight);

    const cyanRimLight = new THREE.PointLight(0x55d6e8, 4.5, 30);
    cyanRimLight.position.set(-12, -8, 8);
    scene.add(cyanRimLight);

    const violetFillLight = new THREE.PointLight(0x899aff, 3.0, 25);
    violetFillLight.position.set(8, -10, -5);
    scene.add(violetFillLight);

    // Master Group for Mouse Parallax
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // =========================================================================
    // 1. Floating 3D Geometric Polyhedra (Deep Academic & AI Core Symbols)
    // =========================================================================
    const floatingObjects: {
      mesh: THREE.Object3D;
      rotSpeedX: number;
      rotSpeedY: number;
      rotSpeedZ: number;
      floatSpeed: number;
      floatDist: number;
      initialY: number;
      initialX: number;
    }[] = [];

    // Palette Colors for 3D Elements
    const periwinkleColor = new THREE.Color(0x7185ff);
    const cyanColor = new THREE.Color(0x55d6e8);
    const emeraldColor = new THREE.Color(0x4adea6);
    const deepIndigoColor = new THREE.Color(0x111e3b);
    const borderBrightColor = new THREE.Color(0x445d8c);

    // Helper to create glossy / physical translucent materials
    const createGlossyMaterial = (color: THREE.Color, roughness = 0.2, transmission = 0.4) => {
      return new THREE.MeshPhysicalMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.35,
        roughness,
        metalness: 0.8,
        transmission,
        ior: 1.45,
        reflectivity: 0.8,
        transparent: true,
        opacity: 0.85,
      });
    };

    const wireframeMaterial = (color: THREE.Color, opacity = 0.4) => {
      return new THREE.MeshBasicMaterial({
        color,
        wireframe: true,
        transparent: true,
        opacity,
      });
    };

    // Item A: Left Upper Floating Faceted Icosahedron (Core Knowledge Crystal)
    const icosaGroup = new THREE.Group();
    const icosaGeo = new THREE.IcosahedronGeometry(2.2, 0);
    const icosaMesh = new THREE.Mesh(icosaGeo, createGlossyMaterial(periwinkleColor, 0.25, 0.5));
    const icosaWire = new THREE.Mesh(new THREE.IcosahedronGeometry(2.22, 0), wireframeMaterial(cyanColor, 0.7));
    icosaGroup.add(icosaMesh);
    icosaGroup.add(icosaWire);
    icosaGroup.position.set(-14, 6, -4);
    masterGroup.add(icosaGroup);
    floatingObjects.push({
      mesh: icosaGroup,
      rotSpeedX: 0.12,
      rotSpeedY: 0.16,
      rotSpeedZ: 0.08,
      floatSpeed: 0.8,
      floatDist: 0.6,
      initialY: 6,
      initialX: -14,
    });

    // Item B: Left Lower Floating Octahedron (Precision Matrix)
    const octaGroup = new THREE.Group();
    const octaGeo = new THREE.OctahedronGeometry(1.6, 0);
    const octaMesh = new THREE.Mesh(octaGeo, createGlossyMaterial(cyanColor, 0.15, 0.6));
    const octaWire = new THREE.Mesh(new THREE.OctahedronGeometry(1.62, 0), wireframeMaterial(periwinkleColor, 0.8));
    octaGroup.add(octaMesh);
    octaGroup.add(octaWire);
    octaGroup.position.set(-11, -7, -2);
    masterGroup.add(octaGroup);
    floatingObjects.push({
      mesh: octaGroup,
      rotSpeedX: 0.2,
      rotSpeedY: -0.15,
      rotSpeedZ: 0.1,
      floatSpeed: 1.1,
      floatDist: 0.45,
      initialY: -7,
      initialX: -11,
    });

    // Item C: Right Upper Floating Torus Knot (Continuous Learning Orbit)
    const knotGroup = new THREE.Group();
    const knotGeo = new THREE.TorusKnotGeometry(1.5, 0.35, 80, 16, 2, 3);
    const knotMesh = new THREE.Mesh(knotGeo, createGlossyMaterial(borderBrightColor, 0.3, 0.3));
    const knotWire = new THREE.Mesh(new THREE.TorusKnotGeometry(1.51, 0.355, 80, 16, 2, 3), wireframeMaterial(cyanColor, 0.5));
    knotGroup.add(knotMesh);
    knotGroup.add(knotWire);
    knotGroup.position.set(13, 7, -5);
    masterGroup.add(knotGroup);
    floatingObjects.push({
      mesh: knotGroup,
      rotSpeedX: 0.14,
      rotSpeedY: 0.18,
      rotSpeedZ: -0.1,
      floatSpeed: 0.7,
      floatDist: 0.5,
      initialY: 7,
      initialX: 13,
    });

    // Item D: Right Lower Floating Dodecahedron (Active Recall Polytope)
    const dodecaGroup = new THREE.Group();
    const dodecaGeo = new THREE.DodecahedronGeometry(1.8, 0);
    const dodecaMesh = new THREE.Mesh(dodecaGeo, createGlossyMaterial(periwinkleColor, 0.2, 0.4));
    const dodecaWire = new THREE.Mesh(new THREE.DodecahedronGeometry(1.82, 0), wireframeMaterial(emeraldColor, 0.75));
    dodecaGroup.add(dodecaMesh);
    dodecaGroup.add(dodecaWire);
    dodecaGroup.position.set(15, -6, -3);
    masterGroup.add(dodecaGroup);
    floatingObjects.push({
      mesh: dodecaGroup,
      rotSpeedX: -0.16,
      rotSpeedY: 0.22,
      rotSpeedZ: 0.12,
      floatSpeed: 0.9,
      floatDist: 0.55,
      initialY: -6,
      initialX: 15,
    });

    // Item E: Center Deep Giant Ambient Gyroscopic Rings
    const centerRingGroup = new THREE.Group();
    centerRingGroup.position.set(0, 0, -8);
    masterGroup.add(centerRingGroup);

    const ringMatA = new THREE.MeshStandardMaterial({
      color: 0x7185ff,
      emissive: 0x7185ff,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.4,
    });
    const ringA = new THREE.Mesh(new THREE.TorusGeometry(8.5, 0.04, 16, 120), ringMatA);
    ringA.rotation.x = Math.PI / 3;
    centerRingGroup.add(ringA);

    const ringMatB = new THREE.MeshStandardMaterial({
      color: 0x55d6e8,
      emissive: 0x55d6e8,
      emissiveIntensity: 0.6,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.35,
    });
    const ringB = new THREE.Mesh(new THREE.TorusGeometry(10.2, 0.035, 16, 120), ringMatB);
    ringB.rotation.y = -Math.PI / 4;
    ringB.rotation.z = Math.PI / 6;
    centerRingGroup.add(ringB);

    // =========================================================================
    // 2. High-Density Knowledge Constellation / Particle Field
    // =========================================================================
    const particleCount = 420;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Spread across wide panorama
      particlePositions[i * 3] = (Math.random() - 0.5) * 44;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 26;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 2;

      // Color variation between Periwinkle (#7185FF), Cyan (#55D6E8), and White
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
        // Crisp Starlight
        particleColors[i * 3] = 0.95;
        particleColors[i * 3 + 1] = 0.97;
        particleColors[i * 3 + 2] = 1.0;
      }
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.07,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    masterGroup.add(particles);

    // =========================================================================
    // 3. Subtle Cyber Perspective Grid on the Floor
    // =========================================================================
    const gridHelper = new THREE.GridHelper(50, 40, 0x7185ff, 0x1a2a4b);
    gridHelper.position.y = -11;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.18;
    masterGroup.add(gridHelper);

    // =========================================================================
    // 4. Mouse Move & Parallax Controls
    // =========================================================================
    const targetRotation = { x: 0, y: 0 };
    const currentRotation = { x: 0, y: 0 };

    function onPointerMove(e: PointerEvent) {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;

      targetRotation.y = x * 0.35;
      targetRotation.x = -y * 0.25;
    }

    window.addEventListener("pointermove", onPointerMove);

    // Resize Handler
    function handleResize() {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth === 0 || newHeight === 0) return;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    }

    window.addEventListener("resize", handleResize);

    // Visibility Observer to save battery / GPU when scrolled away
    let isVisible = true;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    // =========================================================================
    // 5. Animation Loop
    // =========================================================================
    let animId: number;
    const clock = new THREE.Clock();

    function animate() {
      animId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth inertia parallax on mouse movement
      currentRotation.x += (targetRotation.x - currentRotation.x) * 0.04;
      currentRotation.y += (targetRotation.y - currentRotation.y) * 0.04;

      masterGroup.rotation.x = currentRotation.x;
      masterGroup.rotation.y = currentRotation.y;

      // Independent continuous rotations
      if (!prefersReducedMotion) {
        floatingObjects.forEach((obj, idx) => {
          obj.mesh.rotation.x += delta * obj.rotSpeedX;
          obj.mesh.rotation.y += delta * obj.rotSpeedY;
          obj.mesh.rotation.z += delta * obj.rotSpeedZ;

          // Sinusoidal buoyancy
          obj.mesh.position.y =
            obj.initialY + Math.sin(elapsed * obj.floatSpeed + idx) * obj.floatDist;
          obj.mesh.position.x =
            obj.initialX + Math.cos(elapsed * (obj.floatSpeed * 0.7) + idx) * (obj.floatDist * 0.4);
        });

        // Rotate central ambient rings
        ringA.rotation.z += delta * 0.12;
        ringB.rotation.z -= delta * 0.09;

        // Subtle slow constellation drift
        particles.rotation.y = elapsed * 0.02;
        particles.rotation.x = Math.sin(elapsed * 0.03) * 0.05;
      }

      renderer.render(scene, camera);
    }

    animate();

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", onPointerMove);

      // Clean up Three.js resources
      scene.clear();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (!isSupported) {
    return (
      <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#7185FF]/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#55D6E8]/10 blur-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    />
  );
}
