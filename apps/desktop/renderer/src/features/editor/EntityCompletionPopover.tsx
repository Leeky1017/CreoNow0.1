import type { useEditor } from "@tiptap/react";

import { useEditorStore } from "../../stores/editorStore";
import { EntityCompletionPanel } from "./EntityCompletionPanel";
import { useEntityCompletion } from "./useEntityCompletion";

export function EntityCompletionPopover(props: {
  editor: ReturnType<typeof useEditor>;
  projectId: string;
  bootstrapStatus: string;
  documentId: string | null;
  contentReady: boolean;
  isPreviewMode: boolean;
  documentStatus: string | null;
}): JSX.Element {
  const entityCompletionSession = useEditorStore(
    (s) => s.entityCompletionSession,
  );
  const setEntityCompletionSession = useEditorStore(
    (s) => s.setEntityCompletionSession,
  );
  const clearEntityCompletionSession = useEditorStore(
    (s) => s.clearEntityCompletionSession,
  );
  const listKnowledgeEntities = useEditorStore((s) => s.listKnowledgeEntities);

  const { applyEntityCompletionCandidate } = useEntityCompletion({
    editor: props.editor,
    bootstrapStatus: props.bootstrapStatus,
    documentId: props.documentId,
    contentReady: props.contentReady,
    isPreviewMode: props.isPreviewMode,
    documentStatus: props.documentStatus,
    entityCompletionSession,
    setEntityCompletionSession,
    clearEntityCompletionSession,
    listKnowledgeEntities,
    projectId: props.projectId,
  });

  return (
    <EntityCompletionPanel
      session={entityCompletionSession}
      onSelectCandidate={applyEntityCompletionCandidate}
    />
  );
}
