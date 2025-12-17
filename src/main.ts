import * as THREE from 'three';

// Export helix calculation functions for testing
export function calculateHelixPosition(
  i: number,
  particleCount: number,
  helixRadius: number,
  helixHeight: number,
  turns: number,
  timeOffset: number = 0
): { x: number; y: number; z: number; helixIndex: number } {
  const helixIndex = i % 2;
  const helixParticleIndex = Math.floor(i / 2);
  const particlesPerHelix = particleCount / 2;
  
  // Calculate t with proper closure
  // For perfect closure, the last particle should be at the same position as the first (t=0.0)
  let t: number;
  if (helixParticleIndex === particlesPerHelix - 1) {
    // Last particle: explicitly use t=0.0 to match first particle position
    t = 0.0;
  } else {
    t = helixParticleIndex / particlesPerHelix;
  }
  t = (t + timeOffset) % 1.0;
  
  // Major circle radius (the torus center)
  const majorRadius = helixHeight / (2 * Math.PI);
  
  // Angle along the major circle (full 2π rotation)
  const majorAngle = t * Math.PI * 2;
  
  // Helix spiral angle (multiple turns)
  const helixAngle = t * turns * Math.PI * 2;
  const phaseOffset = helixIndex * Math.PI;
  
  // Calculate position on the minor circle (helix spiral)
  const minorX = Math.cos(helixAngle + phaseOffset) * helixRadius;
  const minorY = Math.sin(helixAngle + phaseOffset) * helixRadius;
  
  // Transform to torus coordinates
  // The helix wraps around a circle in the XZ plane
  const radiusAtAngle = majorRadius + minorX;
  const x = radiusAtAngle * Math.cos(majorAngle);
  const y = minorY;
  const z = radiusAtAngle * Math.sin(majorAngle);
  
  return { x, y, z, helixIndex };
}

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
// Bird's eye view - camera above looking down
camera.position.set(0, 8, 0);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Shader material
import { vertexShader, fragmentShader } from './shaders';

const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  transparent: true,
  blending: THREE.NormalBlending,
  depthWrite: false
});

const particleCount = 2000;
const helixRadius = 0.3;
const helixHeight = 6.0;
const turns = 4.0;

const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);
const sizes = new Float32Array(particleCount);

for (let i = 0; i < particleCount; i++) {
  const pos = calculateHelixPosition(i, particleCount, helixRadius, helixHeight, turns, 0);
  positions[i * 3] = pos.x;
  positions[i * 3 + 1] = pos.y;
  positions[i * 3 + 2] = pos.z;
  
  const t = Math.floor(i / 2) / (particleCount / 2);
  const hue = (t * 0.7 + pos.helixIndex * 0.3) % 1.0;
  const color = new THREE.Color().setHSL(hue, 0.8, 0.6);
  colors[i * 3] = color.r;
  colors[i * 3 + 1] = color.g;
  colors[i * 3 + 2] = color.b;
  sizes[i] = 6;
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

const particles = new THREE.Points(geometry, material);
scene.add(particles);

let time = 0;
const animate = () => {
  requestAnimationFrame(animate);
  time += 0.01;
  
  // Rotate around Y axis (vertical) for bird's eye view
  particles.rotation.y = time * 0.5;
  
  const positions = geometry.attributes.position.array as Float32Array;
  const colors = geometry.attributes.color.array as Float32Array;
  
  for (let i = 0; i < particleCount; i++) {
    const pos = calculateHelixPosition(i, particleCount, helixRadius, helixHeight, turns, time * 0.05);
    positions[i * 3] = pos.x;
    positions[i * 3 + 1] = pos.y;
    positions[i * 3 + 2] = pos.z;
    
    // Ensure t calculation matches the position calculation for proper closure
    const helixParticleIndex = Math.floor(i / 2);
    const particlesPerHelix = particleCount / 2;
    let t: number;
    if (helixParticleIndex === particlesPerHelix - 1) {
      t = 0.0; // Match position calculation for closure
    } else {
      t = helixParticleIndex / particlesPerHelix;
    }
    t = (t + time * 0.05) % 1.0;
    
    const hue = (t * 0.7 + (i % 2) * 0.3 + time * 0.1) % 1.0;
    const color = new THREE.Color().setHSL(hue, 0.8, 0.6);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  
  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.color.needsUpdate = true;
  
  // Keep camera fixed in bird's eye view
  camera.position.set(0, 8, 0);
  camera.lookAt(0, 0, 0);
  
  renderer.render(scene, camera);
};

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

