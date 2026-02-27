import { beforeEach, describe, expect, it } from "vitest";

import {
  MAX_RECENT_COMMANDS,
  readRecentCommandIds,
  recordRecentCommandId,
} from "./recentItems";

describe("recentItems", () => {
  beforeEach(() => {
    window.localStorage.clear();
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



  it("should normalize command ids by trimming whitespace", () => {
    recordRecentCommandId("  command-a  ");
    recordRecentCommandId("command-a");
    recordRecentCommandId("  command-b");

    expect(readRecentCommandIds()).toEqual(["command-b", "command-a"]);
  });

  it("should ignore blank and non-string ids from storage payload", () => {
    window.localStorage.setItem(
      "creonow.commandPalette.recent",
      JSON.stringify([" command-a ", "", "   ", 123, "command-b"]),
    );

    expect(readRecentCommandIds()).toEqual(["command-a", "command-b"]);
  });

  it("should return empty list when storage payload is invalid", () => {
    window.localStorage.setItem("creonow.commandPalette.recent", "{bad-json");

    expect(readRecentCommandIds()).toEqual([]);
  });
});
