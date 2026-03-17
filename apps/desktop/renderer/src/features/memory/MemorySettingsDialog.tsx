import { useTranslation } from "react-i18next";

import { Button, Checkbox, Input, Text } from "../../components/primitives";
import { Dialog } from "../../components/primitives/Dialog";
import { useMemoryStore } from "../../stores/memoryStore";

/**
 * MemorySettingsDialog provides a modal interface for memory system settings.
 *
 * Settings include:
 * - injectionEnabled: Whether AI uses memories during writing
 * - preferenceLearningEnabled: Whether AI learns from user feedback
 * - privacyModeEnabled: Reduces storage of identifiable content
 * - preferenceLearningThreshold: How many signals before learning triggers
 */
export function MemorySettingsDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): JSX.Element {
  const { t } = useTranslation();
  const settings = useMemoryStore((s) => s.settings);
  const updateSettings = useMemoryStore((s) => s.updateSettings);

  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={t("memory.settings.title")}
      description={t("memory.settings.description")}
      footer={
        <Button
          variant="primary"
          size="md"
          onClick={() => props.onOpenChange(false)}
        >
          {t("memory.settings.done")}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        <Checkbox
          data-testid="memory-settings-injection"
          checked={settings?.injectionEnabled ?? true}
          onCheckedChange={(checked) =>
            void updateSettings({
              patch: { injectionEnabled: checked === true },
            })
          }
          disabled={!settings}
          label={t("memory.settings.enableInjection")}
        />
        <Text size="tiny" color="muted" className="-mt-2 ml-6">
          {t("memory.settings.injectionDesc")}
        </Text>

        <Checkbox
          data-testid="memory-settings-learning"
          checked={settings?.preferenceLearningEnabled ?? true}
          onCheckedChange={(checked) =>
            void updateSettings({
              patch: { preferenceLearningEnabled: checked === true },
            })
          }
          disabled={!settings}
          label={t("memory.settings.enableLearning")}
        />
        <Text size="tiny" color="muted" className="-mt-2 ml-6">
          {t("memory.settings.learningDesc")}
        </Text>

        <Checkbox
          data-testid="memory-settings-privacy"
          checked={settings?.privacyModeEnabled ?? false}
          onCheckedChange={(checked) =>
            void updateSettings({
              patch: { privacyModeEnabled: checked === true },
            })
          }
          disabled={!settings}
          label={t("memory.settings.privacyMode")}
        />
        <Text size="tiny" color="muted" className="-mt-2 ml-6">
          {t("memory.settings.privacyDesc")}
        </Text>

        <div className="flex items-center gap-3 mt-2">
          <Text size="small" color="muted">
            {t("memory.settings.learningThreshold")}
          </Text>
          <Input
            data-testid="memory-settings-threshold"
            type="number"
            min={1}
            max={100}
            value={settings?.preferenceLearningThreshold ?? 3}
            onChange={(e) =>
              void updateSettings({
                patch: { preferenceLearningThreshold: Number(e.target.value) },
              })
            }
            disabled={!settings}
            className="w-20 h-8"
          />
        </div>
        <Text size="tiny" color="muted" className="-mt-2">
          {t("memory.settings.thresholdDesc")}
        </Text>
      </div>
    </Dialog>
  );
}
