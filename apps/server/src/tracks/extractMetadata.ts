import NodeID3 from "node-id3";

export interface TrackMetadata {
  title?: string;
  artist?: string;
  poster?: { buffer: Buffer; mimeType: string };
}

function readEmbeddedPoster(tags: NodeID3.Tags): { buffer: Buffer; mimeType: string } | undefined {
  const image = tags.image;
  if (!image || typeof image === "string") return undefined;
  if (!Buffer.isBuffer(image.imageBuffer)) return undefined;
  return { buffer: image.imageBuffer, mimeType: image.mime || "image/jpeg" };
}

export function extractTrackMetadata(fileBuffer: Buffer): TrackMetadata {
  const tags = NodeID3.read(fileBuffer);
  return {
    title: tags.title || undefined,
    artist: tags.artist || undefined,
    poster: readEmbeddedPoster(tags),
  };
}
