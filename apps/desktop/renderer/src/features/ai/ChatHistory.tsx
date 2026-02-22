import { Text } from "../../components/primitives";

/**

 * Format relative time (e.g., "1m", "3h", "2d")

 */

function formatRelativeTime(date: Date): string {
  const now = Date.now();

  const diffMs = now - date.getTime();

  const diffMins = Math.floor(diffMs / 60000);

  const diffHours = Math.floor(diffMs / 3600000);

  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";

  if (diffMins < 60) return `${diffMins}m`;

  if (diffHours < 24) return `${diffHours}h`;

  return `${diffDays}d`;
}

/**

 * Mock chat history data for demonstration.

 * In production, this would come from a store or IPC call.

 */

const MOCK_HISTORY: ChatHistoryItem[] = [
  {
    id: "chat-1",

    title: "Storybook errors investigation",

    timestamp: new Date(Date.now() - 60000), // 1 min ago

    group: "Today",
  },

  {
    id: "chat-2",

    title: "RAG与关键字检索对比",

    timestamp: new Date(Date.now() - 3600000), // 1 hour ago

    group: "Today",
  },

  {
    id: "chat-3",

    title: "Phase 4 任务代码错误",

    timestamp: new Date(Date.now() - 10800000), // 3 hours ago

    group: "Today",
  },

  {
    id: "chat-4",

    title: "P2 UI 组件开发与交付",

    timestamp: new Date(Date.now() - 86400000), // 1 day ago

    group: "Yesterday",
  },

  {
    id: "chat-5",

    title: "P2 组件 Story 和测试",

    timestamp: new Date(Date.now() - 86400000 * 2), // 2 days ago

    group: "Yesterday",
  },
];

type ChatHistoryItem = {
  id: string;

  title: string;

  timestamp: Date;

  group: "Today" | "Yesterday" | "Earlier";
};

type ChatHistoryProps = {
  open: boolean;

  onOpenChange: (open: boolean) => void;

  onSelectChat: (chatId: string) => void;
};

/**

 * ChatHistory renders a dropdown list of past conversations.

 *

 * Features:

 * - Groups chats by time (Today, Yesterday, Earlier)

 * - Click to load a previous conversation

 * - Hover to show edit/delete actions

 */

export function ChatHistory(props: ChatHistoryProps): JSX.Element | null {
  if (!props.open) {
    return null;
  }

  // Group items by their group property

  const grouped = MOCK_HISTORY.reduce<Record<string, ChatHistoryItem[]>>(
    (acc, item) => {
      if (!acc[item.group]) {
        acc[item.group] = [];
      }

      acc[item.group].push(item);

      return acc;
    },

    {},
  );

  const groups = ["Today", "Yesterday", "Earlier"] as const;

  return (
    <>
      {/* Backdrop to close on click outside */}

      <div
        role="presentation"
        onClick={() => props.onOpenChange(false)}
        className="fixed inset-0 z-[var(--z-dropdown)]"
      />

      {/* Dropdown panel */}

      <div
        role="dialog"
        aria-label="Chat History"
        onClick={(e) => e.stopPropagation()}
        className="absolute top-full right-0 mt-1 w-64 z-[var(--z-popover)] bg-[var(--color-bg-raised)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] overflow-hidden"
      >
        {/* Header */}

        <div className="px-3 py-2 border-b border-[var(--color-border-default)]">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search..."
              className="flex-1 bg-transparent border-none text-[12px] text-[var(--color-fg-default)] placeholder:text-[var(--color-fg-muted)] focus:outline-none"
            />
          </div>
        </div>

        {/* Chat list */}

        <div className="max-h-80 overflow-y-auto">
          {groups.map((group) => {
            const items = grouped[group];

            if (!items || items.length === 0) return null;

            return (
              <div key={group}>
                {/* Group header */}

                <div className="px-3 py-1.5 bg-[var(--color-bg-surface)]">
                  <Text
                    size="tiny"
                    color="muted"
                    className="uppercase tracking-wide"
                  >
                    {group}
                  </Text>
                </div>

                {/* Chat items */}

                {items.map((item) => (
                  <ChatHistoryItemRow
                    key={item.id}
                    item={item}
                    onSelect={() => props.onSelectChat(item.id)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

/**

 * Individual chat history row with hover actions.

 */

function ChatHistoryItemRow(props: {
  item: ChatHistoryItem;

  onSelect: () => void;
}): JSX.Element {
  const relativeTime = formatRelativeTime(props.item.timestamp);

  return (
    <button
      type="button"
      onClick={props.onSelect}
      className="w-full px-3 py-1.5 text-left hover:bg-[var(--color-bg-hover)] transition-colors group flex items-center justify-between"
    >
      <span className="text-[12px] text-[var(--color-fg-default)] truncate flex-1 min-w-0">
        {props.item.title}
      </span>

      {/* Time stamp - hidden on hover when actions show */}

      <span className="text-[10px] text-[var(--color-fg-muted)] shrink-0 group-hover:hidden ml-auto">
        {relativeTime}
      </span>

      {/* Hover actions - disabled until chat persistence is implemented (P1 scope) */}

      <div className="hidden group-hover:flex items-center gap-0.5 ml-2">
        <button
          type="button"
          title="Rename (Coming soon)"
          disabled
          onClick={(e) => {
            e.stopPropagation();

            // Chat rename: requires chat persistence (P1 scope)
          }}
          className="w-4 h-4 flex items-center justify-center text-[var(--color-fg-muted)] opacity-50 cursor-not-allowed rounded"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />

            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>

        <button
          type="button"
          title="Delete (Coming soon)"
          disabled
          onClick={(e) => {
            e.stopPropagation();

            // Chat delete: requires chat persistence (P1 scope)
          }}
          className="w-4 h-4 flex items-center justify-center text-[var(--color-fg-muted)] opacity-50 cursor-not-allowed rounded"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="3 6 5 6 21 6" />

            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </button>
  );
}
