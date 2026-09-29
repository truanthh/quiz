import type { GameSession } from "@quiz/shared";
import { describe, expect, it } from "vitest";
import { transition } from "./transition.js";

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
    ...overrides,
  };
}

function expectOk(result: ReturnType<typeof transition>): GameSession {
  if (!result.success) throw new Error(`expected success, got error: ${result.error}`);
  return result.data;
}

describe("transition", () => {
  it("rejects an event that doesn't apply to the current phase", () => {
    const session = baseSession();
    const result = transition(session, { type: "ADVANCE" });
    expect(result.success).toBe(false);
  });

  it("walks lobby -> countdown -> question_playing on START_GAME + BEGIN_QUESTION", () => {
    let session = baseSession();
    session = expectOk(transition(session, { type: "START_GAME", at: 0 }));
    expect(session.phase).toBe("countdown_to_start");

    session = expectOk(transition(session, { type: "BEGIN_QUESTION", at: 1000 }));
    expect(session.phase).toBe("question_playing");
    expect(session.questionStartedAt).toBe(1000);
  });

  it("awards a bigger bonus for a faster correct buzz", () => {
    const started = baseSession({ phase: "question_playing", questionStartedAt: 0 });

    const fast = expectOk(transition(started, { type: "BUZZ", contestantId: "p1", at: 1000 }));
    const fastResolved = expectOk(
      transition(fast, { type: "SUBMIT_ANSWER", contestantId: "p1", verdict: "accept" }),
    );

    const slow = baseSession({ phase: "question_playing", questionStartedAt: 0 });
    const slowBuzz = expectOk(transition(slow, { type: "BUZZ", contestantId: "p2", at: 12000 }));
    const slowResolved = expectOk(
      transition(slowBuzz, { type: "SUBMIT_ANSWER", contestantId: "p2", verdict: "accept" }),
    );

    expect(fastResolved.players.p1.score).toBeGreaterThan(slowResolved.players.p2.score);
    expect(fastResolved.phase).toBe("reveal");
  });

  it("lets another player steal after a wrong answer, penalizing only the one who missed", () => {
    let session = baseSession({ phase: "question_playing", questionStartedAt: 0 });

    session = expectOk(transition(session, { type: "BUZZ", contestantId: "p1", at: 500 }));
    session = expectOk(
      transition(session, { type: "SUBMIT_ANSWER", contestantId: "p1", verdict: "reject" }),
    );
    expect(session.phase).toBe("question_playing");
    expect(session.players.p1.score).toBe(-50);
    expect(session.lockedOutIds).toContain("p1");

    // p1 can't buzz again on this question
    const blocked = transition(session, { type: "BUZZ", contestantId: "p1", at: 600 });
    expect(blocked.success).toBe(false);

    session = expectOk(transition(session, { type: "BUZZ", contestantId: "p2", at: 700 }));
    session = expectOk(
      transition(session, { type: "SUBMIT_ANSWER", contestantId: "p2", verdict: "accept" }),
    );
    expect(session.players.p2.score).toBeGreaterThan(0);
    expect(session.phase).toBe("reveal");
  });

  it("moves to reveal once every contestant has missed the question", () => {
    let session = baseSession({ phase: "question_playing", questionStartedAt: 0 });
    session = expectOk(transition(session, { type: "BUZZ", contestantId: "p1", at: 100 }));
    session = expectOk(
      transition(session, { type: "SUBMIT_ANSWER", contestantId: "p1", verdict: "reject" }),
    );
    session = expectOk(transition(session, { type: "BUZZ", contestantId: "p2", at: 200 }));
    session = expectOk(
      transition(session, { type: "SUBMIT_ANSWER", contestantId: "p2", verdict: "reject" }),
    );
    expect(session.phase).toBe("reveal");
  });

  it("routes a review verdict to the host and resolves on HOST_JUDGE", () => {
    let session = baseSession({ phase: "question_playing", questionStartedAt: 0 });
    session = expectOk(transition(session, { type: "BUZZ", contestantId: "p1", at: 100 }));
    session = expectOk(
      transition(session, { type: "SUBMIT_ANSWER", contestantId: "p1", verdict: "review" }),
    );
    expect(session.pendingReview).toBe(true);
    expect(session.phase).toBe("answer_window");

    session = expectOk(
      transition(session, { type: "HOST_JUDGE", contestantId: "p1", correct: true }),
    );
    expect(session.phase).toBe("reveal");
    expect(session.players.p1.score).toBeGreaterThan(0);
  });

  it("advances leaderboard -> next question, then into a wager round once the playlist ends", () => {
    let session = baseSession({ phase: "leaderboard", currentQuestionIndex: 0 });
    session = expectOk(transition(session, { type: "ADVANCE" }));
    expect(session.phase).toBe("countdown_to_start");
    expect(session.currentQuestionIndex).toBe(1);

    session = { ...session, phase: "leaderboard" };
    session = expectOk(transition(session, { type: "ADVANCE" }));
    expect(session.phase).toBe("wager_input");
  });

  it("skips the wager round when disabled and finishes instead", () => {
    let session = baseSession({
      phase: "leaderboard",
      currentQuestionIndex: 1,
      settings: {
        teamMode: false,
        wrongAnswerPenalty: 50,
        questionWindowMs: 15000,
        finalWagerEnabled: false,
      },
    });
    session = expectOk(transition(session, { type: "ADVANCE" }));
    expect(session.phase).toBe("finished");
  });

  it("rejects a wager above the contestant's current score", () => {
    const session = baseSession({
      phase: "wager_input",
      players: {
        p1: { id: "p1", nickname: "Alice", avatarId: "a1", score: 100, connected: true },
        p2: { id: "p2", nickname: "Bob", avatarId: "a2", score: 100, connected: true },
      },
    });
    const result = transition(session, { type: "SUBMIT_WAGER", contestantId: "p1", amount: 500 });
    expect(result.success).toBe(false);
  });

  it("starts the final round once every contestant has wagered", () => {
    let session = baseSession({
      phase: "wager_input",
      players: {
        p1: { id: "p1", nickname: "Alice", avatarId: "a1", score: 100, connected: true },
        p2: { id: "p2", nickname: "Bob", avatarId: "a2", score: 100, connected: true },
      },
    });
    session = expectOk(
      transition(session, { type: "SUBMIT_WAGER", contestantId: "p1", amount: 50 }),
    );
    expect(session.phase).toBe("wager_input");

    session = expectOk(
      transition(session, { type: "SUBMIT_WAGER", contestantId: "p2", amount: 30 }),
    );
    expect(session.phase).toBe("countdown_to_start");
    expect(session.isFinalRound).toBe(true);
  });
});
