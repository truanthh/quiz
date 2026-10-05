import { describe, expect, it } from "vitest";
import { GameManager } from "./GameManager.js";

function setUp() {
  const gm = new GameManager();
  const session = gm.createSession("host-1", [
    { id: "q1", trackId: "t1", clipStartMs: 0, clipEndMs: 15000, basePoints: 100 },
  ]);
  return { gm, roomCode: session.roomCode };
}

describe("addPlayer", () => {
  it("rejects a nickname that's already taken, case-insensitively and trimmed", () => {
    const { gm, roomCode } = setUp();
    expect(gm.addPlayer(roomCode, { id: "p1", nickname: "Alice", avatarId: "a" }).success).toBe(true);
    expect(gm.addPlayer(roomCode, { id: "p2", nickname: "alice", avatarId: "b" }).success).toBe(false);
    expect(gm.addPlayer(roomCode, { id: "p3", nickname: "  Alice  ", avatarId: "c" }).success).toBe(false);
  });

  it("allows distinct nicknames", () => {
    const { gm, roomCode } = setUp();
    gm.addPlayer(roomCode, { id: "p1", nickname: "Alice", avatarId: "a" });
    expect(gm.addPlayer(roomCode, { id: "p2", nickname: "Bob", avatarId: "b" }).success).toBe(true);
  });
});

describe("removePlayer", () => {
  it("removes the player from the lobby, freeing their nickname", () => {
    const { gm, roomCode } = setUp();
    gm.addPlayer(roomCode, { id: "p1", nickname: "Alice", avatarId: "a" });
    const result = gm.removePlayer(roomCode, "p1");
    expect(result.success).toBe(true);
    expect(gm.get(roomCode)!.players.p1).toBeUndefined();
    expect(gm.addPlayer(roomCode, { id: "p2", nickname: "Alice", avatarId: "b" }).success).toBe(true);
  });

  it("refuses once the game has started", () => {
    const { gm, roomCode } = setUp();
    gm.addPlayer(roomCode, { id: "p1", nickname: "Alice", avatarId: "a" });
    gm.addScreen(roomCode, "socket-1");
    gm.startFreeTextGame(roomCode);
    expect(gm.removePlayer(roomCode, "p1").success).toBe(false);
    expect(gm.get(roomCode)!.players.p1).toBeDefined();
  });

  it("refuses an unknown player", () => {
    const { gm, roomCode } = setUp();
    expect(gm.removePlayer(roomCode, "ghost").success).toBe(false);
  });
});

describe("screen connection tracking", () => {
  it("starts disconnected, connects on the first screen", () => {
    const { gm, roomCode } = setUp();
    expect(gm.get(roomCode)!.screenConnected).toBe(false);
    gm.addScreen(roomCode, "socket-1");
    expect(gm.get(roomCode)!.screenConnected).toBe(true);
  });

  it("stays connected while any screen socket remains", () => {
    const { gm, roomCode } = setUp();
    gm.addScreen(roomCode, "socket-1");
    gm.addScreen(roomCode, "socket-2");
    gm.removeScreen(roomCode, "socket-1");
    expect(gm.get(roomCode)!.screenConnected).toBe(true);
    gm.removeScreen(roomCode, "socket-2");
    expect(gm.get(roomCode)!.screenConnected).toBe(false);
  });

  it("startFreeTextGame refuses to start without a screen connected", () => {
    const { gm, roomCode } = setUp();
    expect(gm.startFreeTextGame(roomCode).success).toBe(false);
    gm.addScreen(roomCode, "socket-1");
    expect(gm.startFreeTextGame(roomCode).success).toBe(true);
  });
});
