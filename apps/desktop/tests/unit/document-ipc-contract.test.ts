import { describe, expect, it } from "vitest";

import { ipcContract } from "../../main/src/ipc/contract/ipc-contract";

type IpcChannelMap = Record<string, unknown>;
type ObjectSchema = { kind: "object"; fields: Record<string, unknown> };
type ContractChannel = { request: unknown; response: unknown };

function asObjectSchema(value: unknown): ObjectSchema {
  if (
    typeof value !== "object" ||
    value === null ||
    (value as { kind?: string }).kind !== "object"
  ) {
    throw new Error("expected object schema");
  }
  return value as ObjectSchema;
}

const channels = ipcContract.channels as unknown as Record<
  string,
  ContractChannel
>;
const errorCodes = ipcContract.errorCodes as readonly string[];

function hasField(schema: ObjectSchema, field: string): boolean {
  return Object.prototype.hasOwnProperty.call(schema.fields, field);
}

describe("document IPC contract", () => {
  it("should keep required CRUD and version channels while removing legacy aliases", () => {
    const channelNames = Object.keys(ipcContract.channels as IpcChannelMap);
    const required = [
      "file:document:create",
      "file:document:read",
      "file:document:update",
      "file:document:save",
      "file:document:delete",
      "file:document:list",
      "file:document:getcurrent",
      "file:document:reorder",
      "file:document:updatestatus",
      "version:snapshot:create",
      "version:snapshot:list",
      "version:snapshot:read",
      "version:snapshot:diff",
      "version:snapshot:rollback",
      "version:branch:create",
      "version:branch:list",
      "version:branch:switch",
      "version:branch:merge",
      "version:conflict:resolve",
    ] as const;
    const legacy = ["file:document:rename", "file:document:write"] as const;

    for (const channel of required) {
      expect(channelNames.includes(channel)).toBe(true);
    }

    for (const channel of legacy) {
      expect(channelNames.includes(channel)).toBe(false);
    }
  });

  it("should expose hardening error codes", () => {
    const required = [
      "VERSION_SNAPSHOT_COMPACTED",
      "VERSION_DIFF_PAYLOAD_TOO_LARGE",
      "VERSION_ROLLBACK_CONFLICT",
    ] as const;

    for (const code of required) {
      expect(errorCodes.includes(code)).toBe(true);
    }
  });

  it("should expose branch merge and conflict request core fields", () => {
    const createReq = asObjectSchema(
      channels["version:branch:create"]?.request,
    );
    expect(hasField(createReq, "documentId")).toBe(true);
    expect(hasField(createReq, "name")).toBe(true);

    const listReq = asObjectSchema(channels["version:branch:list"]?.request);
    expect(hasField(listReq, "documentId")).toBe(true);

    const switchReq = asObjectSchema(
      channels["version:branch:switch"]?.request,
    );
    expect(hasField(switchReq, "documentId")).toBe(true);
    expect(hasField(switchReq, "name")).toBe(true);

    const mergeReq = asObjectSchema(channels["version:branch:merge"]?.request);
    expect(hasField(mergeReq, "documentId")).toBe(true);
    expect(hasField(mergeReq, "sourceBranchName")).toBe(true);
    expect(hasField(mergeReq, "targetBranchName")).toBe(true);

    const resolveReq = asObjectSchema(
      channels["version:conflict:resolve"]?.request,
    );
    expect(hasField(resolveReq, "documentId")).toBe(true);
    expect(hasField(resolveReq, "mergeSessionId")).toBe(true);
    expect(hasField(resolveReq, "resolutions")).toBe(true);
  });

  it("should expose snapshot diff and rollback schemas", () => {
    const diffReq = asObjectSchema(channels["version:snapshot:diff"]?.request);
    expect(hasField(diffReq, "documentId")).toBe(true);
    expect(hasField(diffReq, "baseVersionId")).toBe(true);

    const diffRes = asObjectSchema(channels["version:snapshot:diff"]?.response);
    expect(hasField(diffRes, "diffText")).toBe(true);
    expect(hasField(diffRes, "hasDifferences")).toBe(true);
    expect(hasField(diffRes, "stats")).toBe(true);

    const rollbackReq = asObjectSchema(
      channels["version:snapshot:rollback"]?.request,
    );
    expect(hasField(rollbackReq, "documentId")).toBe(true);
    expect(hasField(rollbackReq, "versionId")).toBe(true);

    const rollbackRes = asObjectSchema(
      channels["version:snapshot:rollback"]?.response,
    );
    expect(hasField(rollbackRes, "restored")).toBe(true);
  });

  it("should expose snapshot create and wordCount fields in snapshot payloads", () => {
    const createReq = asObjectSchema(
      channels["version:snapshot:create"]?.request,
    );
    expect(hasField(createReq, "documentId")).toBe(true);
    expect(hasField(createReq, "contentJson")).toBe(true);
    expect(hasField(createReq, "actor")).toBe(true);
    expect(hasField(createReq, "reason")).toBe(true);

    const createRes = asObjectSchema(
      channels["version:snapshot:create"]?.response,
    );
    expect(hasField(createRes, "compaction")).toBe(true);

    const saveRes = asObjectSchema(channels["file:document:save"]?.response);
    expect(hasField(saveRes, "compaction")).toBe(true);

    const listRes = asObjectSchema(channels["version:snapshot:list"]?.response);
    const listItems = listRes.fields.items as {
      kind: "array";
      element: unknown;
    };
    expect(listItems.kind).toBe("array");
    const listItem = asObjectSchema(listItems.element);
    expect(hasField(listItem, "wordCount")).toBe(true);

    const readRes = asObjectSchema(channels["version:snapshot:read"]?.response);
    expect(hasField(readRes, "wordCount")).toBe(true);
  });

  it("should include document type and status fields in create and list contracts", () => {
    const createReq = asObjectSchema(channels["file:document:create"]?.request);
    expect(hasField(createReq, "type")).toBe(true);

    const listRes = asObjectSchema(channels["file:document:list"]?.response);
    const itemsSchema = listRes.fields.items as {
      kind: "array";
      element: unknown;
    };
    expect(itemsSchema.kind).toBe("array");
    const itemObject = asObjectSchema(itemsSchema.element);
    expect(hasField(itemObject, "type")).toBe(true);
    expect(hasField(itemObject, "status")).toBe(true);
  });
});
