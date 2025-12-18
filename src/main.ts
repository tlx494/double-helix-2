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
  
  // Calculate t from 0 to 1.0
  const t = (helixParticleIndex / particlesPerHelix) + timeOffset;
  // Wrap t to keep it in [0, 1) range
  const wrappedT = t >= 1.0 ? (t % 1.0) : (t < 0 ? (t % 1.0 + 1.0) : t);
  
  // Major circle radius (the torus center)
  const majorRadius = helixHeight / (2 * Math.PI);
  
  // Angle along the major circle (full 2π rotation)
  const majorAngle = wrappedT * Math.PI * 2;
  
  // Helix spiral angle (multiple turns)
  const helixAngle = wrappedT * turns * Math.PI * 2;
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
  10000
);
// Bird's eye view - camera above looking down
camera.position.set(0, 8, 0);
camera.lookAt(0, 0, 0);

// Grid parameters
const gridSize = 5; // 5x5 grid
const gridSpacing = 35.0; // Space between helices (almost touching)

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
const helixRadius = 3.0;
const helixHeight = 60.0;
const turns = 4.0;

// Create grid of helices
const totalParticles = gridSize * gridSize * particleCount;

// Create a single large geometry for all particles
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(totalParticles * 3);
const colors = new Float32Array(totalParticles * 3);
const sizes = new Float32Array(totalParticles);
const glows = new Float32Array(totalParticles);

