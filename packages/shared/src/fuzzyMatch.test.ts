import { describe, expect, it } from "vitest";
import { matchAnswer, normalizeAnswer } from "./fuzzyMatch.js";

describe("normalizeAnswer", () => {
  it("lowercases, strips accents and punctuation, collapses whitespace", () => {
    expect(normalizeAnswer("  Rick Astley!!  ")).toBe("rick astley");
    expect(normalizeAnswer("Björk")).toBe("bjork");
  });
});

describe("matchAnswer", () => {
  it("accepts an exact match", () => {
    const result = matchAnswer("Never Gonna Give You Up", "Never Gonna Give You Up");
    expect(result.verdict).toBe("accept");
    expect(result.score).toBe(1);
  });

  it("accepts a single-character typo", () => {
    const result = matchAnswer("rick astly", "rick astley");
    expect(result.verdict).toBe("accept");
  });

  it("flags a moderately different answer for host review", () => {
    // "abcdefgh" vs "abcdxyzh": 3 substitutions over 8 chars -> score 0.625
    const result = matchAnswer("abcdxyzh", "abcdefgh");
    expect(result.verdict).toBe("review");
  });

  it("rejects a mostly-unrelated answer", () => {
    const result = matchAnswer("rick", "rick astley");
    expect(result.verdict).toBe("reject");
  });

  it("is accent- and case-insensitive", () => {
    const result = matchAnswer("bjork", "Björk");
    expect(result.verdict).toBe("accept");
    expect(result.score).toBe(1);
  });
});
