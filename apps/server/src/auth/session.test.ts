import { describe, expect, it } from "vitest";
import { signSessionToken, verifySessionToken } from "./session.js";

describe("session tokens", () => {
  it("round-trips a valid token", () => {
    const token = signSessionToken({ userId: "user-1" }, "secret-a");
    expect(verifySessionToken(token, "secret-a")).toEqual({ userId: "user-1" });
  });

  it("rejects a token signed with a different secret", () => {
    const token = signSessionToken({ userId: "user-1" }, "secret-a");
    expect(verifySessionToken(token, "secret-b")).toBeNull();
  });

  it("rejects garbage input", () => {
    expect(verifySessionToken("not-a-jwt", "secret-a")).toBeNull();
  });
});