let particleIndex = 0;
for (let gridX = 0; gridX < gridSize; gridX++) {
  for (let gridZ = 0; gridZ < gridSize; gridZ++) {
    const offsetX = (gridX - (gridSize - 1) / 2) * gridSpacing;
    const offsetZ = (gridZ - (gridSize - 1) / 2) * gridSpacing;
    
    for (let i = 0; i < particleCount; i++) {
      const pos = calculateHelixPosition(i, particleCount, helixRadius, helixHeight, turns, 0);
      positions[particleIndex * 3] = pos.x + offsetX;
      positions[particleIndex * 3 + 1] = pos.y;
      positions[particleIndex * 3 + 2] = pos.z + offsetZ;
      
      const t = Math.floor(i / 2) / (particleCount / 2);
      // Simple color scheme based on position
      const hue = (t + pos.helixIndex * 0.5) % 1.0;
      const color = new THREE.Color().setHSL(hue, 0.8, 0.6);
      colors[particleIndex * 3] = color.r;
      colors[particleIndex * 3 + 1] = color.g;
      colors[particleIndex * 3 + 2] = color.b;
      sizes[particleIndex] = 1;
      
      // Initial glow intensity (will be updated in animation loop)
      glows[particleIndex] = 0.0;
      
      particleIndex++;
    }
  }
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
geometry.setAttribute('glow', new THREE.BufferAttribute(glows, 1));

const particles = new THREE.Points(geometry, material);
scene.add(particles);

let time = 0;
const minZoom = 10.0; // Minimum zoom level (zoomed in)
const maxZoom = 40.0; // Maximum zoom level (zoomed out)
const zoomOscillationSpeed = 0.5; // Speed of zoom oscillation

const animate = () => {
  requestAnimationFrame(animate);
  time += 0.005; // Moderate animation speed
  
  // Oscillating zoom effect - bounces in and out
  const zoomRange = maxZoom - minZoom;
  const zoomLevel = minZoom + (Math.sin(time * zoomOscillationSpeed) * 0.5 + 0.5) * zoomRange;
  const zoomFactor = Math.pow(1.05, zoomLevel); // Exponential zoom
  
  // Remove global rotation - each helix will spin individually
  particles.rotation.y = 0;
  
  const positions = geometry.attributes.position.array as Float32Array;
  const colors = geometry.attributes.color.array as Float32Array;
  const glows = geometry.attributes.glow.array as Float32Array;
  
  let particleIndex = 0;
  for (let gridX = 0; gridX < gridSize; gridX++) {
    for (let gridZ = 0; gridZ < gridSize; gridZ++) {
      const offsetX = (gridX - (gridSize - 1) / 2) * gridSpacing;
      const offsetZ = (gridZ - (gridSize - 1) / 2) * gridSpacing;
      
      // Individual rotation angle for this helix (each helix spins at slightly different speed)
      // Create unique rotation speed based on grid position for variation
      const baseRotationSpeed = 0.3; // Base rotation speed
      const helixId = gridX * gridSize + gridZ;
      const rotationSpeed = baseRotationSpeed + (helixId % 7) * 0.03; // Slight variation per helix
      const rotationAngle = time * rotationSpeed;
      
      // Rotation towards viewer (camera is at 0, 8, 0 looking down)
      // Each helix tilts slightly towards the center/viewer
      const tiltAngle = 0.5; // Stronger tilt angle in radians (about 28.6 degrees)
      const tiltX = Math.sin(time * 0.2 + helixId * 0.1) * tiltAngle; // Oscillating tilt
      const tiltZ = Math.cos(time * 0.4 + helixId * 0.1) * tiltAngle; // Z axis rotation twice as fast
      
      for (let i = 0; i < particleCount; i++) {
        const pos = calculateHelixPosition(i, particleCount, helixRadius, helixHeight, turns, time * 0.08);
        
        // First, rotate around Y axis (spinning)
        const relativeX = pos.x;
        const relativeZ = pos.z;
        const cosAngle = Math.cos(rotationAngle);
        const sinAngle = Math.sin(rotationAngle);
        let rotatedX = relativeX * cosAngle - relativeZ * sinAngle;
        let rotatedY = pos.y;
        let rotatedZ = relativeX * sinAngle + relativeZ * cosAngle;
        
        // Then, rotate around X axis (tilt towards viewer)
        const cosTiltX = Math.cos(tiltX);
        const sinTiltX = Math.sin(tiltX);
        const tempY = rotatedY;
        rotatedY = tempY * cosTiltX - rotatedZ * sinTiltX;
        rotatedZ = tempY * sinTiltX + rotatedZ * cosTiltX;
        
        // Finally, rotate around Z axis (tilt towards viewer)
        const cosTiltZ = Math.cos(tiltZ);
        const sinTiltZ = Math.sin(tiltZ);
        const tempX = rotatedX;
        rotatedX = tempX * cosTiltZ - rotatedY * sinTiltZ;
        rotatedY = tempX * sinTiltZ + rotatedY * cosTiltZ;
        
        // Apply grid offset, rotation, and zoom
        positions[particleIndex * 3] = (rotatedX + offsetX) / zoomFactor;
        positions[particleIndex * 3 + 1] = rotatedY / zoomFactor;
        positions[particleIndex * 3 + 2] = (rotatedZ + offsetZ) / zoomFactor;
        
        // Calculate t to match position calculation
        const helixParticleIndex = Math.floor(i / 2);
        const particlesPerHelix = particleCount / 2;
        const t = (helixParticleIndex / particlesPerHelix) + time * 0.08;
        const wrappedT = t >= 1.0 ? (t % 1.0) : (t < 0 ? (t % 1.0 + 1.0) : t);
        
        // Calculate glow intensity - moving bright spot that travels around the helix
        // Each helix has its own glow position offset for visual variety
        const glowSpeed = 0.3; // Speed of glow movement around helix
        const glowPosition = (time * glowSpeed + helixId * 0.1) % 1.0; // Moving position around helix
        
        // Calculate distance from particle to glow position (handling wrap-around)
        let distToGlow = Math.abs(wrappedT - glowPosition);
        distToGlow = Math.min(distToGlow, 1.0 - distToGlow); // Handle wrap-around
        
        // Glow intensity based on distance from glow position
        const glowRadius = 0.08; // How wide the glow spot is
        const glowIntensity = distToGlow < glowRadius ? (1.0 - distToGlow / glowRadius) : 0.0;
        glows[particleIndex] = glowIntensity;
        
        // Simple color scheme based on position
        const hue = (wrappedT + (i % 2) * 0.5) % 1.0;
        const color = new THREE.Color().setHSL(hue, 0.8, 0.6);
        colors[particleIndex * 3] = color.r;
        colors[particleIndex * 3 + 1] = color.g;
        colors[particleIndex * 3 + 2] = color.b;
        
        particleIndex++;
      }
    }
  }
  
  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.color.needsUpdate = true;
  geometry.attributes.glow.needsUpdate = true;
  
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

