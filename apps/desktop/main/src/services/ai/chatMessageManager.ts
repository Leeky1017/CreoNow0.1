/**
 * In-memory chat message manager for multi-turn conversation.
 *
 * Messages are stored in chronological order. The manager returns
 * defensive copies from getMessages() to prevent external mutation.
 *
 * Design reference: audit/02 §3.1 — conversation history management.
 */

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  skillId?: string;
  metadata?: { tokenCount: number; model: string };
};

export type ChatMessageManager = {
  add: (msg: ChatMessage) => void;
  removeById: (id: string) => void;
  clear: () => void;
  getMessages: () => ChatMessage[];
};

function cloneChatMessage(msg: ChatMessage): ChatMessage {
  return {
    ...msg,
    metadata: msg.metadata ? { ...msg.metadata } : undefined,
  };
}

export function createChatMessageManager(): ChatMessageManager {
  let messages: ChatMessage[] = [];

  return {
    add(msg: ChatMessage): void {
      messages.push(cloneChatMessage(msg));
    },

    removeById(id: string): void {
      messages = messages.filter((msg) => msg.id !== id);
    },

    clear(): void {
      messages = [];
    },

    getMessages(): ChatMessage[] {
      return messages.map(cloneChatMessage);
    },
  };
}
