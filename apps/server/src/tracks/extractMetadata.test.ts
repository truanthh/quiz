import NodeID3 from "node-id3";
import { describe, expect, it } from "vitest";
import { extractTrackMetadata } from "./extractMetadata.js";

describe("extractTrackMetadata", () => {
  it("reads title and artist from ID3 tags", () => {
    const tagged = NodeID3.create({ title: "Never Gonna Give You Up", artist: "Rick Astley" });
    const metadata = extractTrackMetadata(tagged);
    expect(metadata.title).toBe("Never Gonna Give You Up");
    expect(metadata.artist).toBe("Rick Astley");
    expect(metadata.poster).toBeUndefined();
  });

  it("extracts an embedded cover image when present", () => {
    const imageBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    const tagged = NodeID3.create({
      title: "Track",
      artist: "Artist",
      image: {
        mime: "image/jpeg",
        type: { id: 3, name: "front cover" },
        description: "cover",
        imageBuffer,
      },
    });
    const metadata = extractTrackMetadata(tagged);
    expect(metadata.poster?.mimeType).toBe("image/jpeg");
    expect(metadata.poster?.buffer.equals(imageBuffer)).toBe(true);
  });

  it("returns undefined fields when no tags are present", () => {
    const untagged = Buffer.from("not an mp3 at all");
    const metadata = extractTrackMetadata(untagged);
    expect(metadata.title).toBeUndefined();
    expect(metadata.artist).toBeUndefined();
    expect(metadata.poster).toBeUndefined();
  });
});
