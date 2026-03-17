/**
 * ShortcutsPanel — displays all registered keyboard shortcuts.
 *
 * Consumes `getAllShortcuts()` as the single source of truth and
 * renders shortcuts in a simple list with label + key display.
 *
 * @module features/shortcuts/ShortcutsPanel
 */

import { useTranslation } from "react-i18next";
import { getAllShortcuts, type ShortcutDef } from "../../config/shortcuts";

/**
 * Keyboard Shortcuts reference panel.
 *
 * Renders every shortcut from the centralised config as a
 * two-column list: label on the left, key display on the right.
 */
export function ShortcutsPanel(): JSX.Element {
  const { t } = useTranslation();
  const shortcuts: ShortcutDef[] = getAllShortcuts();

  return (
    <section
      data-testid="shortcuts-panel"
      className="flex flex-col gap-[var(--spacing-md)]"
      style={{ padding: "var(--spacing-lg)" }}
    >
      <h2
        className="text-[length:var(--font-size-lg)] font-semibold"
        style={{ color: "var(--color-fg-default)" }}
      >
        {t("shortcuts.title")}
      </h2>

      <ul className="flex flex-col gap-[var(--spacing-xs)]" role="list">
        {shortcuts.map((shortcut) => (
          <li
            key={shortcut.id}
            className="flex items-center justify-between py-[var(--spacing-xs)] px-[var(--spacing-sm)] rounded-[var(--radius-sm)]"
            style={{
              borderBottom: "1px solid var(--color-separator)",
            }}
          >
            <span
              className="text-[length:var(--font-size-sm)]"
              style={{ color: "var(--color-fg-default)" }}
            >
              {shortcut.label}
            </span>
            <kbd
              className="inline-flex items-center px-[var(--spacing-xs)] py-[2px] rounded-[var(--radius-xs)] text-[length:var(--font-size-xs)] font-mono"
              style={{
                backgroundColor: "var(--color-bg-subtle)",
                color: "var(--color-fg-muted)",
                border: "1px solid var(--color-separator)",
              }}
            >
              {shortcut.display()}
            </kbd>
          </li>
        ))}
      </ul>
    </section>
  );
}
