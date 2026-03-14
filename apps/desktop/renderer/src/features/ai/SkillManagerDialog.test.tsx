import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { IpcChannel } from "@shared/types/ipc-generated";
import { SkillManagerDialog } from "./SkillManagerDialog";

const mocks = vi.hoisted(() => {
  let customSkills: Array<{
    id: string;
    name: string;
    description: string;
    promptTemplate: string;
    inputType: "selection" | "document";
    contextRules: Record<string, unknown>;
    scope: "global" | "project";
    enabled: boolean;
    createdAt: number;
    updatedAt: number;
  }> = [];

  const invoke = vi.fn(
    async (channel: IpcChannel, payload: unknown): Promise<unknown> => {
      if (channel === "skill:custom:list") {
        return { ok: true, data: { items: [...customSkills] } };
      }

      if (channel === "skill:custom:create") {
        const req = payload as {
          name: string;
          description: string;
          promptTemplate: string;
          inputType: "selection" | "document";
          contextRules: Record<string, unknown>;
          scope: "global" | "project";
          enabled?: boolean;
        };

        if (req.promptTemplate.trim().length === 0) {
          return {
            ok: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "promptTemplate 不能为空",
              details: { fieldName: "promptTemplate" },
            },
          };
        }

        const now = Date.now();
        const item = {
          id: `skill-${now}`,
          name: req.name,
          description: req.description,
          promptTemplate: req.promptTemplate,
          inputType: req.inputType,
          contextRules: req.contextRules,
          scope: req.scope,
          enabled: req.enabled ?? true,
          createdAt: now,
          updatedAt: now,
        };
        customSkills = [item, ...customSkills];
        return { ok: true, data: { skill: item } };
      }

      if (channel === "skill:custom:update") {
        const req = payload as {
          id: string;
          name?: string;
          description?: string;
          promptTemplate?: string;
          inputType?: "selection" | "document";
          contextRules?: Record<string, unknown>;
          scope?: "global" | "project";
          enabled?: boolean;
        };
        customSkills = customSkills.map((item) =>
          item.id === req.id
            ? {
                ...item,
                ...(req.name !== undefined ? { name: req.name } : {}),
                ...(req.description !== undefined
                  ? { description: req.description }
                  : {}),
                ...(req.promptTemplate !== undefined
                  ? { promptTemplate: req.promptTemplate }
                  : {}),
                ...(req.inputType !== undefined
                  ? { inputType: req.inputType }
                  : {}),
                ...(req.contextRules !== undefined
                  ? { contextRules: req.contextRules }
                  : {}),
                ...(req.scope !== undefined ? { scope: req.scope } : {}),
                ...(req.enabled !== undefined ? { enabled: req.enabled } : {}),
                updatedAt: Date.now(),
              }
            : item,
        );
        const updated = customSkills.find((item) => item.id === req.id);
        return {
          ok: true,
          data: {
            id: req.id,
            scope: updated?.scope ?? "project",
          },
        };
      }

      if (channel === "skill:custom:delete") {
        const req = payload as { id: string };
        customSkills = customSkills.filter((item) => item.id !== req.id);
        return { ok: true, data: { id: req.id, deleted: true } };
      }

      if (channel === "ai:chat:send") {
        const req = payload as { message: string };
        return {
          ok: true,
          data: {
            accepted: true,
            messageId: "chat-1",
            echoed: req.message,
          },
        };
      }

      return { ok: true, data: {} };
    },
  );

  return {
    get customSkills() {
      return customSkills;
    },
    set customSkills(next) {
      customSkills = next;
    },
    invoke,
  };
});

vi.mock("../../lib/ipcClient", () => ({
  invoke: mocks.invoke,
}));

describe("SkillManagerDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.customSkills = [];
  });

  it("should create a custom skill and show it in list when manual form is submitted", async () => {
    const user = userEvent.setup();

    render(
      <SkillManagerDialog
        open={true}
        onOpenChange={vi.fn()}
        projectId="project-1"
      />,
    );

    await user.type(screen.getByTestId("skill-form-name"), "文言文转白话");
    await user.type(
      screen.getByTestId("skill-form-description"),
      "把古文Rewrite成现代白话文",
    );
    await user.type(
      screen.getByTestId("skill-form-prompt-template"),
      "请将文本Rewrite为白话文：{{input}}",
    );

    await user.click(screen.getByTestId("skill-manager-save"));

    await waitFor(() => {
      expect(screen.getByText("文言文转白话")).toBeInTheDocument();
    });
  });

  it("should show inline field error when create returns VALIDATION_ERROR for promptTemplate", async () => {
    const user = userEvent.setup();

    render(
      <SkillManagerDialog
        open={true}
        onOpenChange={vi.fn()}
        projectId="project-1"
      />,
    );

    await user.type(screen.getByTestId("skill-form-name"), "空模板skills");
    await user.type(screen.getByTestId("skill-form-description"), "desc");

    await user.click(screen.getByTestId("skill-manager-save"));

    await waitFor(() => {
      expect(
        screen.getByTestId("skill-form-error-promptTemplate"),
      ).toHaveTextContent("Request parameters are invalid.");
    });
  });

  it("should fill editable form after AI-assisted generation", async () => {
    const user = userEvent.setup();

    render(
      <SkillManagerDialog
        open={true}
        onOpenChange={vi.fn()}
        projectId="project-1"
      />,
    );

    await user.type(
      screen.getByTestId("skill-manager-ai-description"),
      "Create一个skills，把Selected TextRewrite成鲁迅风格",
    );
    await user.click(screen.getByTestId("skill-manager-ai-generate"));

    await waitFor(() => {
      expect(screen.getByTestId("skill-form-name")).not.toHaveValue("");
      const promptField = screen.getByTestId(
        "skill-form-prompt-template",
      ) as HTMLTextAreaElement;
      expect(promptField.value).toContain("{{input}}");
    });
  });

  it("should delete a custom skill after confirmation", async () => {
    const user = userEvent.setup();
    mocks.customSkills = [
      {
        id: "skill-1",
        name: "文言文转白话",
        description: "desc",
        promptTemplate: "{{input}}",
        inputType: "selection",
        contextRules: {},
        scope: "project",
        enabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    render(
      <SkillManagerDialog
        open={true}
        onOpenChange={vi.fn()}
        projectId="project-1"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("文言文转白话")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("skill-item-delete-skill-1"));

    await waitFor(() => {
      expect(
        screen.getByText("This action cannot be undone"),
      ).toBeInTheDocument();
    });

    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(screen.queryByText("文言文转白话")).not.toBeInTheDocument();
    });
  });
});
