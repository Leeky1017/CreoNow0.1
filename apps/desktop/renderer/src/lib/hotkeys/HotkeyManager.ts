/**
 * HotkeyManager — unified keyboard shortcut routing.
 *
 * Provides scope-aware, priority-based keyboard event dispatching.
 * Only one `window.addEventListener("keydown")` is registered globally;
 * individual features register handlers via `register()` / `unregister()`
 * or the companion `useHotkey` React hook.
 *
 * @module lib/hotkeys/HotkeyManager
 */

/** Scope controls when a registration is eligible to fire. */
export type HotkeyScope = "global" | "editor" | "dialog";

/** Describes the key combination to match. */
export interface KeyCombo {
  /** The `KeyboardEvent.key` value (case-insensitive match). */
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  /**
   * Platform-agnostic modifier: matches either Ctrl or Meta (⌘).
   * When set, `ctrlKey` and `metaKey` are ignored.
   */
  modKey?: boolean;
}

/** Internal registration record. */
interface Registration {
  id: string;
  combo: KeyCombo;
  scope: HotkeyScope;
  priority: number;
  handler: (event: KeyboardEvent) => void;
}

/**
 * Centralised keyboard-shortcut dispatcher.
 *
 * Lifecycle:
 *   1. `init()` — attaches a single keydown listener.
 *   2. Components call `register()` / `unregister()` (or use `useHotkey`).
 *   3. `destroy()` — detaches the listener and clears all registrations.
 *
 * Scope semantics:
 * - `"global"` — always eligible.
 * - `"editor"` — eligible when active scope is `"global"` or `"editor"`.
 * - `"dialog"` — eligible when active scope is `"dialog"`.
 *
 * When multiple registrations match the same key event the one with the
 * **highest** priority wins. Ties are broken by registration order (later
 * registration wins).
 */
export class HotkeyManager {
  private registrations: Registration[] = [];
  private activeScope: HotkeyScope = "global";
  private listener: ((e: KeyboardEvent) => void) | null = null;

  /** Attach the global keydown listener. */
  init(): void {
    this.listener = (e: KeyboardEvent) => {
      this.handleKeyDown(e);
    };
    document.addEventListener("keydown", this.listener);
  }

  /** Detach listener and clear all registrations. */
  destroy(): void {
    if (this.listener) {
      document.removeEventListener("keydown", this.listener);
      this.listener = null;
    }
    this.registrations = [];
  }

  /**
   * Register a keyboard shortcut handler.
   *
   * @param id      Unique identifier (used for `unregister`).
   * @param combo   Key combination to match.
   * @param scope   Scope the handler belongs to.
   * @param priority Higher number = higher priority.
   * @param handler Callback invoked when matched.
   */
  register(
    id: string,
    combo: KeyCombo,
    scope: HotkeyScope,
    priority: number,
    handler: (event: KeyboardEvent) => void,
  ): void {
    // Lazy-init: attach listener on first registration if not already active.
    if (!this.listener) {
      this.init();
    }
    // Remove existing registration with the same id to avoid duplicates
    this.registrations = this.registrations.filter((r) => r.id !== id);
    this.registrations.push({ id, combo, scope, priority, handler });
  }

  /** Remove a previously registered handler by id. */
  unregister(id: string): void {
    this.registrations = this.registrations.filter((r) => r.id !== id);
  }

  /** Set the currently active scope. */
  setActiveScope(scope: HotkeyScope): void {
    this.activeScope = scope;
  }

  /** Get the currently active scope. */
  getActiveScope(): HotkeyScope {
    return this.activeScope;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Determine whether a registration is eligible given the current scope. */
  private isEligible(reg: Registration): boolean {
    if (reg.scope === "global") {
      return true;
    }
    if (reg.scope === "editor") {
      return this.activeScope === "global" || this.activeScope === "editor";
    }
    if (reg.scope === "dialog") {
      return this.activeScope === "dialog";
    }
    return false;
  }

  /** Check whether a keyboard event matches a key combo. */
  private matchesCombo(e: KeyboardEvent, combo: KeyCombo): boolean {
    if (e.key.toLowerCase() !== combo.key.toLowerCase()) {
      return false;
    }

    // modKey: treat Ctrl and Meta as interchangeable (cross-platform ⌘/Ctrl)
    if (combo.modKey) {
      const hasModifier = e.ctrlKey || e.metaKey;
      if (!hasModifier) return false;
    } else {
      if (Boolean(combo.ctrlKey) !== e.ctrlKey) return false;
      if (Boolean(combo.metaKey) !== e.metaKey) return false;
    }

    if (Boolean(combo.shiftKey) !== e.shiftKey) return false;
    if (Boolean(combo.altKey) !== e.altKey) return false;
    return true;
  }

  /** Core event handler — finds the best matching registration and invokes it. */
  private handleKeyDown(e: KeyboardEvent): void {
    const candidates = this.registrations.filter(
      (reg) => this.isEligible(reg) && this.matchesCombo(e, reg.combo),
    );

    if (candidates.length === 0) {
      return;
    }

    // Sort descending by priority; on tie, later registration wins (stable sort keeps order)
    candidates.sort((a, b) => b.priority - a.priority);

    const winner = candidates[0];
    e.preventDefault();
    e.stopPropagation();
    winner.handler(e);
  }
}

/** Singleton instance for application-wide use. */
export const hotkeyManager = new HotkeyManager();
