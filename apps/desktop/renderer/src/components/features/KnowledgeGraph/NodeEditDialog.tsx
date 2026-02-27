import React, { useState } from "react";
import { Dialog } from "../../primitives/Dialog";
import { Button } from "../../primitives/Button";
import { Input } from "../../primitives/Input";
import { Select } from "../../primitives/Select";
import { Textarea } from "../../primitives/Textarea";
import type { GraphNode, NodeEditDialogProps, NodeType } from "./types";

/**
 * Node type options for the select dropdown
 */
const nodeTypeOptions: Array<{
  value: NodeType;
  label: string;
  colorVar: string;
}> = [
  {
    value: "character",
    label: "角色 (Character)",
    colorVar: "var(--color-node-character)",
  },
  {
    value: "location",
    label: "地点 (Location)",
    colorVar: "var(--color-node-location)",
  },
  { value: "event", label: "事件 (Event)", colorVar: "var(--color-node-event)" },
  { value: "item", label: "物品 (Item)", colorVar: "var(--color-node-item)" },
  {
    value: "faction",
    label: "阵营 (Faction)",
    colorVar: "var(--color-node-other)",
  },
];

/**
 * Label styles
 */
const labelStyles =
  "block text-xs font-medium text-[var(--color-fg-muted)] mb-1.5";

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
  const typeColor =
    nodeTypeOptions.find((o) => o.value === type)?.colorVar ??
    "var(--color-fg-muted)";

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

  const title = mode === "create" ? "创建新节点" : `编辑节点: ${node?.label || ""}`;
  const submitLabel = mode === "create" ? "创建" : "保存";

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={mode === "create" ? "添加一个新的知识图谱节点" : "修改节点的属性和信息"}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!label.trim()}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name */}
        <div>
          <label className={labelStyles}>名称 *</label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="输入节点名称..."
            fullWidth
            autoFocus
          />
        </div>

        {/* Type */}
        <div>
          <label className={labelStyles}>
            <span className="flex items-center gap-2">
              类型
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: typeColor }}
              />
            </span>
          </label>
          <Select
            value={type}
            onValueChange={(value) => setType(value as NodeType)}
            options={nodeTypeOptions.map((o) => ({ value: o.value, label: o.label }))}
            fullWidth
            layer="modal"
          />
        </div>

        {/* Role (for characters) */}
        {(type === "character" || type === "faction") && (
          <div>
            <label className={labelStyles}>角色定位</label>
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="如: 主角、反派、导师..."
              fullWidth
            />
          </div>
        )}

        {/* Description */}
        <div>
          <label className={labelStyles}>描述</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="输入节点的详细描述..."
            rows={3}
            fullWidth
            className="resize-none"
          />
        </div>

        {/* Attributes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={labelStyles + " mb-0"}>属性</label>
            <button
              type="button"
              onClick={handleAddAttribute}
              className="text-[11px] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] transition-colors"
            >
              + 添加属性
            </button>
          </div>
          
          {attributes.length === 0 ? (
            <p className="text-xs text-[var(--color-fg-subtle)] italic">
              暂无属性，点击上方添加
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {attributes.map((attr, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={attr.key}
                    onChange={(e) => handleUpdateAttribute(index, "key", e.target.value)}
                    placeholder="属性名"
                    className="flex-1"
                  />
                  <span className="text-[var(--color-fg-subtle)]">:</span>
                  <Input
                    value={attr.value}
                    onChange={(e) => handleUpdateAttribute(index, "value", e.target.value)}
                    placeholder="属性值"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveAttribute(index)}
                    className="w-8 h-8 flex items-center justify-center text-[var(--color-fg-subtle)] hover:text-[var(--color-error)] transition-colors"
                    aria-label="删除属性"
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
                  </button>
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
