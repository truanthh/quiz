import { matchAnswer, type AnswerMatch } from "@quiz/shared";

export interface AnswerableTrack {
  title: string;
  artist: string;
}

/** A buzzed-in player's free-text answer is accepted if it's a good match for
 * either the track title or the artist name. */
export function matchTrackAnswer(input: string, track: AnswerableTrack): AnswerMatch {
  const byTitle = matchAnswer(input, track.title);
  const byArtist = matchAnswer(input, track.artist);
  return byTitle.score >= byArtist.score ? byTitle : byArtist;
}
