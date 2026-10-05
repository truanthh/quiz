import { type AnswerField, type GameSession, type OperationResult, err, ok } from "@quiz/shared";

/**
 * The free-text round: no buzz, no lockout. Players type an artist guess and
 * a title guess whenever they like; the host reviews each field live (or
 * later, navigating back to the question) and decides whether to award its
 * points. Pure functions, same pattern as game/transition.ts - GameManager
 * calls these and persists the result.
 */

export function startGame(session: GameSession): OperationResult<GameSession> {
  if (session.phase !== "lobby") return err("game has already started");
  if (session.playlist.length === 0) return err("playlist has no tracks");
  return ok({
    ...session,
    phase: "question_active",
    currentQuestionIndex: 0,
    activePhaseIndex: null,
    activePhaseStartedAt: null,
  });
}

export function gotoQuestion(session: GameSession, index: number): OperationResult<GameSession> {
  if (session.phase !== "question_active") return err("game is not active");
  if (index < 0 || index >= session.playlist.length) return err("question index out of range");
  return ok({ ...session, currentQuestionIndex: index, activePhaseIndex: null, activePhaseStartedAt: null });
}

export function setActivePhase(session: GameSession, index: number | null): GameSession {
  // activePhaseStartedAt changes on every call, even re-selecting the same
  // index - that's what lets clients tell "play this phase again" apart
  // from "nothing changed", so the host can hit the same button as many
  // times as they like.
  return { ...session, activePhaseIndex: index, activePhaseStartedAt: index === null ? null : Date.now() };
}

export function submitFieldAnswer(
  session: GameSession,
  playerId: string,
  field: AnswerField,
  text: string,
): OperationResult<GameSession> {
  if (session.phase !== "question_active") return err("game is not active");
  if (!session.players[playerId]) return err("unknown player");

  const qIndex = session.currentQuestionIndex;
  const forQuestion = session.answersByQuestion[qIndex] ?? {};
  const forPlayer = forQuestion[playerId] ?? {};

  return ok({
    ...session,
    answersByQuestion: {
      ...session.answersByQuestion,
      [qIndex]: {
        ...forQuestion,
        [playerId]: { ...forPlayer, [field]: { text, judged: "pending", awardedPoints: 0 } },
      },
    },
  });
}

export function judgeFieldAnswer(
  session: GameSession,
  playerId: string,
  field: AnswerField,
  correct: boolean,
  points: number,
): OperationResult<GameSession> {
  const player = session.players[playerId];
  if (!player) return err("unknown player");

  const qIndex = session.currentQuestionIndex;
  const forQuestion = session.answersByQuestion[qIndex];
  const forPlayer = forQuestion?.[playerId];
  const fieldAnswer = forPlayer?.[field];
  if (!fieldAnswer) return err("no answer submitted for this field yet");

  // Re-judging (host changes their mind) undoes the previous award before
  // applying the new one, instead of stacking deltas.
  const nextAward = correct ? Math.max(0, points) : 0;
  const scoreDelta = nextAward - fieldAnswer.awardedPoints;

  return ok({
    ...session,
    players: { ...session.players, [playerId]: { ...player, score: player.score + scoreDelta } },
    answersByQuestion: {
      ...session.answersByQuestion,
      [qIndex]: {
        ...forQuestion,
        [playerId]: {
          ...forPlayer,
          [field]: { text: fieldAnswer.text, judged: correct ? "correct" : "incorrect", awardedPoints: nextAward },
        },
      },
    },
  });
}

export function finishGame(session: GameSession): OperationResult<GameSession> {
  if (session.phase !== "question_active") return err("game is not active");
  return ok({ ...session, phase: "finished" });
}
