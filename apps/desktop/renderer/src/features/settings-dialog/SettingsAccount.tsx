import { useTranslation } from "react-i18next";
import { Avatar, Button, Text, Tooltip } from "../../components/primitives";

/**
 * Subscription plan types
 */
export type SubscriptionPlan = "free" | "pro" | "team";

/**
 * Account settings state
 */
export interface AccountSettings {
  name: string;
  email: string;
  avatarUrl?: string;
  plan: SubscriptionPlan;
}

/**
 * SettingsAccount page props
 */
export interface SettingsAccountProps {
  /** Current account info */
  account: AccountSettings;
  /** Callback when upgrade is requested */
  onUpgrade?: () => void;
  /** Callback when logout is requested */
  onLogout?: () => void;
  /** Callback when delete account is requested */
  onDeleteAccount?: () => void;
}

/**
 * Section label styles
 */
const sectionLabelStyles = [
  "text-[10px]",
  "uppercase",
  "tracking-[0.15em]",
  "text-[var(--color-fg-placeholder)]",
  "font-semibold",
  "mb-6",
].join(" ");

/**
 * Divider styles
 */
const dividerStyles = [
  "w-full",
  "h-px",
  "bg-[var(--color-separator)]",
  "my-12",
].join(" ");

/**
 * Card styles
 */
const cardStyles = [
  "p-4",
  "rounded-[var(--radius-md)]",
  "bg-[var(--color-bg-raised)]",
].join(" ");

/**
 * Plan badge component
 */
function PlanBadge({ plan }: { plan: SubscriptionPlan }): JSX.Element {
  const planConfig: Record<
    SubscriptionPlan,
    { label: string; className: string }
  > = {
    free: {
      label: "Free",
      className: "bg-[var(--color-bg-surface)] text-[var(--color-fg-muted)]",
    },
    pro: {
      label: "Pro",
      className: "bg-[var(--color-info-subtle)] text-[var(--color-info)]",
    },
    team: {
      label: "Team",
      className: "bg-[var(--color-success-subtle)] text-[var(--color-success)]",
    },
  };

  const { label, className } = planConfig[plan];

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

/**
 * SettingsAccount page component
 *
 * Account settings page with profile, subscription, and danger zone sections.
 */
export function SettingsAccount({
  account,
  onUpgrade,
  onLogout: _onLogout,
  onDeleteAccount,
}: SettingsAccountProps): JSX.Element {
  const { t } = useTranslation();
  void _onLogout; // Reserved for future use
  return (
    <div className="max-w-[560px]">
      {/* Header */}
      <h1 className="text-2xl font-normal text-[var(--color-fg-default)] mb-2 tracking-tight">
        {t("settingsDialog.account.title")}
      </h1>
      <p className="text-[var(--color-fg-subtle)] text-sm mb-12 font-light">
        {t("settingsDialog.account.subtitle")}
      </p>

      {/* Profile Section */}
      <div className="mb-14">
        <h4 className={sectionLabelStyles}>
          {t("settingsDialog.account.profile")}
        </h4>

        <div className={`${cardStyles} flex items-center gap-4`}>
          <Avatar src={account.avatarUrl} fallback={account.name} size="lg" />
          <div className="flex flex-col gap-1">
            <Text size="body" weight="medium" color="default">
              {account.name}
            </Text>
            <Text size="small" color="muted">
              {account.email}
            </Text>
          </div>
          <Tooltip content={t("settingsDialog.account.comingSoonTooltip")}>
            <Button
              variant="secondary"
              size="sm"
              className="ml-auto"
              disabled
              aria-disabled="true"
            >
              {t("settingsDialog.account.editProfile")}
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className={dividerStyles} />

      {/* Subscription Section */}
      <div className="mb-14">
        <h4 className={sectionLabelStyles}>
          {t("settingsDialog.account.subscription")}
        </h4>

        <div className={cardStyles}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Text size="body" weight="medium" color="default">
                {t("settingsDialog.account.currentPlan")}
              </Text>
              <PlanBadge plan={account.plan} />
            </div>
          </div>

          <Text size="small" color="muted" className="mb-4" as="p">
            {account.plan === "free"
              ? "Upgrade to Pro for unlimited AI assistance, priority support, and advanced export options."
              : account.plan === "pro"
                ? "You have access to all Pro features including unlimited AI assistance and priority support."
                : "Team plan includes collaboration features, shared workspaces, and admin controls."}
          </Text>

          <div className="flex gap-3">
            {account.plan === "free" && (
              <Tooltip content={t("settingsDialog.account.comingSoonTooltip")}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onUpgrade}
                  disabled
                  aria-disabled="true"
                >
                  {t("settingsDialog.account.upgradeToPro")}
                </Button>
              </Tooltip>
            )}
            {account.plan !== "free" && (
              <Tooltip content={t("settingsDialog.account.comingSoonTooltip")}>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled
                  aria-disabled="true"
                >
                  {t("settingsDialog.account.manageSubscription")}
                </Button>
              </Tooltip>
            )}
          </div>
          <Text size="small" color="muted" as="p" className="mt-3">
            {t("settingsDialog.account.comingSoon")}
          </Text>
        </div>
      </div>

      <div className={dividerStyles} />

      {/* Danger Zone */}
      <div className="mb-6">
        <h4 className={sectionLabelStyles}>
          {t("settingsDialog.account.dangerZone")}
        </h4>

        <div className={cardStyles}>
          <div className="flex items-center justify-between">
            <div>
              <Text size="body" weight="medium" color="default">
                {t("settingsDialog.account.deleteAccount")}
              </Text>
              <Text size="small" color="muted" as="p" className="mt-1">
                {t("settingsDialog.account.deleteAccountDescription")}
              </Text>
            </div>
            <Tooltip content={t("settingsDialog.account.comingSoonTooltip")}>
              <Button
                variant="danger"
                size="sm"
                onClick={onDeleteAccount}
                disabled
                aria-disabled="true"
              >
                {t("settingsDialog.account.deleteAccount")}
              </Button>
            </Tooltip>
          </div>
          <Text size="small" color="muted" as="p" className="mt-3">
            {t("settingsDialog.account.comingSoon")}
          </Text>
        </div>
      </div>
    </div>
  );
}

/**
 * Default account settings (example data)
 */
export const defaultAccountSettings: AccountSettings = {
  name: "Sarah Mitchell",
  email: "sarah@example.com",
  avatarUrl: undefined,
  plan: "pro",
};
