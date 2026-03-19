/**
 * Helper functions for VersionHistory data transformation.
 */
import { i18n } from "../../i18n";
import type { VersionAuthorType, VersionEntry, TimeGroup } from "./versionHistoryTypes";
import type { VersionListItem } from "../../stores/versionStore";

/**
 * Map backend actor to UI author type.
 */
export function mapActorToAuthorType(
  actor: "user" | "auto" | "ai",
): VersionAuthorType {
  switch (actor) {
    case "user":
      return "user";
    case "ai":
      return "ai";
    case "auto":
      return "auto-save";
    default:
      return "user";
  }
}

/**
 * Get display name for actor type.
 */
export function getAuthorName(actor: "user" | "auto" | "ai"): string {
  switch (actor) {
    case "user":
      return i18n.t("versionHistory.container.author.you");
    case "ai":
      return i18n.t("versionHistory.container.author.ai");
    case "auto":
      return i18n.t("versionHistory.container.author.auto");
    default:
      return i18n.t("versionHistory.container.author.unknown");
  }
}

/**
 * Format timestamp for display.
 */
export function formatTimestamp(
  createdAt: number,
  now: number = Date.now(),
): string {
  const diff = now - createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) {
    return i18n.t("versionHistory.container.timeGroup.justNow");
  }
  if (minutes < 60) {
    return i18n.t("versionHistory.container.timeGroup.minutesAgo", { minutes });
  }
  if (hours < 24) {
    const date = new Date(createdAt);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const date = new Date(createdAt);
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

/**
 * Get time group label for a timestamp.
 */
export function getTimeGroupLabel(createdAt: number): string {
  const now = new Date();
  const date = new Date(createdAt);

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) {
    return "today";
  }
  if (isYesterday) {
    return "yesterday";
  }
  return "earlier";
}

/**
 * Get description for a version based on reason.
 */
export function getDescription(reason: string): string {
  if (reason === "autosave") {
    return i18n.t("versionHistory.container.autosave");
  }
  if (reason === "manual-save") {
    return i18n.t("versionHistory.container.manualSave");
  }
  if (reason === "status-change") {
    return i18n.t("versionHistory.container.statusChange");
  }
  if (reason === "ai-accept") {
    return i18n.t("versionHistory.container.aiModify");
  }
  if (reason === "restore") {
    return i18n.t("versionHistory.container.restoreVersion");
  }
  if (reason.startsWith("ai-apply:")) {
    return i18n.t("versionHistory.container.aiModify");
  }
  return reason || i18n.t("versionHistory.container.versionSnapshot");
}

/**
 * Convert backend version list to UI timeGroups format.
 */
export function convertToTimeGroups(
  items: VersionListItem[],
  currentHash: string | null,
): TimeGroup[] {
  if (items.length === 0) {
    return [];
  }

  const groupMap = new Map<string, VersionEntry[]>();

  for (const item of items) {
    const label = getTimeGroupLabel(item.createdAt);
    const isCurrent = item.contentHash === currentHash;

    const entry: VersionEntry = {
      id: item.versionId,
      timestamp: formatTimestamp(item.createdAt),
      authorType: mapActorToAuthorType(item.actor),
      authorName: getAuthorName(item.actor),
      description: getDescription(item.reason),
      wordChange: { type: "none", count: 0 }, // TODO(#571): calculate actual word diff
      isCurrent,
      reason: item.reason,
    };

    const existing = groupMap.get(label) ?? [];
    existing.push(entry);
    groupMap.set(label, existing);
  }

  // Sort groups: Today first, then Yesterday, then Earlier
  const TIME_GROUP_KEY_TO_I18N: Record<string, string> = {
    today: "versionHistory.container.timeGroup.today",
    yesterday: "versionHistory.container.timeGroup.yesterday",
    earlier: "versionHistory.container.timeGroup.earlier",
  };
  const order = ["today", "yesterday", "earlier"];
  const groups: TimeGroup[] = [];

  for (const key of order) {
    const versions = groupMap.get(key);
    if (versions && versions.length > 0) {
      groups.push({ label: i18n.t(TIME_GROUP_KEY_TO_I18N[key]), versions });
    }
  }

  return groups;
}
