import type { GameSession } from "@quiz/shared";
import { describe, expect, it } from "vitest";
import {
  finishGame,
  gotoQuestion,
  judgeFieldAnswer,
  setActivePhase,
  startGame,
  submitFieldAnswer,
} from "./freeTextGame.js";

function baseSession(overrides: Partial<GameSession> = {}): GameSession {
  return {
    roomCode: "ABCDE",
    hostId: "host-1",
    phase: "lobby",
    settings: {
      teamMode: false,
      wrongAnswerPenalty: 50,
      questionWindowMs: 15000,
      finalWagerEnabled: true,
    },
    players: {
      p1: { id: "p1", nickname: "Alice", avatarId: "a1", score: 0, connected: true },
      p2: { id: "p2", nickname: "Bob", avatarId: "a2", score: 0, connected: true },
    },
    teams: {},
    playlist: [
      { id: "q1", trackId: "t1", clipStartMs: 0, clipEndMs: 15000, basePoints: 100 },
      { id: "q2", trackId: "t2", clipStartMs: 0, clipEndMs: 15000, basePoints: 100 },
    ],
    currentQuestionIndex: 0,
    isFinalRound: false,
    activeAnswererId: null,
    pendingReview: false,
    questionStartedAt: null,
    buzzedAt: null,
    lockedOutIds: [],
    wagers: {},
    audioPlaying: false,
    activePhaseIndex: null,
    activePhaseStartedAt: null,
    answersByQuestion: {},
    ...overrides,
  };
}

function expectOk(result: { success: boolean; data?: GameSession; error?: string }): GameSession {
  if (!result.success || !result.data) throw new Error(`expected success, got: ${result.error}`);
  return result.data;
}

describe("startGame", () => {
  it("moves lobby to question_active at question 0", () => {
    const next = expectOk(startGame(baseSession()));
    expect(next.phase).toBe("question_active");
    expect(next.currentQuestionIndex).toBe(0);
  });

  it("refuses to start twice", () => {
    const started = expectOk(startGame(baseSession()));
    expect(startGame(started).success).toBe(false);
  });

  it("refuses an empty playlist", () => {
    expect(startGame(baseSession({ playlist: [] })).success).toBe(false);
  });
});

describe("gotoQuestion", () => {
  const active = baseSession({ phase: "question_active" });

  it("jumps forward and backward within bounds", () => {
    expect(expectOk(gotoQuestion(active, 1)).currentQuestionIndex).toBe(1);
    expect(expectOk(gotoQuestion({ ...active, currentQuestionIndex: 1 }, 0)).currentQuestionIndex).toBe(0);
  });

  it("rejects an out-of-range index", () => {
    expect(gotoQuestion(active, 2).success).toBe(false);
    expect(gotoQuestion(active, -1).success).toBe(false);
  });

  it("clears activePhaseIndex when switching questions", () => {
    const next = expectOk(gotoQuestion({ ...active, activePhaseIndex: 2 }, 1));
    expect(next.activePhaseIndex).toBeNull();
  });
});

describe("setActivePhase", () => {
  it("just sets the field, no phase requirement", () => {
    expect(setActivePhase(baseSession(), 1).activePhaseIndex).toBe(1);
    expect(setActivePhase(baseSession({ activePhaseIndex: 1 }), null).activePhaseIndex).toBeNull();
  });

  it("bumps activePhaseStartedAt even when re-selecting the same phase", () => {
    const first = setActivePhase(baseSession(), 0);
    expect(first.activePhaseStartedAt).not.toBeNull();
    const second = setActivePhase(first, 0);
    expect(second.activePhaseStartedAt).not.toBeNull();
    expect(second.activePhaseStartedAt).toBeGreaterThanOrEqual(first.activePhaseStartedAt!);
  });

  it("clears activePhaseStartedAt when stopping", () => {
    const playing = setActivePhase(baseSession(), 0);
    expect(setActivePhase(playing, null).activePhaseStartedAt).toBeNull();
  });
});

describe("submitFieldAnswer + judgeFieldAnswer", () => {
  const active = baseSession({ phase: "question_active" });

  it("records a pending answer scoped to the current question and player", () => {
    const next = expectOk(submitFieldAnswer(active, "p1", "artist", "Daft Punk"));
    expect(next.answersByQuestion[0]!.p1!.artist).toEqual({
      text: "Daft Punk",
      judged: "pending",
      awardedPoints: 0,
    });
  });

  it("awards points on accept and applies the score delta", () => {
    const withAnswer = expectOk(submitFieldAnswer(active, "p1", "artist", "Daft Punk"));
    const judged = expectOk(judgeFieldAnswer(withAnswer, "p1", "artist", true, 50));
    expect(judged.players.p1!.score).toBe(50);
    expect(judged.answersByQuestion[0]!.p1!.artist!.judged).toBe("correct");
  });

  it("awards nothing on reject", () => {
    const withAnswer = expectOk(submitFieldAnswer(active, "p1", "artist", "wrong"));
    const judged = expectOk(judgeFieldAnswer(withAnswer, "p1", "artist", false, 50));
    expect(judged.players.p1!.score).toBe(0);
  });

  it("re-judging replaces the previous award instead of stacking it", () => {
    const withAnswer = expectOk(submitFieldAnswer(active, "p1", "artist", "Daft Punk"));
    const firstJudge = expectOk(judgeFieldAnswer(withAnswer, "p1", "artist", true, 50));
    const corrected = expectOk(judgeFieldAnswer(firstJudge, "p1", "artist", false, 50));
    expect(corrected.players.p1!.score).toBe(0);
  });

  it("different fields and different players score independently", () => {
    let session = expectOk(submitFieldAnswer(active, "p1", "artist", "Daft Punk"));
    session = expectOk(submitFieldAnswer(session, "p1", "title", "One More Time"));
    session = expectOk(submitFieldAnswer(session, "p2", "artist", "Daft Punk"));
    session = expectOk(judgeFieldAnswer(session, "p1", "artist", true, 30));
    session = expectOk(judgeFieldAnswer(session, "p1", "title", true, 70));
    session = expectOk(judgeFieldAnswer(session, "p2", "artist", true, 30));
    expect(session.players.p1!.score).toBe(100);
    expect(session.players.p2!.score).toBe(30);
  });

  it("refuses to judge a field nobody answered yet", () => {
    expect(judgeFieldAnswer(active, "p1", "artist", true, 50).success).toBe(false);
  });
});

describe("finishGame", () => {
  it("moves question_active to finished", () => {
    expect(expectOk(finishGame(baseSession({ phase: "question_active" }))).phase).toBe("finished");
  });

  it("refuses from any other phase", () => {
    expect(finishGame(baseSession()).success).toBe(false);
  });
});
