"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface ZenSphereProps {
  className?: string;
  isActive?: boolean;
  phase?: "inhale" | "hold" | "exhale" | "idle";
}

export function ZenSphere({ className = "", isActive = false }: ZenSphereProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.z = 5;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xe1dcc9, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x412d15, 2.5);
    directionalLight.position.set(2, 3, 4);
    scene.add(directionalLight);

    const backLight = new THREE.PointLight(0xe1dcc9, 2.5, 10);
    backLight.position.set(-3, -2, -2);
    scene.add(backLight);

    // Zen Breathing Sphere Mesh
    const sphereGroup = new THREE.Group();
    scene.add(sphereGroup);

    // Inner Core Sphere
    const sphereGeo = new THREE.SphereGeometry(1.2, 48, 48);
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: 0x1f150c,
      emissive: 0x412d15,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.4,
      transmission: 0.6,
      ior: 1.4,
      reflectivity: 0.8,
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    sphereGroup.add(sphereMesh);

    // Concentric Wave Rings
    const ringGeo = new THREE.TorusGeometry(1.6, 0.015, 16, 80);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xe1dcc9,
      emissive: 0x412d15,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.6,
    });

    const ringA = new THREE.Mesh(ringGeo, ringMat);
    ringA.rotation.x = Math.PI / 3;
    sphereGroup.add(ringA);

    const ringB = new THREE.Mesh(ringGeo, ringMat);
    ringB.rotation.y = Math.PI / 3;
    ringB.rotation.z = Math.PI / 6;
    sphereGroup.add(ringB);

    // Ambient floating particles
    const pCount = 80;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount; i++) {
      const r = 1.8 + Math.random() * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      pPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pPos[i * 3 + 2] = r * Math.cos(phi);
    }

    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xe1dcc9,
      size: 0.04,
      transparent: true,
      opacity: 0.5,
    });
    const particles = new THREE.Points(pGeo, pMat);
    sphereGroup.add(particles);

    // Resize
    function handleResize() {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }

    window.addEventListener("resize", handleResize);

    // Visibility Observer
    let isVisible = true;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        isVisible = e.isIntersecting;
      });
    });
    observer.observe(container);

    let animId: number;
    let clock = new THREE.Clock();

    function animate() {
      animId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        sphereGroup.rotation.y += delta * 0.2;
        ringA.rotation.z += delta * 0.15;
        ringB.rotation.z -= delta * 0.12;

        // Breathing cycle: 4s inhale, 4s exhale (~0.8 rad/s)
        const breatheSpeed = isActive ? 0.75 : 0.4;
        const breathScale = 1.0 + Math.sin(elapsed * breatheSpeed) * 0.12;
        sphereMesh.scale.set(breathScale, breathScale, breathScale);
        ringA.scale.set(breathScale * 1.05, breathScale * 1.05, breathScale * 1.05);
        ringB.scale.set(breathScale * 1.05, breathScale * 1.05, breathScale * 1.05);
      }

      renderer.render(scene, camera);
    }

    animate();

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      scene.clear();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isActive]);

  if (!isSupported) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="h-32 w-32 rounded-full border border-emerald-500/30 bg-emerald-500/10 animate-pulse" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center ${className}`}
      role="img"
      aria-label="3D meditative zen breathing sphere"
      style={{ width: "100%", height: "100%", minHeight: "260px" }}
    />
  );
}
