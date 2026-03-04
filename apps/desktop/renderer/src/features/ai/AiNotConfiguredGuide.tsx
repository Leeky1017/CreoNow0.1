import { useTranslation } from "react-i18next";

import { Button } from "../../components/primitives/Button";
import { Card } from "../../components/primitives/Card";
import { Text } from "../../components/primitives/Text";

/**
 * Guidance component shown when no API Key is configured.
 *
 * Displays a message prompting the user to configure their AI service
 * and provides a button to navigate to the settings panel.
 */
export function AiNotConfiguredGuide(props: {
  onNavigateToSettings: () => void;
}): JSX.Element {
  const { t } = useTranslation();

  return (
    <Card
      data-testid="ai-not-configured-guide"
      variant="raised"
      className="flex flex-col items-center gap-3 p-6 rounded-[var(--radius-lg)]"
    >
      <Text size="body" weight="bold">
        {t('ai.notConfigured.title')}
      </Text>

      <Text size="small" color="muted" className="text-center">
        {t('ai.notConfigured.description')}
      </Text>

      <Button
        variant="primary"
        size="sm"
        onClick={props.onNavigateToSettings}
      >
        {t('ai.notConfigured.goToSettings')}
      </Button>
    </Card>
  );
}
