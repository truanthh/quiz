import { describe, expect, it } from "vitest";
import { matchTrackAnswer } from "./matchTrackAnswer.js";

const track = { title: "Never Gonna Give You Up", artist: "Rick Astley" };

describe("matchTrackAnswer", () => {
  it("accepts the track title", () => {
    expect(matchTrackAnswer("never gonna give you up", track).verdict).toBe("accept");
  });

  it("accepts the artist name", () => {
    expect(matchTrackAnswer("rick astley", track).verdict).toBe("accept");
  });

  it("rejects an unrelated answer", () => {
    expect(matchTrackAnswer("bohemian rhapsody", track).verdict).toBe("reject");
  });
});
