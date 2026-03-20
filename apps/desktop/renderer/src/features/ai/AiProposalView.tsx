import { useTranslation } from "react-i18next";
import type { AiApplyStatus, AiProposal } from "../../stores/aiStore";
import { Button } from "../../components/primitives";
import { DiffView } from "../diff/DiffView";

export type AiProposalViewProps = {
  proposal: AiProposal;
  compareMode: boolean;
  diffText: string;
  canApply: boolean;
  inlineDiffConfirmOpen: boolean;
  applyStatus: AiApplyStatus;
  onApply: () => void;
  onReject: () => void;
  setInlineDiffConfirmOpen: (open: boolean) => void;
};

export function AiProposalView(props: AiProposalViewProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <>
      {!props.compareMode ? (
        <DiffView diffText={props.diffText} testId="ai-panel-diff" />
      ) : null}
      <div className="flex gap-2">
        <Button
          data-testid="ai-apply"
          variant="secondary"
          size="md"
          onClick={() => void props.onApply()}
          disabled={!props.canApply}
          className="flex-1"
        >
          {props.inlineDiffConfirmOpen
            ? t("ai.panel.applyArmed")
            : t("ai.panel.apply")}
        </Button>
        {props.inlineDiffConfirmOpen ? (
          <Button
            data-testid="ai-apply-confirm"
            variant="secondary"
            size="md"
            onClick={() => void props.onApply()}
            disabled={!props.canApply}
            className="flex-1"
          >
            {t("ai.panel.confirmApply")}
          </Button>
        ) : null}
        <Button
          data-testid="ai-reject"
          variant="ghost"
          size="md"
          onClick={
            props.inlineDiffConfirmOpen
              ? () => props.setInlineDiffConfirmOpen(false)
              : props.onReject
          }
          disabled={props.applyStatus === "applying"}
        >
          {props.inlineDiffConfirmOpen
            ? t("ai.panel.backToDiff")
            : t("ai.panel.reject")}
        </Button>
      </div>
    </>
  );
}
