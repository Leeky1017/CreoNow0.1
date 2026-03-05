import { useTranslation } from "react-i18next";
import { Dialog } from "../../components/primitives/Dialog";
import { Button } from "../../components/primitives/Button";
import { Textarea } from "../../components/primitives/Textarea";
import { Text } from "../../components/primitives/Text";

type PreviewVersion = {
  versionId: string;
  actor: "user" | "auto" | "ai";
  reason: string;
  createdAt: number;
  contentText: string;
};

type VersionPreviewDialogProps = {
  open: boolean;
  loading: boolean;
  data: PreviewVersion | null;
  error: { code: string; message: string } | null;
  onOpenChange: (open: boolean) => void;
};

type TFunction = (key: string, options?: Record<string, unknown>) => string;

/**
 * Convert actor value into dialog display text.
 */
function formatActor(actor: "user" | "auto" | "ai", t: TFunction): string {
  if (actor === "user") return t('versionHistory.preview.actorUser');
  if (actor === "ai") return t('versionHistory.preview.actorAi');
  return t('versionHistory.preview.actorAutoSave');
}

/**
 * VersionPreviewDialog shows a read-only historical snapshot.
 *
 * Why: users need safe inspection before deciding whether to restore.
 */
export function VersionPreviewDialog(
  props: VersionPreviewDialogProps,
): JSX.Element {
  const { t } = useTranslation();
  const footer = (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={() => props.onOpenChange(false)}
    >
      {t('versionHistory.preview.close')}
    </Button>
  );

  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={t('versionHistory.preview.title')}
      description={t('versionHistory.preview.description')}
      footer={footer}
    >
      <div data-testid="version-preview-dialog" className="space-y-3">
        {props.loading ? (
          <Text
            data-testid="version-preview-loading"
            size="small"
            color="muted"
          >
            {t('versionHistory.preview.loading')}
          </Text>
        ) : null}

        {!props.loading && props.error ? (
          <div
            data-testid="version-preview-error"
            className="rounded-[var(--radius-sm)] border border-[var(--color-error)] bg-[var(--color-error-subtle)] p-3"
          >
            <Text size="small" className="text-[var(--color-error)]">
              {props.error.code}: {props.error.message}
            </Text>
          </div>
        ) : null}

        {!props.loading && !props.error && props.data ? (
          <>
            <div className="grid grid-cols-2 gap-2 text-xs text-[var(--color-fg-muted)]">
              <div>
                <span className="font-medium text-[var(--color-fg-default)]">
                  {t('versionHistory.preview.actorLabel')}
                </span>{" "}
                {formatActor(props.data.actor, t)}
              </div>
              <div>
                <span className="font-medium text-[var(--color-fg-default)]">
                  {t('versionHistory.preview.timestampLabel')}
                </span>{" "}
                {new Date(props.data.createdAt).toLocaleString()}
              </div>
              <div className="col-span-2">
                <span className="font-medium text-[var(--color-fg-default)]">
                  {t('versionHistory.preview.reasonLabel')}
                </span>{" "}
                {props.data.reason}
              </div>
            </div>
            <Textarea
              data-testid="version-preview-content"
              value={props.data.contentText}
              readOnly
              rows={14}
              fullWidth
              className="resize-none"
            />
          </>
        ) : null}
      </div>
    </Dialog>
  );
}
