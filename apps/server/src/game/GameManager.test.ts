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

describe("screens", () => {
  it("starts empty, adds a screen with an assigned color", () => {
    const { gm, roomCode } = setUp();
    expect(Object.keys(gm.get(roomCode)!.screens)).toHaveLength(0);
    const result = gm.addScreen(roomCode, "socket-1");
    if (!result.success) throw new Error("expected success");
    expect(result.data.color).toMatch(/^#/);
    expect(gm.get(roomCode)!.screens["socket-1"]).toEqual({ id: "socket-1", color: result.data.color });
  });

  it("gives each simultaneously-connected screen a distinct color", () => {
    const { gm, roomCode } = setUp();
    gm.addScreen(roomCode, "socket-1");
    gm.addScreen(roomCode, "socket-2");
    const screens = Object.values(gm.get(roomCode)!.screens);
    expect(screens[0]!.color).not.toBe(screens[1]!.color);
  });

  it("removing one screen leaves the others connected", () => {
    const { gm, roomCode } = setUp();
    gm.addScreen(roomCode, "socket-1");
    gm.addScreen(roomCode, "socket-2");
    gm.removeScreen(roomCode, "socket-1");
    expect(Object.keys(gm.get(roomCode)!.screens)).toEqual(["socket-2"]);
  });

  it("refuses past the 8-screen cap", () => {
    const { gm, roomCode } = setUp();
    for (let i = 0; i < 8; i++) expect(gm.addScreen(roomCode, `socket-${i}`).success).toBe(true);
    expect(gm.addScreen(roomCode, "socket-9").success).toBe(false);
  });

  it("startFreeTextGame refuses to start without a screen connected", () => {
    const { gm, roomCode } = setUp();
    expect(gm.startFreeTextGame(roomCode).success).toBe(false);
    gm.addScreen(roomCode, "socket-1");
    expect(gm.startFreeTextGame(roomCode).success).toBe(true);
  });
});

describe("addPlayer cap", () => {
  it("refuses past the 8-player cap", () => {
    const { gm, roomCode } = setUp();
    for (let i = 0; i < 8; i++) {
      expect(gm.addPlayer(roomCode, { id: `p${i}`, nickname: `Player${i}`, avatarId: "a" }).success).toBe(
        true,
      );
    }
    expect(gm.addPlayer(roomCode, { id: "p9", nickname: "OneTooMany", avatarId: "a" }).success).toBe(false);
  });
});
