import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  MAX_RECENT_COMMANDS,
  readRecentCommandIds,
  recordRecentCommandId,
} from "./recentItems";

describe("recentItems", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should store recent command ids with newest-first order and dedupe", () => {
    recordRecentCommandId("command-a");
    recordRecentCommandId("command-b");
    recordRecentCommandId("command-a");

    expect(readRecentCommandIds()).toEqual(["command-a", "command-b"]);
  });

  it("should evict oldest ids when capacity exceeds MAX_RECENT_COMMANDS", () => {
    for (let index = 1; index <= MAX_RECENT_COMMANDS + 2; index += 1) {
      recordRecentCommandId(`command-${index}`);
    }

    const ids = readRecentCommandIds();
    expect(ids).toHaveLength(MAX_RECENT_COMMANDS);
    expect(ids[0]).toBe(`command-${MAX_RECENT_COMMANDS + 2}`);
    expect(ids[ids.length - 1]).toBe("command-3");
  });

  it("should return empty list when storage payload is invalid", () => {
    window.localStorage.setItem("creonow.commandPalette.recent", "{bad-json");

    expect(readRecentCommandIds()).toEqual([]);
  });
  it("should ignore non-finite read limits and keep default capacity", () => {
    for (let index = 1; index <= 3; index += 1) {
      recordRecentCommandId(`command-${index}`);
    }

    expect(readRecentCommandIds({ limit: Number.NaN })).toEqual([
      "command-3",
      "command-2",
      "command-1",
    ]);
  });

  it("should ignore non-finite write limits without wiping history", () => {
    recordRecentCommandId("command-a");
    recordRecentCommandId("command-b", { limit: Number.NaN });

    expect(readRecentCommandIds()).toEqual(["command-b", "command-a"]);
  });

  it("should return empty list when localStorage is unavailable", () => {
    const localStorageDescriptor = Object.getOwnPropertyDescriptor(
      window,
      "localStorage",
    );

    if (!localStorageDescriptor?.configurable) {
      return;
    }

    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get: () => {
        throw new Error("blocked");
      },
    });

    expect(readRecentCommandIds()).toEqual([]);
    expect(consoleError).toHaveBeenCalledWith(
      "COMMAND_PALETTE_RECENT_STORAGE_UNAVAILABLE",
      expect.any(Error),
    );

    Object.defineProperty(window, "localStorage", localStorageDescriptor);
  });

});
