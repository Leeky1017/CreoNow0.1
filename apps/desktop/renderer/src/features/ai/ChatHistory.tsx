import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/primitives/Button";
import { Input } from "../../components/primitives/Input";
import { Text } from "../../components/primitives";
import { useAiStore } from "../../stores/aiStore";

type ChatHistoryProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectChat: (chatId: string) => void;
  projectId: string;
};

/**
 * ChatHistory renders a dropdown list of past conversations.
 *
 * Fetches sessions from IPC when opened and supports search filtering.
 */
export function ChatHistory(props: ChatHistoryProps): JSX.Element | null {
  const { open, onOpenChange, onSelectChat, projectId } = props;
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const chatSessions = useAiStore((s) => s.chatSessions);
  const chatSessionsStatus = useAiStore((s) => s.chatSessionsStatus);
  const loadChatSessions = useAiStore((s) => s.loadChatSessions);
  const deleteChatSession = useAiStore((s) => s.deleteChatSession);

  useEffect(() => {
    if (open && projectId) {
      void loadChatSessions({
        projectId,
        ...(searchQuery.trim() ? { query: searchQuery.trim() } : {}),
      });
    }
  }, [open, projectId, searchQuery, loadChatSessions]);

  const handleSelect = useCallback(
    (sessionId: string) => {
      onSelectChat(sessionId);
    },
    [onSelectChat],
  );

  const handleDelete = useCallback(
    (sessionId: string) => {
      void deleteChatSession({ projectId, sessionId });
    },
    [deleteChatSession, projectId],
  );

  if (!open) {
    return null;
  }

  const isEmpty = chatSessions.length === 0 && chatSessionsStatus === "ready";

  return (
    <>
      {/* Backdrop to close on click outside */}
      <div
        role="presentation"
        onClick={() => onOpenChange(false)}
        className="fixed inset-0 z-[var(--z-dropdown)]"
      />

      {/* Dropdown panel */}
      <div
        role="dialog"
        aria-label={t("ai.chatHistory.ariaLabel")}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-full right-0 mt-1 w-64 z-[var(--z-popover)] bg-[var(--color-bg-raised)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] overflow-hidden"
      >
        {/* Search input */}
        <div className="px-3 py-2 border-b border-[var(--color-separator)]">
          <Input
            type="search"
            placeholder={t("ai.chatHistory.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs"
            aria-label={t("ai.chatHistory.searchPlaceholder")}
            fullWidth
          />
        </div>

        {/* Session list */}
        <div className="max-h-64 overflow-y-auto">
          {isEmpty ? (
            <div className="px-4 py-8 text-center">
              <Text size="tiny" color="muted">
                {t("ai.chatHistory.emptyTitle")}
              </Text>
              <Text size="tiny" color="muted" className="mt-1 block">
                {t("ai.chatHistory.emptyDescription")}
              </Text>
            </div>
          ) : (
            chatSessions.map((session) => (
              <div
                key={session.sessionId}
                className="group flex items-center gap-1 px-3 py-2 hover:bg-[var(--color-bg-hover)] cursor-pointer"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-left truncate text-xs"
                  onClick={() => handleSelect(session.sessionId)}
                >
                  {session.title || t("ai.chatHistory.untitledSession")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={t("ai.chatHistory.deleteSession")}
                  className="opacity-0 group-hover:opacity-100 shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-danger)] text-xs focus-visible:opacity-100"
                  onClick={() => handleDelete(session.sessionId)}
                >
                  <span aria-hidden="true">{"\u2715"}</span>
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
