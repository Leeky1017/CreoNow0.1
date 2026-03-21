import { useTranslation } from "react-i18next";
import { Button } from "../../components/primitives/Button";

type AiPanelTabBarProps = {
  activeTab: "chat" | "history";
  onTabChange: (tab: "chat" | "history") => void;
};

export function AiPanelTabBar(props: AiPanelTabBarProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <div
      role="tablist"
      className="flex border-b border-[var(--color-separator)] px-3"
    >
      <TabButton
        label={t("ai.tabChat")}
        active={props.activeTab === "chat"}
        onClick={() => props.onTabChange("chat")}
      />
      <TabButton
        label={t("ai.tabHistory")}
        active={props.activeTab === "history"}
        onClick={() => props.onTabChange("history")}
      />
    </div>
  );
}

function TabButton(props: {
  label: string;
  active: boolean;
  onClick: () => void;
}): JSX.Element {
  return (
    <Button
      type="button"
      role="tab"
      aria-selected={props.active}
      onClick={props.onClick}
      className={`px-3 py-2 text-[13px] font-medium transition-colors duration-[var(--duration-fast)] relative focus-ring ${
        props.active
          ? "text-[var(--color-fg-default)] border-b-2 border-[var(--color-accent)]"
          : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)]"
      }`}
    >
      {props.label}
    </Button>
  );
}
