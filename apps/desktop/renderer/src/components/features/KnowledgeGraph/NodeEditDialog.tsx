import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Dialog } from "../../primitives/Dialog";
import { Button } from "../../primitives/Button";
import { Input } from "../../primitives/Input";
import { Select } from "../../primitives/Select";
import { Textarea } from "../../primitives/Textarea";
import type { GraphNode, NodeEditDialogProps, NodeType } from "./types";
import { Label } from "../../primitives/Label";

/**
 * Node type color variables
 */
const nodeTypeColorVars: Record<NodeType, string> = {
  character: "var(--color-node-character)",
  location: "var(--color-node-location)",
  event: "var(--color-node-event)",
  item: "var(--color-node-item)",
  faction: "var(--color-node-other)",
};

/**
 * Label styles
 */
const labelStyles =
  "block text-xs font-medium text-(--color-fg-muted) mb-1.5";

/**
 * Generate a unique ID for new nodes
 */
function generateNodeId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * NodeEditDialog component
 *
 * A dialog for creating or editing knowledge graph nodes.
 * Supports editing name, type, role, description, and attributes.
 */
export function NodeEditDialog({
  open,
  onOpenChange,
  node,
  onSave,
  mode = "edit",
}: NodeEditDialogProps): JSX.Element {
  const { t } = useTranslation();

  const nodeTypeOptions = useMemo(
    () => [
      {
        value: "character" as NodeType,
        label: t("kg.nodeEdit.typeCharacter"),
        colorVar: nodeTypeColorVars.character,
      },
      {
        value: "location" as NodeType,
        label: t("kg.nodeEdit.typeLocation"),
        colorVar: nodeTypeColorVars.location,
      },
      {
        value: "event" as NodeType,
        label: t("kg.nodeEdit.typeEvent"),
        colorVar: nodeTypeColorVars.event,
      },
      {
        value: "item" as NodeType,
        label: t("kg.nodeEdit.typeItem"),
        colorVar: nodeTypeColorVars.item,
      },
      {
        value: "faction" as NodeType,
        label: t("kg.nodeEdit.typeFaction"),
        colorVar: nodeTypeColorVars.faction,
      },
    ],
    [t],
  );

  // Form state - initialized from node prop (component is keyed by node.id)
  const [label, setLabel] = useState(node?.label ?? "");
  const [type, setType] = useState<NodeType>(node?.type ?? "character");
  const [role, setRole] = useState(node?.metadata?.role ?? "");
  const [description, setDescription] = useState(
    node?.metadata?.description ?? "",
  );
  const [attributes, setAttributes] = useState<
    Array<{ key: string; value: string }>
  >(node?.metadata?.attributes ?? []);
  const typeColor = nodeTypeColorVars[type] ?? "var(--color-fg-muted)";

  /**
   * Handle adding a new attribute
   */
  const handleAddAttribute = (): void => {
    setAttributes([...attributes, { key: "", value: "" }]);
  };

  /**
   * Handle updating an attribute
   */
  const handleUpdateAttribute = (
    index: number,
    field: "key" | "value",
    value: string,
  ): void => {
    const newAttributes = [...attributes];
    newAttributes[index] = { ...newAttributes[index], [field]: value };
    setAttributes(newAttributes);
  };

  /**
   * Handle removing an attribute
   */
  const handleRemoveAttribute = (index: number): void => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();

    if (!label.trim()) {
      return;
    }

    const updatedNode: GraphNode = {
      id: node?.id || generateNodeId(),
      label: label.trim(),
      type,
      avatar: node?.avatar,
      position: node?.position || { x: 300, y: 300 },
      metadata: {
        role: role.trim() || undefined,
        description: description.trim() || undefined,
        attributes: attributes.filter((a) => a.key.trim() && a.value.trim()),
      },
    };

    onSave(updatedNode);
    onOpenChange(false);
  };

  const title =
    mode === "create"
      ? t("kg.nodeEdit.createTitle")
      : t("kg.nodeEdit.editTitle", { label: node?.label || "" });
  const submitLabel =
    mode === "create" ? t("kg.nodeEdit.create") : t("kg.nodeEdit.save");

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={
        mode === "create"
          ? t("kg.nodeEdit.createDescription")
          : t("kg.nodeEdit.editDescription")
      }
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("kg.nodeEdit.cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!label.trim()}
          >
            {submitLabel}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name */}
        <div>
          <Label className={labelStyles}>{t("kg.nodeEdit.nameLabel")}</Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t("kg.nodeEdit.namePlaceholder")}
            fullWidth
            autoFocus
          />
        </div>

        {/* Type */}
        <div>
          <Label className={labelStyles}>
            <span className="flex items-center gap-2">
              {t("kg.nodeEdit.typeLabel")}
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: typeColor }}
              />
            </span>
          </Label>
          <Select
            value={type}
            onValueChange={(value) => setType(value as NodeType)}
            options={nodeTypeOptions.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            fullWidth
            layer="modal"
          />
        </div>

        {/* Role (for characters) */}
        {(type === "character" || type === "faction") && (
          <div>
            <Label className={labelStyles}>{t("kg.nodeEdit.roleLabel")}</Label>
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder={t("kg.nodeEdit.rolePlaceholder")}
              fullWidth
            />
          </div>
        )}

        {/* Description */}
        <div>
          <Label className={labelStyles}>
            {t("kg.nodeEdit.descriptionLabel")}
          </Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("kg.nodeEdit.descriptionPlaceholder")}
            rows={3}
            fullWidth
            className="resize-none"
          />
        </div>

        {/* Attributes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className={labelStyles + " mb-0"}>
              {t("kg.nodeEdit.propertiesLabel")}
            </Label>
            <Button
              type="button"
              onClick={handleAddAttribute}
              className="text-status text-(--color-fg-muted) hover:text-(--color-fg-default) transition-colors"
            >
              {t("kg.nodeEdit.addProperty")}
            </Button>
          </div>

          {attributes.length === 0 ? (
            <p className="text-xs text-(--color-fg-subtle) italic">
              {t("kg.nodeEdit.noProperties")}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {attributes.map((attr, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={attr.key}
                    onChange={(e) =>
                      handleUpdateAttribute(index, "key", e.target.value)
                    }
                    placeholder={t("kg.nodeEdit.propertyNamePlaceholder")}
                    className="flex-1"
                  />
                  <span className="text-(--color-fg-subtle)">:</span>
                  <Input
                    value={attr.value}
                    onChange={(e) =>
                      handleUpdateAttribute(index, "value", e.target.value)
                    }
                    placeholder={t("kg.nodeEdit.propertyValuePlaceholder")}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="icon"
                    onClick={() => handleRemoveAttribute(index)}
                    className="flex items-center justify-center text-(--color-fg-subtle) hover:text-(--color-error) transition-colors"
                    aria-label={t("kg.nodeEdit.deleteProperty")}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </Dialog>
  );
}

NodeEditDialog.displayName = "NodeEditDialog";
