"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface KnowledgeCoreProps {
  className?: string;
  interactive?: boolean;
}

export function KnowledgeCore({ className = "", interactive = true }: KnowledgeCoreProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<{ name: string; citation: string } | null>(null);
  const [isWebGLEnabled, setIsWebGLEnabled] = useState<boolean>(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Check WebGL availability
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      window.setTimeout(() => setIsWebGLEnabled(false), 0);
      return;
    }

    const width = container.clientWidth || 450;
    const height = container.clientHeight || 450;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.8);

    // Lighting (Midnight Indigo & Electric Periwinkle Spectrum)
    const ambientLight = new THREE.AmbientLight(0x1a2a4b, 1.5);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0x7185ff, 3.2);
    mainLight.position.set(5, 5, 5);
    scene.add(mainLight);

    const cyanPointLight = new THREE.PointLight(0x55d6e8, 4.0, 15);
    cyanPointLight.position.set(-4, -2, 3);
    scene.add(cyanPointLight);

    const purplePointLight = new THREE.PointLight(0x899aff, 3.0, 12);
    purplePointLight.position.set(3, -4, -2);
    scene.add(purplePointLight);

    // Main Group
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // 1. Central Faceted Polyhedron (Synthesis Core)
    const coreGeo = new THREE.IcosahedronGeometry(1.4, 0);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x080d1c,
      emissive: 0x7185ff,
      emissiveIntensity: 0.55,
      roughness: 0.15,
      metalness: 0.85,
      transmission: 0.45,
      ior: 1.5,
      reflectivity: 0.9,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(coreMesh);

    // Wireframe overlay in Electric Cyan
    const coreWireGeo = new THREE.IcosahedronGeometry(1.41, 0);
    const coreWireMat = new THREE.MeshBasicMaterial({
      color: 0x55d6e8,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    });
    const coreWireMesh = new THREE.Mesh(coreWireGeo, coreWireMat);
    coreGroup.add(coreWireMesh);

    // Inner glowing core
    const innerGlowGeo = new THREE.SphereGeometry(0.7, 16, 16);
    const innerGlowMat = new THREE.MeshBasicMaterial({
      color: 0x7185ff,
      transparent: true,
      opacity: 0.5,
    });
    const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    coreGroup.add(innerGlow);

    // 2. Orbital Rings (Gyroscopic Precision in Periwinkle, Cyan, Emerald)
    const ringGroup = new THREE.Group();
    coreGroup.add(ringGroup);

    const createRing = (radius: number, tube: number, color: number, rotX: number, rotY: number) => {
      const ringGeo = new THREE.TorusGeometry(radius, tube, 16, 100);
      const ringMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.45,
        metalness: 0.9,
        roughness: 0.15,
        transparent: true,
        opacity: 0.85,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = rotX;
      ring.rotation.y = rotY;
      return ring;
    };

    const ring1 = createRing(2.1, 0.022, 0x7185ff, Math.PI / 4, 0);
    const ring2 = createRing(2.4, 0.018, 0x55d6e8, -Math.PI / 3, Math.PI / 6);
    const ring3 = createRing(2.7, 0.016, 0x4adea6, Math.PI / 6, -Math.PI / 4);
    ringGroup.add(ring1);
    ringGroup.add(ring2);
    ringGroup.add(ring3);

    // 3. Constellation Knowledge Nodes (Subjects with real syllabus grounding)
    const nodeTopics = [
      {
        name: "Cellular Biology",
        citation: "Chapter 4: Membrane Dynamics (Page 42)",
        pos: [2.3, 1.1, 0.8],
        color: 0x55d6e8,
      },
      {
        name: "Data Structures",
        citation: "Lecture 8: Graph Traversal & BFS (Slide 16)",
        pos: [-1.9, 1.8, -0.6],
        color: 0x7185ff,
      },
      {
        name: "Organic Chemistry",
        citation: "Unit 3: Reaction Mechanisms (Page 112)",
        pos: [1.2, -2.2, 1.4],
        color: 0x4adea6,
      },
      {
        name: "Linear Algebra",
        citation: "Section 2.4: Eigenvalues & Vector Spaces",
        pos: [-2.1, -1.3, 1.1],
        color: 0x899aff,
      },
      {
        name: "Microeconomics",
        citation: "Ch. 5: Market Equilibrium & Elasticity",
        pos: [0.3, 2.4, -1.2],
        color: 0xf4f7ff,
      },
    ];

    const nodeMeshes: THREE.Mesh[] = [];
    const nodeGroup = new THREE.Group();
    coreGroup.add(nodeGroup);

    nodeTopics.forEach((topic) => {
      const nodeGeo = new THREE.SphereGeometry(0.18, 16, 16);
      const nodeMat = new THREE.MeshStandardMaterial({
        color: topic.color,
        emissive: topic.color,
        emissiveIntensity: 0.95,
        roughness: 0.1,
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.set(topic.pos[0], topic.pos[1], topic.pos[2]);
      nodeMesh.userData = { name: topic.name, citation: topic.citation };
      nodeMeshes.push(nodeMesh);
      nodeGroup.add(nodeMesh);

      // Delicate connector filament to core
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

    // 4. Background Star Dust / Knowledge Particle Swarm
    const particleCount = 260;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const r = 3.2 + Math.random() * 2.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = r * Math.cos(phi);
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x7185ff,
      size: 0.05,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    coreGroup.add(particles);

    // Mouse Interaction / Raycasting
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-100, -100);
    const targetRotation = { x: 0, y: 0 };
    const currentRotation = { x: 0, y: 0 };
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };

    function onPointerMove(e: PointerEvent) {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      mouse.x = x;
      mouse.y = y;

      if (isDragging) {
        const deltaX = e.clientX - prevMousePos.x;
        const deltaY = e.clientY - prevMousePos.y;
        targetRotation.y += deltaX * 0.008;
        targetRotation.x += deltaY * 0.008;
        prevMousePos = { x: e.clientX, y: e.clientY };
      } else if (interactive) {
        targetRotation.y = x * 0.5;
        targetRotation.x = -y * 0.35;
      }
    }

    function onPointerDown(e: PointerEvent) {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    }

    function onPointerUp() {
      isDragging = false;
    }

    if (interactive) {
      container.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointermove", onPointerMove);
    }

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

    // Visibility Observer
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

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    function animate() {
      animId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth inertia rotation following pointer
      currentRotation.x += (targetRotation.x - currentRotation.x) * 0.06;
      currentRotation.y += (targetRotation.y - currentRotation.y) * 0.06;

      coreGroup.rotation.x = currentRotation.x;
      coreGroup.rotation.y = currentRotation.y + (prefersReducedMotion ? 0 : elapsed * 0.15);

      // Independent ring rotations
      if (!prefersReducedMotion) {
        ring1.rotation.z += delta * 0.35;
        ring2.rotation.z -= delta * 0.28;
        ring3.rotation.y += delta * 0.2;
        coreMesh.rotation.y += delta * 0.18;
        coreWireMesh.rotation.y += delta * 0.18;

        // Subtle core breathing
        const pulse = Math.sin(elapsed * 2.2) * 0.05 + 1.0;
        coreMesh.scale.set(pulse, pulse, pulse);
        coreWireMesh.scale.set(pulse, pulse, pulse);
        innerGlow.scale.set(pulse * 1.1, pulse * 1.1, pulse * 1.1);
      }

      // Raycast for hover state on subject nodes
      if (interactive && !prefersReducedMotion) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(nodeMeshes);

        if (intersects.length > 0) {
          const hit = intersects[0].object;
          setHoveredNode({
            name: hit.userData.name,
            citation: hit.userData.citation,
          });
          if (container) container.style.cursor = "pointer";
          hit.scale.lerp(new THREE.Vector3(1.4, 1.4, 1.4), 0.2);
        } else {
          setHoveredNode(null);
          if (container) container.style.cursor = isDragging ? "grabbing" : "grab";
          nodeMeshes.forEach((m) => m.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1));
        }
      }

      renderer.render(scene, camera);
    }

    animate();

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      if (interactive) {
        container.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointermove", onPointerMove);
      }

      scene.clear();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [interactive]);

  if (!isWebGLEnabled) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-2xl border border-primary-action/20 bg-card-bg/50 p-8 ${className}`}
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-ai-accent/40 bg-ai-accent/10">
            <div className="h-10 w-10 animate-pulse rounded-full bg-ai-accent/30" />
          </div>
          <p className="text-sm font-semibold text-text-primary">Synthesis Knowledge Core</p>
          <p className="text-xs text-text-muted">Hardware-accelerated preview fallback</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="h-full w-full cursor-grab active:cursor-grabbing"
        style={{ minHeight: "380px", maxHeight: "500px" }}
        role="img"
        aria-label="Interactive 3D Knowledge Core showing subject nodes and retention orbits"
      />

      {/* Floating Hover Indicator when a node is highlighted */}
      {hoveredNode && (
        <div
          className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-20 rounded-xl border border-ai-accent/50 bg-[#080D1C]/90 px-4 py-2 text-xs shadow-2xl backdrop-blur-md transition-all duration-200 text-center max-w-[280px]"
        >
          <div className="flex items-center justify-center gap-1.5 font-semibold text-ai-accent mb-0.5">
            <span className="inline-block h-2 w-2 rounded-full bg-ai-accent animate-ping" />
            <span>{hoveredNode.name}</span>
          </div>
          <div className="text-[11px] text-text-secondary truncate font-mono">
            {hoveredNode.citation}
          </div>
        </div>
      )}

      {/* Interactive Controls Hint */}
      <div className="pointer-events-none absolute top-3 right-3 rounded-full border border-white/10 bg-[#080D1C]/60 px-2.5 py-1 text-[10px] font-mono tracking-wide text-text-muted backdrop-blur-sm">
        3D Core • Click &amp; drag to rotate
      </div>
    </div>
  );
}
