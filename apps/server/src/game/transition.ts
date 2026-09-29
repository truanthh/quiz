import { type GameEvent, type GameSession, type OperationResult, err, ok } from "@quiz/shared";

const SPEED_AWARD_FLOOR_RATIO = 0.3;

function computeSpeedAward(basePoints: number, elapsedMs: number, windowMs: number): number {
  const ratio = Math.max(SPEED_AWARD_FLOOR_RATIO, 1 - elapsedMs / windowMs);
  return Math.round(basePoints * ratio);
}

function contestantIds(session: GameSession): string[] {
  if (session.settings.teamMode) return Object.keys(session.teams);
  return Object.values(session.players)
    .filter((p) => p.connected)
    .map((p) => p.id);
}

function contestantScore(session: GameSession, contestantId: string): number {
  if (session.settings.teamMode) return session.teams[contestantId]?.score ?? 0;
  return session.players[contestantId]?.score ?? 0;
}

function applyDelta(session: GameSession, contestantId: string, delta: number): GameSession {
  if (session.settings.teamMode) {
    const team = session.teams[contestantId];
    if (!team) return session;
    return {
      ...session,
      teams: { ...session.teams, [contestantId]: { ...team, score: team.score + delta } },
    };
  }
  const player = session.players[contestantId];
  if (!player) return session;
  return {
    ...session,
    players: { ...session.players, [contestantId]: { ...player, score: player.score + delta } },
  };
}

function resolveAnswer(
  session: GameSession,
  contestantId: string,
  correct: boolean,
): OperationResult<GameSession> {
  const item = session.playlist[session.currentQuestionIndex];
  if (!item) return err("no active question for this session");

  if (correct) {
    const elapsed = (session.buzzedAt ?? 0) - (session.questionStartedAt ?? 0);
    const award = session.isFinalRound
      ? (session.wagers[contestantId] ?? 0)
      : computeSpeedAward(item.basePoints, elapsed, session.settings.questionWindowMs);
    const next = applyDelta(session, contestantId, award);
    return ok({
      ...next,
      phase: "reveal",
      activeAnswererId: null,
      pendingReview: false,
    });
  }

  const penalty = session.isFinalRound
    ? (session.wagers[contestantId] ?? 0)
    : session.settings.wrongAnswerPenalty;
  const withPenalty = applyDelta(session, contestantId, -penalty);
  const lockedOutIds = [...session.lockedOutIds, contestantId];
  const everyoneLocked = contestantIds(withPenalty).every((id) => lockedOutIds.includes(id));

  if (session.isFinalRound || everyoneLocked) {
    return ok({
      ...withPenalty,
      phase: "reveal",
      activeAnswererId: null,
      buzzedAt: null,
      pendingReview: false,
      lockedOutIds,
    });
  }

  return ok({
    ...withPenalty,
    phase: "question_playing",
    activeAnswererId: null,
    buzzedAt: null,
    pendingReview: false,
    lockedOutIds,
  });
}

export function transition(session: GameSession, event: GameEvent): OperationResult<GameSession> {
  switch (session.phase) {
    case "lobby": {
      if (event.type === "START_GAME") {
        return ok({ ...session, phase: "countdown_to_start" });
      }
      break;
    }

    case "countdown_to_start": {
      if (event.type === "BEGIN_QUESTION") {
        return ok({
          ...session,
          phase: "question_playing",
          questionStartedAt: event.at,
          buzzedAt: null,
          activeAnswererId: null,
          pendingReview: false,
          lockedOutIds: [],
        });
      }
      break;
    }

    case "question_playing": {
      if (event.type === "BUZZ") {
        if (session.lockedOutIds.includes(event.contestantId)) {
          return err("this contestant already answered incorrectly on this question");
        }
        return ok({
          ...session,
          phase: "answer_window",
          activeAnswererId: event.contestantId,
          buzzedAt: event.at,
          pendingReview: false,
        });
      }
      break;
    }

    case "answer_window": {
      if (event.type === "SUBMIT_ANSWER") {
        if (event.contestantId !== session.activeAnswererId) {
          return err("only the contestant who buzzed in can submit an answer");
        }
        if (event.verdict === "review") {
          return ok({ ...session, pendingReview: true });
        }
        return resolveAnswer(session, event.contestantId, event.verdict === "accept");
      }
      if (event.type === "HOST_JUDGE") {
        if (event.contestantId !== session.activeAnswererId) {
          return err("host judged a contestant who isn't the active answerer");
        }
        if (!session.pendingReview) {
          return err("no answer is pending host review");
        }
        return resolveAnswer(session, event.contestantId, event.correct);
      }
      break;
    }

    case "reveal": {
      if (event.type === "ADVANCE") {
        if (session.isFinalRound) return ok({ ...session, phase: "finished" });
        return ok({ ...session, phase: "leaderboard" });
      }
      break;
    }

    case "leaderboard": {
      if (event.type === "ADVANCE") {
        const nextIndex = session.currentQuestionIndex + 1;
        if (nextIndex < session.playlist.length) {
          return ok({ ...session, phase: "countdown_to_start", currentQuestionIndex: nextIndex });
        }
        if (session.settings.finalWagerEnabled && !session.isFinalRound) {
          return ok({ ...session, phase: "wager_input", wagers: {} });
        }
        return ok({ ...session, phase: "finished" });
      }
      break;
    }

    case "wager_input": {
      if (event.type === "SUBMIT_WAGER") {
        const cap = contestantScore(session, event.contestantId);
        if (event.amount < 0 || event.amount > cap) {
          return err("wager must be between 0 and the contestant's current score");
        }
        const wagers = { ...session.wagers, [event.contestantId]: event.amount };
        const everyoneWagered = contestantIds(session).every((id) => id in wagers);
        if (everyoneWagered) {
          return ok({ ...session, wagers, phase: "countdown_to_start", isFinalRound: true });
        }
        return ok({ ...session, wagers });
      }
      break;
    }

    case "finished":
      return err("game has already finished");
  }

  return err(`event "${event.type}" is not valid in phase "${session.phase}"`);
}
