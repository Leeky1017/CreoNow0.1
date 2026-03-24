import { useTranslation } from "react-i18next";

import { Text } from "../../components/primitives/Text";

export function CommandPaletteFooter(): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="h-9 px-4 flex items-center justify-end gap-4 border-t border-[var(--color-border-default)] bg-[var(--color-bg-surface)]">
      <div className="flex items-center gap-1.5">
        <span className="px-1 min-w-4 h-4 flex items-center justify-center text-(--text-status) text-[var(--color-fg-muted)] bg-[var(--color-zen-hover)] rounded">
          {/* 审计：v1-13 #018 KEEP */}
          {/* eslint-disable-next-line i18next/no-literal-string -- 技术原因：decorative navigation arrow glyphs, not user-facing translatable text */}
          ↑↓
        </span>
        <Text size="tiny" color="placeholder">
          {t("workbench.commandPalette.footer.navigation")}
        </Text>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="px-1 min-w-4 h-4 flex items-center justify-center text-(--text-status) text-[var(--color-fg-muted)] bg-[var(--color-zen-hover)] rounded">
          {/* 审计：v1-13 #019 KEEP */}
          {/* eslint-disable-next-line i18next/no-literal-string -- 技术原因：decorative enter arrow glyph, not user-facing translatable text */}
          ↵
        </span>
        <Text size="tiny" color="placeholder">
          {t("workbench.commandPalette.footer.select")}
        </Text>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="px-1 min-w-4 h-4 flex items-center justify-center text-(--text-status) text-[var(--color-fg-muted)] bg-[var(--color-zen-hover)] rounded">
          {t("workbench.commandPalette.footer.escKey")}
        </span>
        <Text size="tiny" color="placeholder">
          {t("workbench.commandPalette.footer.close")}
        </Text>
      </div>
    </div>
  );
}
