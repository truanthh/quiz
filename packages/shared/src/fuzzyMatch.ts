import type { AnswerVerdict } from "./domain.js";

export function normalizeAnswer(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let previousRow = Array.from({ length: b.length + 1 }, (_, i) => i);
  let currentRow = new Array<number>(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i++) {
    currentRow[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currentRow[j] = Math.min(
        currentRow[j - 1] + 1,
        previousRow[j] + 1,
        previousRow[j - 1] + cost,
      );
    }
    [previousRow, currentRow] = [currentRow, previousRow];
  }

  return previousRow[b.length];
}

export function answerSimilarity(input: string, correct: string): number {
  const a = normalizeAnswer(input);
  const b = normalizeAnswer(correct);
  if (a.length === 0 && b.length === 0) return 1;
  const maxLen = Math.max(a.length, b.length) || 1;
  return 1 - levenshtein(a, b) / maxLen;
}

export interface MatchThresholds {
  accept: number;
  review: number;
}

export const DEFAULT_MATCH_THRESHOLDS: MatchThresholds = { accept: 0.82, review: 0.55 };

export interface AnswerMatch {
  score: number;
  verdict: AnswerVerdict;
}

export function matchAnswer(
  input: string,
  correct: string,
  thresholds: MatchThresholds = DEFAULT_MATCH_THRESHOLDS,
): AnswerMatch {
  const score = answerSimilarity(input, correct);
  const verdict: AnswerVerdict =
    score >= thresholds.accept ? "accept" : score >= thresholds.review ? "review" : "reject";
  return { score, verdict };
}
