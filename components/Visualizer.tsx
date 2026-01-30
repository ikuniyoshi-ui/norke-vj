import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { VisualState, PatternType } from '../types';
import { defaultState, onSync } from '../services/visualState';

interface VisualizerProps {
  manualState?: VisualState;
}

const Visualizer: React.FC<VisualizerProps> = ({ manualState }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<VisualState>(manualState || defaultState);
  const patternsRef = useRef<Record<string, THREE.Object3D>>({});

  useEffect(() => {
    if (manualState) stateRef.current = manualState;
  }, [manualState]);

  useEffect(() => {
    if (!containerRef.current) return;

    let unsubscribe: (() => void) | undefined;
    if (!manualState) {
      unsubscribe = onSync((newState) => { stateRef.current = newState; });
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    const camera = new THREE.PerspectiveCamera(70, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    // --- PATTERN FACTORY (投影用に太さと明るさを強化) ---
    const createPatterns = () => {
      const p: Record<string, THREE.Object3D> = {};
      // 修正: 不透明度を 1.0 に上げ、プロジェクターでの発色を強化
      const mat = (color: number, wire = true) => new THREE.MeshBasicMaterial({ 
        color, 
        wireframe: wire, 
        transparent: true, 
        opacity: 1.0, 
        blending: THREE.AdditiveBlending 
      });

      p.terrain = new THREE.Mesh(new THREE.PlaneGeometry(200, 200, 60, 60), mat(0x00ffff));
      p.terrain.rotation.x = -Math.PI / 2;
      
      const tunnel = new THREE.Group();
      for(let i=0; i<30; i++) {
        // 修正: リングの管の太さを 0.1 -> 0.4 に強化
        const r = new THREE.Mesh(new THREE.TorusGeometry(15, 0.4, 12, 100), mat(0xff00ff));
        r.position.z = -i * 10;
        tunnel.add(r);
      }
      p.tunnel = tunnel;

      const swarmGeo = new THREE.BufferGeometry();
      const swarmPos = new Float32Array(4000 * 3);
      for(let i=0; i<12000; i++) swarmPos[i] = (Math.random() - 0.5) * 160;
      swarmGeo.setAttribute('position', new THREE.BufferAttribute(swarmPos, 3));
      // 修正: 粒子のサイズを 0.3 -> 1.5 に大幅アップ
      p.swarm = new THREE.Points(swarmGeo, new THREE.PointsMaterial({ size: 1.5, color: 0x00ffaa, transparent: true, blending: THREE.AdditiveBlending }));

      p.grid = new THREE.GridHelper(300, 50, 0x00ffff, 0x222222);

      const pillars = new THREE.Group();
      for(let i=0; i<60; i++) {
        // 修正: 柱の幅を 1.5 -> 2.5 に太く
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1, 2.5), mat(0x555555, false));
        pillar.position.set((Math.random()-0.5)*180, 0, (Math.random()-0.5)*180);
        pillars.add(pillar);
      }
      p.pillars = pillars;

      p.plasma = new THREE.Mesh(new THREE.IcosahedronGeometry(20, 5), mat(0x0088ff));
      
      const matrix = new THREE.Group();
      for(let i=0; i<80; i++) {
        // 修正: 棒の太さを 0.2 -> 0.6 に強化
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 15, 0.6), mat(0x00ff00, false));
        bar.position.set((Math.random()-0.5)*120, (Math.random()-0.5)*120, (Math.random()-0.5)*120);
        matrix.add(bar);
      }
      p.matrix = matrix;

      p.lattice = new THREE.Mesh(new THREE.OctahedronGeometry(25, 3), mat(0xffff00));

      const glitch = new THREE.Group();
      for(let i=0; i<30; i++) {
        // 修正: 厚み（高さ）を 2 -> 4 に強化
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(20, 4), mat(0xffffff, false));
        plane.position.set((Math.random()-0.5)*80, (Math.random()-0.5)*80, (Math.random()-0.5)*80);
        glitch.add(plane);
      }
      p.glitch = glitch;

      // 修正: 星のサイズを 0.15 -> 0.8 にアップ
      p.starfield = new THREE.Points(swarmGeo.clone(), new THREE.PointsMaterial({ size: 0.8, color: 0xffffff, transparent: true }));

      const vortex = new THREE.Group();
      for(let i=0; i<150; i++) {
        // 修正: 粒子の半径を 0.4 -> 1.0 に強化
        const sph = new THREE.Mesh(new THREE.SphereGeometry(1.0), mat(0xffaa00, false));
        sph.position.set(Math.cos(i*0.2)*i*0.5, i*0.1, Math.sin(i*0.2)*i*0.5);
        vortex.add(sph);
      }
      p.vortex = vortex;

      const cubes = new THREE.Group();
      for(let i=0; i<40; i++) {
        const c = new THREE.Mesh(new THREE.BoxGeometry(5,5,5), mat(0xff3300));
        c.position.set((Math.random()-0.5)*100, (Math.random()-0.5)*100, (Math.random()-0.5)*100);
        cubes.add(c);
      }
      p.cubes = cubes;

      const waves = new THREE.Group();
      for(let i=0; i<12; i++) {
        // 修正: 線の幅を 1 -> 2 に強化
        const line = new THREE.Mesh(new THREE.PlaneGeometry(160, 2, 50, 1), mat(0x0055ff));
        line.position.z = (i-6) * 12;
        line.rotation.x = -Math.PI / 2;
        waves.add(line);
      }
      p.waves = waves;

      const rings = new THREE.Group();
      for(let i=0; i<15; i++) {
        // 修正: リングの厚みを 0.3 -> 0.6 に強化
        const r = new THREE.Mesh(new THREE.RingGeometry(i*4, i*4+0.6, 64), mat(0x00ff88, false));
        rings.add(r);
      }
      p.rings = rings;

      const blobs = new THREE.Group();
      for(let i=0; i<10; i++) {
        const blob = new THREE.Mesh(new THREE.SphereGeometry(6, 12, 12), mat(0xff0066));
        blob.position.set((Math.random()-0.5)*100, (Math.random()-0.5)*100, (Math.random()-0.5)*100);
        blobs.add(blob);
      }
      p.blobs = blobs;

      const scanlines = new THREE.Group();
      for(let i=0; i<50; i++) {
        // 修正: 線の太さを 0.1 -> 0.5 に強化
        const sl = new THREE.Mesh(new THREE.PlaneGeometry(250, 0.5), mat(0xffffff, false));
        sl.position.y = (i-25) * 6;
        scanlines.add(sl);
      }
      p.scanlines = scanlines;

      const fractal = new THREE.Group();
      for(let i=0; i<12; i++) {
        const node = new THREE.Mesh(new THREE.TetrahedronGeometry(8), mat(0x88ff00));
        node.position.set(Math.cos(i)*30, Math.sin(i)*30, Math.sin(i*2)*10);
        fractal.add(node);
      }
      p.fractal = fractal;

      // 修正: フィードバック（残像）のサイズを 1.0 -> 4.0 に大幅アップ
      p.feedback = new THREE.Points(swarmGeo.clone(), new THREE.PointsMaterial({ size: 4.0, color: 0x3300ff, transparent: true, blending: THREE.AdditiveBlending }));
      p.noise = new THREE.Mesh(new THREE.SphereGeometry(22, 64, 64), mat(0xffffff));
      
      const v = new THREE.Group();
      const core = new THREE.Mesh(new THREE.SphereGeometry(2, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      const rays = new THREE.GridHelper(120, 8, 0xffffff, 0x333333);
      rays.rotation.x = Math.PI/2;
      v.add(core, rays);
      p.void = v;

      Object.values(p).forEach(obj => { obj.visible = false; scene.add(obj); });
      return p;
    };

    patternsRef.current = createPatterns();
    scene.add(new THREE.AmbientLight(0x222222));
    const pl = new THREE.PointLight(0xffffff, 2, 600);
    pl.position.set(50, 100, 50);
    scene.add(pl);

    const clock = new THREE.Clock();
    let frameId: number;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const state = stateRef.current;
      const patterns = patternsRef.current;

      const low = state.low * state.intensity;
      const mid = state.mid * state.intensity;
      const high = state.high * state.intensity;
      const kick = state.kick * state.intensity;

      const camTime = time * (state.cameraSpeed ?? 1.0);
      camera.position.set(
        Math.sin(camTime * 0.15) * 110, 
        50 + Math.cos(camTime * 0.1) * 30 + kick * 10, 
        Math.cos(camTime * 0.15) * 110
      );
      camera.lookAt(0, 0, 0);
      camera.rotation.z = Math.sin(camTime * 0.3) * 0.1 * high;

      Object.keys(patterns).forEach(key => {
        const p = patterns[key];
        const isPrimary = state.primaryPattern === key;
        const isSecondary = state.secondaryPattern === key;
        p.visible = isPrimary || isSecondary;

        if (p.visible) {
          const targetOpacity = isSecondary ? state.overlayOpacity : 1.0;
          
          // 修正: キック時のスケール変化を 0.4 -> 0.6 に強めてインパクトを強化
          p.scale.setScalar(1 + kick * 0.6);
          p.rotation.y += (0.01 + low * 0.04) * (state.cameraSpeed ?? 1.0);
          p.rotation.x += mid * 0.01;

          p.traverse((child) => {
            if ((child as any).material) {
              const m = (child as any).material;
              m.opacity = THREE.MathUtils.lerp(m.opacity || 0, targetOpacity, 0.1);
              if (m.color) {
                const h = (state.theme.hue + (isSecondary ? 0.4 : 0) + time * 0.02) % 1;
                m.color.setHSL(h, 0.9, 0.3 + high * 0.5);
              }
            }
          });

          if (key === 'terrain') {
            const pos = (p as THREE.Mesh).geometry.attributes.position;
            for(let i=0; i<pos.count; i++) {
              const x = pos.getX(i); const y = pos.getY(i);
              pos.setZ(i, Math.sin(x*0.1 + time*2)*Math.cos(y*0.1 + time)* (10 + kick*20));
            }
            pos.needsUpdate = true;
          }
          if (key === 'tunnel') {
            (p as THREE.Group).children.forEach((c, idx) => {
              c.position.z = (((idx * 10) + (time * 25 * (1 + low))) % 300) * -1;
              const s = 1 + Math.sin(time*10 + idx)*0.3*kick;
              c.scale.set(s, s, s);
            });
          }
          if (key === 'pillars') {
            (p as THREE.Group).children.forEach((c, idx) => {
              const h = 5 + Math.sin(time*3+idx)*30 * (idx%3===0?low:mid);
              c.scale.y = h;
              c.position.y = h/2;
            });
          }
          if (key === 'noise') {
            const pos = (p as THREE.Mesh).geometry.attributes.position;
            for(let i=0; i<pos.count; i++) {
              const v = new THREE.Vector3().fromBufferAttribute(pos, i).normalize();
              const dist = 22 + Math.sin(time*8 + i)*kick*10 + high*15;
              pos.setXYZ(i, v.x*dist, v.y*dist, v.z*dist);
            }
            pos.needsUpdate = true;
          }
          if (key === 'matrix') {
            (p as THREE.Group).children.forEach((c) => {
              c.position.y -= (0.8 + mid*2);
              if(c.position.y < -60) c.position.y = 60;
            });
          }
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (unsubscribe) unsubscribe();
      cancelAnimationFrame(frameId);
      renderer.dispose();
      if (containerRef.current && renderer.domElement) containerRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full bg-black" />;
};

export default Visualizer;
