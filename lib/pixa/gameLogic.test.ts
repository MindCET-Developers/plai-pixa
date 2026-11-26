import { describe, it, expect } from "vitest";
import {
  computeAdvance,
  computeNextTryNumber,
  computeScoreDelta,
  isOutOfAttempts,
  isSamePrompt,
  pickDefaultAttempt,
  effectiveSelectedTry,
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

  describe("isSamePrompt", () => {
    it("treats identical text as the same", () => {
      expect(isSamePrompt("כלב על החוף", "כלב על החוף")).toBe(true);
    });

    it("ignores surrounding and repeated whitespace", () => {
      expect(isSamePrompt("  כלב   על\nהחוף ", "כלב על החוף")).toBe(true);
    });

    it("detects a real change", () => {
      expect(isSamePrompt("כלב גדול על החוף", "כלב על החוף")).toBe(false);
    });

    it("is never the same when there is no previous prompt", () => {
      expect(isSamePrompt("כלב", undefined)).toBe(false);
      expect(isSamePrompt("כלב", null)).toBe(false);
    });
  });

  describe("pickDefaultAttempt", () => {
    it("selects the only attempt when there is no previous one", () => {
      expect(pickDefaultAttempt(null, { tryNumber: 1, score: 40 })).toBe(1);
      expect(pickDefaultAttempt(undefined, { tryNumber: 1, score: 0 })).toBe(1);
    });

    it("keeps the first attempt when the second scored lower", () => {
      expect(pickDefaultAttempt({ tryNumber: 1, score: 80 }, { tryNumber: 2, score: 50 })).toBe(1);
    });

    it("moves to the second attempt when it scored higher", () => {
      expect(pickDefaultAttempt({ tryNumber: 1, score: 50 }, { tryNumber: 2, score: 80 })).toBe(2);
    });

    it("prefers the newer attempt on a tie", () => {
      expect(pickDefaultAttempt({ tryNumber: 1, score: 60 }, { tryNumber: 2, score: 60 })).toBe(2);
    });
  });

  describe("effectiveSelectedTry", () => {
    it("uses the stored selection", () => {
      expect(effectiveSelectedTry({ selected_try_number: 1, try_number: 2 })).toBe(1);
    });

    it("falls back to the latest try for legacy rows", () => {
      expect(effectiveSelectedTry({ selected_try_number: null, try_number: 2 })).toBe(2);
      expect(effectiveSelectedTry({ try_number: 1 })).toBe(1);
    });
  });
});
