import { describe, it, expect } from "vitest";
import {
  computeAdvance,
  computeNextTryNumber,
  computeScoreDelta,
  isOutOfAttempts,
} from "./gameLogic";

describe("gameLogic", () => {
  describe("computeAdvance", () => {
    const images = [{ image_id: "img-1" }, { image_id: "img-2" }, { image_id: "img-3" }];

    it("advances to next image when more exist", () => {
      const result = computeAdvance(images, 0);
      expect(result.finished).toBe(false);
      expect(result.nextIndex).toBe(1);
      expect(result.nextImageId).toBe("img-2");
    });

    it("advances to last image", () => {
      const result = computeAdvance(images, 1);
      expect(result.finished).toBe(false);
      expect(result.nextIndex).toBe(2);
      expect(result.nextImageId).toBe("img-3");
    });

    it("marks game as finished after last image", () => {
      const result = computeAdvance(images, 2);
      expect(result.finished).toBe(true);
      expect(result.nextIndex).toBe(null);
      expect(result.nextImageId).toBe(null);
    });

    it("handles single-image games", () => {
      const single = [{ image_id: "only" }];
      const result = computeAdvance(single, 0);
      expect(result.finished).toBe(true);
      expect(result.nextIndex).toBe(null);
    });

    it("handles empty image list", () => {
      const result = computeAdvance([], 0);
      expect(result.finished).toBe(true);
    });
  });

  describe("computeNextTryNumber", () => {
    it("returns 1 for first attempt (undefined)", () => {
      expect(computeNextTryNumber(undefined)).toBe(1);
    });

    it("returns 1 for first attempt (null)", () => {
      expect(computeNextTryNumber(null)).toBe(1);
    });

    it("increments from existing try number", () => {
      expect(computeNextTryNumber(1)).toBe(2);
      expect(computeNextTryNumber(2)).toBe(3);
    });
  });

  describe("isOutOfAttempts", () => {
    it("allows first attempt", () => {
      expect(isOutOfAttempts(undefined)).toBe(false);
      expect(isOutOfAttempts(null)).toBe(false);
    });

    it("allows second attempt", () => {
      expect(isOutOfAttempts(1)).toBe(false);
    });

    it("blocks third attempt (max 2)", () => {
      expect(isOutOfAttempts(2)).toBe(true);
      expect(isOutOfAttempts(3)).toBe(true);
    });

    it("respects custom max attempts", () => {
      expect(isOutOfAttempts(2, 3)).toBe(false);
      expect(isOutOfAttempts(3, 3)).toBe(true);
    });
  });

  describe("computeScoreDelta", () => {
    it("returns new score for first attempt", () => {
      expect(computeScoreDelta(95, undefined)).toBe(95);
      expect(computeScoreDelta(95, null)).toBe(95);
    });

    it("returns delta when replacing previous score", () => {
      expect(computeScoreDelta(95, 80)).toBe(15);
      expect(computeScoreDelta(50, 80)).toBe(-30);
    });

    it("handles zero scores", () => {
      expect(computeScoreDelta(0, undefined)).toBe(0);
      expect(computeScoreDelta(0, 50)).toBe(-50);
      expect(computeScoreDelta(50, 0)).toBe(50);
    });
  });
});
