import { describe, expect, it, vi } from "vitest";

import {
  getSlashCommandRegistry,
  filterSlashCommands,
  routeSlashCommandExecution,
  type SlashCommandId,
} from "./slashCommands";

describe("s2 slash commands", () => {
  it("[SCN-S2-CMD-1] should register exactly six roadmap commands with unique ids", () => {
    const registry = getSlashCommandRegistry();
    const labels = registry.map((command) => command.label);
    expect(labels).toEqual([
      "/Continue",
      "/Describe",
      "/Dialogue",
      "/Character",
      "/Outline",
      "/Search",
    ]);

    const uniqueIds = new Set(registry.map((command) => command.id));
    expect(uniqueIds.size).toBe(registry.length);
  });

  it("[SCN-S2-CMD-2] should filter by keyword and recover full list for empty query", () => {
    const registry = getSlashCommandRegistry();
    expect(filterSlashCommands(registry, "describe")).toEqual([
      expect.objectContaining({ id: "describe" }),
    ]);

    expect(filterSlashCommands(registry, "  ")).toEqual(registry);
  });

  it("[SCN-S2-CMD-3] should route execution by command id without triggering non-target executors", () => {
    const called: SlashCommandId[] = [];

    const executors = {
      continueWriting: vi.fn(() => called.push("continueWriting")),
      describe: vi.fn(() => called.push("describe")),
      dialogue: vi.fn(() => called.push("dialogue")),
      character: vi.fn(() => called.push("character")),
      outline: vi.fn(() => called.push("outline")),
      search: vi.fn(() => called.push("search")),
    };

    const matched = routeSlashCommandExecution("dialogue", executors);
    expect(matched).toBe(true);
    expect(called).toEqual(["dialogue"]);

    expect(executors.continueWriting).not.toHaveBeenCalled();
    expect(executors.describe).not.toHaveBeenCalled();
    expect(executors.character).not.toHaveBeenCalled();
    expect(executors.outline).not.toHaveBeenCalled();
    expect(executors.search).not.toHaveBeenCalled();
  });
});
