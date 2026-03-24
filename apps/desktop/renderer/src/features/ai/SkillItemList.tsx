import { useTranslation } from "react-i18next";

import { Text } from "../../components/primitives";
import { Button } from "../../components/primitives/Button";

import type { CustomSkillListItem } from "./skill-manager.types";

/**
 * SkillItemList – the existing custom skill list with edit/delete buttons.
 */
export function SkillItemList(props: {
  items: CustomSkillListItem[];
  loading: boolean;
  onEdit: (item: CustomSkillListItem) => void;
  onDelete: (item: CustomSkillListItem) => void;
}): JSX.Element {
  const { t } = useTranslation();

  return (
    <section className="space-y-2">
      <Text size="tiny" color="muted" className="uppercase tracking-wide">
        {t("ai.skillManager.customSkillList")}
      </Text>
      {props.loading ? (
        <Text size="small" color="muted">
          {t("ai.skillManager.loading")}
        </Text>
      ) : props.items.length === 0 ? (
        <Text size="small" color="muted">
          {t("ai.skillManager.noCustomSkills")}
        </Text>
      ) : (
        <div className="space-y-2" data-testid="skill-manager-list">
          {props.items.map((item) => (
            <div
              key={item.id}
              className="rounded border border-[var(--color-border-default)] p-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Text size="small" weight="semibold">
                    {item.name}
                  </Text>
                  <Text size="tiny" color="muted">
                    {item.scope === "project"
                      ? t("ai.skillManager.scopeProject")
                      : t("ai.skillManager.scopeGlobal")}{" "}
                    · {item.inputType}
                  </Text>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    className="px-2 py-1 rounded border border-[var(--color-border-default)] text-xs"
                    onClick={() => props.onEdit(item)}
                    data-testid={`skill-item-edit-${item.id}`}
                  >
                    {t("ai.skillManager.edit")}
                  </Button>
                  <Button
                    type="button"
                    className="px-2 py-1 rounded border border-[var(--color-error)]/30 text-xs text-[var(--color-error)]"
                    onClick={() => props.onDelete(item)}
                    data-testid={`skill-item-delete-${item.id}`}
                  >
                    {t("ai.skillManager.delete")}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
