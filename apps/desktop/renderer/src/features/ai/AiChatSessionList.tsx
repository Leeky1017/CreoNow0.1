import { useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Text } from "../../components/primitives";
import { useAiStore } from "../../stores/aiStore";

type AiChatSessionListProps = {
  projectId: string;
  onSelectSession: (sessionId: string) => void;
};

export function AiChatSessionList(props: AiChatSessionListProps): JSX.Element {
  const { projectId, onSelectSession } = props;
  const { t } = useTranslation();

  const chatSessions = useAiStore((s) => s.chatSessions);
  const chatSessionsStatus = useAiStore((s) => s.chatSessionsStatus);
  const loadChatSessions = useAiStore((s) => s.loadChatSessions);
  const deleteChatSession = useAiStore((s) => s.deleteChatSession);

  useEffect(() => {
    if (projectId) {
      void loadChatSessions({ projectId });
    }
  }, [projectId, loadChatSessions]);

  const handleDelete = useCallback(
    (sessionId: string) => {
      void deleteChatSession({ projectId, sessionId });
    },
    [deleteChatSession, projectId],
  );

  const isEmpty = chatSessions.length === 0 && chatSessionsStatus === "ready";

  return (
    <div
      data-testid="ai-session-list"
      className="flex-1 overflow-y-auto min-h-0"
    >
      {chatSessionsStatus === "loading" && (
        <div className="px-4 py-8 text-center">
          <Text size="tiny" color="muted">
            {t("ai.panel.generating")}
          </Text>
        </div>
      )}
      {isEmpty && (
        <div className="px-4 py-8 text-center">
          <Text size="tiny" color="muted">
            {t("ai.chatHistory.emptyTitle")}
          </Text>
          <Text size="tiny" color="muted" className="mt-1 block">
            {t("ai.chatHistory.emptyDescription")}
          </Text>
        </div>
      )}
      {chatSessions.map((session) => (
        <div
          key={session.sessionId}
          className="group flex items-center gap-1 px-3 py-2 hover:bg-[var(--color-bg-hover)] cursor-pointer"
        >
          {/* eslint-disable-next-line creonow/no-native-html-element -- lightweight list item button */}
          <button
            type="button"
            className="flex-1 text-left truncate text-xs text-[var(--color-fg-default)]"
            onClick={() => onSelectSession(session.sessionId)}
          >
            {session.title || t("ai.chatHistory.untitledSession")}
          </button>
          {/* eslint-disable-next-line creonow/no-native-html-element -- lightweight delete button */}
          <button
            type="button"
            aria-label={t("ai.chatHistory.deleteSession")}
            className="opacity-0 group-hover:opacity-100 shrink-0 text-[var(--color-fg-muted)] hover:text-[var(--color-danger)] text-xs focus-visible:opacity-100"
            onClick={() => handleDelete(session.sessionId)}
          >
            <span aria-hidden="true">{"\u2715"}</span>
          </button>
        </div>
      ))}
    </div>
  );
}
