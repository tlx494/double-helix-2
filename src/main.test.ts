import { describe, it, expect } from 'vitest';
import { calculateHelixPosition } from './main';

describe('Double Helix Calculations', () => {
  const particleCount = 100;
  const helixRadius = 0.8;
  const helixHeight = 6.0;
  const turns = 4.0;

  describe('calculateHelixPosition', () => {
    it('should properly alternate particles between two helices', () => {
      const pos0 = calculateHelixPosition(0, particleCount, helixRadius, helixHeight, turns);
      const pos1 = calculateHelixPosition(1, particleCount, helixRadius, helixHeight, turns);
      const pos2 = calculateHelixPosition(2, particleCount, helixRadius, helixHeight, turns);
      const pos3 = calculateHelixPosition(3, particleCount, helixRadius, helixHeight, turns);

      // Even indices should be helix 0, odd indices should be helix 1
      expect(pos0.helixIndex).toBe(0);
      expect(pos1.helixIndex).toBe(1);
      expect(pos2.helixIndex).toBe(0);
      expect(pos3.helixIndex).toBe(1);
    });

    it('should create two distinct helices with 180 degree phase offset', () => {
      const helix0Pos = calculateHelixPosition(0, particleCount, helixRadius, helixHeight, turns);
      const helix1Pos = calculateHelixPosition(1, particleCount, helixRadius, helixHeight, turns);

      // At the same height (t=0), the two helices should be on opposite sides
      // Helix 0: angle = 0, phase = 0, so x = radius, z = 0
      // Helix 1: angle = 0, phase = π, so x = -radius, z = 0
      expect(Math.abs(helix0Pos.x + helix1Pos.x)).toBeLessThan(0.1);
      expect(Math.abs(helix0Pos.y - helix1Pos.y)).toBeLessThan(0.001);
    });

    it('should distribute particles evenly between helices', () => {
      let helix0Count = 0;
      let helix1Count = 0;

      for (let i = 0; i < particleCount; i++) {
        const pos = calculateHelixPosition(i, particleCount, helixRadius, helixHeight, turns);
        if (pos.helixIndex === 0) helix0Count++;
        else helix1Count++;
      }

      expect(helix0Count).toBe(particleCount / 2);
      expect(helix1Count).toBe(particleCount / 2);
    });

    it('should create spiral pattern with correct height range', () => {
      const firstPos = calculateHelixPosition(0, particleCount, helixRadius, helixHeight, turns);
      const lastPos = calculateHelixPosition(particleCount - 1, particleCount, helixRadius, helixHeight, turns);

      // First particle should be near bottom, last near top
      expect(firstPos.y).toBeLessThan(0);
      expect(lastPos.y).toBeGreaterThan(0);
      
      // Height should be within expected range
      expect(Math.abs(firstPos.y)).toBeLessThan(helixHeight / 2 + 0.1);
      expect(Math.abs(lastPos.y)).toBeLessThan(helixHeight / 2 + 0.1);
    });

    it('should maintain helix radius for all particles', () => {
      for (let i = 0; i < particleCount; i++) {
        const pos = calculateHelixPosition(i, particleCount, helixRadius, helixHeight, turns);
        const distanceFromCenter = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
        expect(Math.abs(distanceFromCenter - helixRadius)).toBeLessThan(0.01);
      }
    });

    it('should animate particles correctly with time offset', () => {
      const posAtTime0 = calculateHelixPosition(0, particleCount, helixRadius, helixHeight, turns, 0);
      const posAtTime1 = calculateHelixPosition(0, particleCount, helixRadius, helixHeight, turns, 0.1);

      // Position should change with time
      const distance = Math.sqrt(
        Math.pow(posAtTime1.x - posAtTime0.x, 2) +
        Math.pow(posAtTime1.y - posAtTime0.y, 2) +
        Math.pow(posAtTime1.z - posAtTime0.z, 2)
      );
      expect(distance).toBeGreaterThan(0.01);
    });

    it('should wrap around correctly when time offset exceeds 1', () => {
      const posAtTime0 = calculateHelixPosition(0, particleCount, helixRadius, helixHeight, turns, 0);
      const posAtTime1 = calculateHelixPosition(0, particleCount, helixRadius, helixHeight, turns, 1.0);

      // After one full cycle, should return to similar position
      const distance = Math.sqrt(
        Math.pow(posAtTime1.x - posAtTime0.x, 2) +
        Math.pow(posAtTime1.y - posAtTime0.y, 2) +
        Math.pow(posAtTime1.z - posAtTime0.z, 2)
      );
      expect(distance).toBeLessThan(0.1);
    });

    it('should create proper double helix structure', () => {
      // Check that particles at same height on different helices are properly offset
      const midIndex = Math.floor(particleCount / 4);
      const helix0Mid = calculateHelixPosition(midIndex * 2, particleCount, helixRadius, helixHeight, turns);
      const helix1Mid = calculateHelixPosition(midIndex * 2 + 1, particleCount, helixRadius, helixHeight, turns);

      // They should be at similar heights but different x/z positions
      expect(Math.abs(helix0Mid.y - helix1Mid.y)).toBeLessThan(0.1);
      
      // Distance between them should be approximately 2 * radius (opposite sides)
      const distance = Math.sqrt(
        Math.pow(helix0Mid.x - helix1Mid.x, 2) +
        Math.pow(helix0Mid.z - helix1Mid.z, 2)
      );
      expect(distance).toBeGreaterThan(helixRadius);
      expect(distance).toBeLessThan(helixRadius * 2.5);
    });
  });
});

