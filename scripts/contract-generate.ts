import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import prettier from "prettier";

import { ipcContract } from "../apps/desktop/main/src/ipc/contract/ipc-contract";
import type { IpcSchema } from "../apps/desktop/main/src/ipc/contract/schema";

export type ContractGenerateErrorCode =
  | "IPC_CONTRACT_INVALID_NAME"
  | "IPC_CONTRACT_UNKNOWN_DOMAIN"
  | "IPC_CONTRACT_NAME_COLLISION"
  | "IPC_CONTRACT_MISSING_SCHEMA"
  | "IPC_CONTRACT_DUPLICATED_CHANNEL"
  | "IPC_CONTRACT_INVALID_SCHEMA_REFERENCE"
  | "IPC_CONTRACT_UNREGISTERED_BINDING";

export class ContractGenerateError extends Error {
  readonly code: ContractGenerateErrorCode;
  readonly details?: unknown;

  constructor(
    code: ContractGenerateErrorCode,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ContractGenerateError";
    this.code = code;
    this.details = details;
  }
}

type ContractChannelDefinition = {
  request?: IpcSchema;
  response?: IpcSchema;
};

export type ContractLike = {
  errorCodes: readonly string[];
  channels: Readonly<Record<string, ContractChannelDefinition>>;
};

function assertNever(x: never): never {
  throw new Error(`unreachable: ${JSON.stringify(x)}`);
}

const DOMAIN_REGISTRY: Readonly<Record<string, string>> = {
  ai: "AI Service",
  app: "Workbench",
  constraints: "Context Engine",
  context: "Context Engine",
  db: "Database",
  dialog: "Workbench",
  embedding: "Search and Retrieval",
  export: "Document Management",
  file: "Document Management",
  judge: "AI Service",
  knowledge: "Knowledge Graph",
  memory: "Memory System",
  project: "Project Management",
  rag: "Search and Retrieval",
  search: "Search and Retrieval",
  skill: "Skill System",
  stats: "Workbench",
  version: "Version Control",
  backup: "Document Management",
};
const RESOURCE_ACTION_SEGMENT_PATTERN = /^[a-z][a-z0-9]*$/;
const VALID_SCHEMA_KINDS = new Set([
  "string",
  "number",
  "boolean",
  "literal",
  "array",
  "record",
  "union",
  "optional",
  "object",
]);

function renderLiteral(value: string | number | boolean | null): string {
  if (value === null) {
    return "null";
  }
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  return String(value);
}

function renderSchema(schema: IpcSchema): string {
  switch (schema.kind) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "literal":
      return renderLiteral(schema.value);
    case "array":
      return `Array<${renderSchema(schema.element)}>`;
    case "record":
      return `Record<string, ${renderSchema(schema.value)}>`;
    case "union": {
      const parts = [...schema.variants].map((v) => renderSchema(v));
      return parts.join(" | ");
    }
    case "optional":
      return `${renderSchema(schema.schema)} | undefined`;
    case "object": {
      const entries = Object.entries(schema.fields);
      if (entries.length === 0) {
        return "Record<string, never>";
      }

      const lines = entries
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, valueSchema]) => {
          const safeKey = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)
            ? key
            : JSON.stringify(key);

          if (valueSchema.kind === "optional") {
            return `  ${safeKey}?: ${renderSchema(valueSchema.schema)};`;
          }
          return `  ${safeKey}: ${renderSchema(valueSchema)};`;
        });
      return `{\n${lines.join("\n")}\n}`;
    }
    default:
      return assertNever(schema);
  }
}

/**
 * Normalize newlines to `\\n`.
 *
 * Why: codegen output must be stable across Windows and POSIX in CI.
 */
function normalizeNewlines(s: string): string {
  return s.replaceAll("\r\n", "\n");
}

function normalizePath(p: string): string {
  return p.replaceAll(path.sep, "/");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function validateSchemaReference(schema: unknown, trace: string): void {
  if (!isRecord(schema) || typeof schema.kind !== "string") {
    throw new ContractGenerateError(
      "IPC_CONTRACT_INVALID_SCHEMA_REFERENCE",
      `Schema at ${trace} must be an object with kind`,
      { trace, schema },
    );
  }

  const kind = schema.kind;
  if (!VALID_SCHEMA_KINDS.has(kind)) {
    throw new ContractGenerateError(
      "IPC_CONTRACT_INVALID_SCHEMA_REFERENCE",
      `Schema at ${trace} has unsupported kind: ${kind}`,
      { trace, kind },
    );
  }

  switch (kind) {
    case "string":
    case "number":
    case "boolean":
      return;
    case "literal": {
      const value = schema.value;
      const valueType = typeof value;
      if (
        value === null ||
        (valueType !== "string" &&
          valueType !== "number" &&
          valueType !== "boolean")
      ) {
        if (value !== null) {
          throw new ContractGenerateError(
            "IPC_CONTRACT_INVALID_SCHEMA_REFERENCE",
            `Literal schema at ${trace} must use string/number/boolean/null`,
            { trace, value },
          );
        }
      }
      return;
    }
    case "array":
      validateSchemaReference(schema.element, `${trace}.element`);
      return;
    case "record":
      validateSchemaReference(schema.value, `${trace}.value`);
      return;
    case "union": {
      if (!Array.isArray(schema.variants) || schema.variants.length === 0) {
        throw new ContractGenerateError(
          "IPC_CONTRACT_INVALID_SCHEMA_REFERENCE",
          `Union schema at ${trace} must define non-empty variants`,
          { trace },
        );
      }
      schema.variants.forEach((variant, index) => {
        validateSchemaReference(variant, `${trace}.variants[${index}]`);
      });
      return;
    }
    case "optional":
      validateSchemaReference(schema.schema, `${trace}.schema`);
      return;
    case "object": {
      if (!isRecord(schema.fields)) {
        throw new ContractGenerateError(
          "IPC_CONTRACT_INVALID_SCHEMA_REFERENCE",
          `Object schema at ${trace} must define fields`,
          { trace },
        );
      }

      for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
        validateSchemaReference(fieldSchema, `${trace}.fields.${fieldName}`);
      }
      return;
    }
    default:
      throw assertNever(kind as never);
  }
}

function ensureNoDuplicateChannels(channels: readonly string[]): void {
  const seen = new Set<string>();
  for (const channel of channels) {
    if (seen.has(channel)) {
      throw new ContractGenerateError(
        "IPC_CONTRACT_DUPLICATED_CHANNEL",
        `Duplicated channel detected: ${channel}`,
        { channel },
      );
    }
    seen.add(channel);
  }
}

type ValidChannelName = {
  domain: string;
  resource: string;
  action: string;
};

type ChannelCollisionMeta = {
  channels: string[];
  filePaths: string[];
};

type NamingRule =
  | "segment-count"
  | "domain-whitelist"
  | "resource-action-format";

function buildNamingErrorDetails(args: {
  channel: string;
  filePath: string;
  rule: NamingRule;
  domain?: string;
  segment?: string;
}): Record<string, string> {
  const details: Record<string, string> = {
    channel: args.channel,
    filePath: args.filePath,
    rule: args.rule,
  };

  if (args.domain) {
    details.domain = args.domain;
  }

  if (args.segment) {
    details.segment = args.segment;
  }

  return details;
}

function resolveChannelSourcePath(
  channel: string,
  channelSourceMap?: Readonly<Record<string, string>>,
): string {
  return (
    channelSourceMap?.[channel] ??
    "apps/desktop/main/src/ipc/contract/ipc-contract.ts"
  );
}

function validateStrictChannelName(args: {
  channel: string;
  filePath: string;
}): ValidChannelName {
  const parts = args.channel.split(":");
  if (parts.length !== 3) {
    throw new ContractGenerateError(
      "IPC_CONTRACT_INVALID_NAME",
      `Channel ${args.channel} must use <domain>:<resource>:<action> format`,
      buildNamingErrorDetails({
        channel: args.channel,
        filePath: args.filePath,
        rule: "segment-count",
      }),
    );
  }

  const [domain, resource, action] = parts;
  if (!(domain in DOMAIN_REGISTRY)) {
    throw new ContractGenerateError(
      "IPC_CONTRACT_UNKNOWN_DOMAIN",
      `Channel ${args.channel} uses unknown domain: ${domain}`,
      buildNamingErrorDetails({
        channel: args.channel,
        filePath: args.filePath,
        rule: "domain-whitelist",
        domain,
      }),
    );
  }

  if (
    !RESOURCE_ACTION_SEGMENT_PATTERN.test(resource) ||
    !RESOURCE_ACTION_SEGMENT_PATTERN.test(action)
  ) {
    throw new ContractGenerateError(
      "IPC_CONTRACT_INVALID_NAME",
      `Channel ${args.channel} must use lowercase alnum resource/action segments`,
      buildNamingErrorDetails({
        channel: args.channel,
        filePath: args.filePath,
        rule: "resource-action-format",
      }),
    );
  }

  return { domain, resource, action };
}

function toPreloadMethodName(resource: string, action: string): string {
  return `${resource}${action}`;
}

function validatePreloadMethodCollisions(
  perMethod: Readonly<Record<string, ChannelCollisionMeta>>,
): void {
  for (const [compositeKey, collision] of Object.entries(perMethod)) {
    if (collision.channels.length < 2) {
      continue;
    }

    const [domain, methodName] = compositeKey.split(".");
    throw new ContractGenerateError(
      "IPC_CONTRACT_NAME_COLLISION",
      `Preload method name collision in domain ${domain}: ${methodName}`,
      {
        domain,
        methodName,
        channels: collision.channels,
        filePaths: collision.filePaths,
        rule: "preload-method-collision",
      },
    );
  }
}

export function extractDeclaredChannelsFromContractSource(
  source: string,
): string[] {
  const channels: string[] = [];
  const keyRegex = /^\s*"([A-Za-z0-9:]+)"\s*:\s*\{/gm;

  for (const match of source.matchAll(keyRegex)) {
    const channel = match[1];
    if (channel.includes(":")) {
      channels.push(channel);
    }
  }

  return channels;
}

export function validateContractDefinition(
  contract: ContractLike,
  options?: {
    declaredChannelsInSource?: readonly string[];
    channelSourceMap?: Readonly<Record<string, string>>;
  },
): string[] {
  const channels = Object.keys(contract.channels);
  const declaredChannels = options?.declaredChannelsInSource ?? channels;
  const channelSourceMap = options?.channelSourceMap;
  ensureNoDuplicateChannels(declaredChannels);
  const perMethod: Record<string, ChannelCollisionMeta> = {};

  for (const channel of channels) {
    const filePath = resolveChannelSourcePath(channel, channelSourceMap);
    const name = validateStrictChannelName({ channel, filePath });
    const methodName = toPreloadMethodName(name.resource, name.action);
    const collisionKey = `${name.domain}.${methodName}`;

    if (!perMethod[collisionKey]) {
      perMethod[collisionKey] = {
        channels: [],
        filePaths: [],
      };
    }
    perMethod[collisionKey]?.channels.push(channel);
    perMethod[collisionKey]?.filePaths.push(filePath);

    const spec = contract.channels[channel];
    if (!spec || !spec.request || !spec.response) {
      throw new ContractGenerateError(
        "IPC_CONTRACT_MISSING_SCHEMA",
        `Channel ${channel} is request-response but missing request/response schema`,
        {
          channel,
          hasRequest: Boolean(spec?.request),
          hasResponse: Boolean(spec?.response),
        },
      );
    }

    validateSchemaReference(spec.request, `${channel}.request`);
    validateSchemaReference(spec.response, `${channel}.response`);
  }

  validatePreloadMethodCollisions(perMethod);

  return channels.sort();
}

export function extractIpcBindingsFromSource(source: string): string[] {
  const channels: string[] = [];
  const bindingRegex =
    /(?:\bipcMain|\bdeps\.ipcMain)\.(?:handle|on)\(\s*(["'])([^"']+)\1/gm;

  for (const match of source.matchAll(bindingRegex)) {
    channels.push(match[2]);
  }

  return channels;
}

export function validateIpcBindingsFromSource(
  registeredChannels: Set<string>,
  source: string,
  filePath: string,
): void {
  const bindings = extractIpcBindingsFromSource(source);
  for (const channel of bindings) {
    if (!registeredChannels.has(channel)) {
      throw new ContractGenerateError(
        "IPC_CONTRACT_UNREGISTERED_BINDING",
        `Unregistered IPC binding in ${filePath}: ${channel}`,
        {
          channel,
          filePath,
        },
      );
    }
  }
}

async function listTsFiles(rootDir: string): Promise<string[]> {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listTsFiles(absPath)));
      continue;
    }
    if (entry.isFile() && absPath.endsWith(".ts")) {
      files.push(absPath);
    }
  }

  return files;
}

export async function buildGeneratedTypes(
  contract: ContractLike,
): Promise<string> {
  const channels = validateContractDefinition(contract).sort();
  const channelSpecLines = channels.map((channel) => {
    const spec = contract.channels[channel];
    if (!spec?.request || !spec.response) {
      throw new ContractGenerateError(
        "IPC_CONTRACT_MISSING_SCHEMA",
        `Channel ${channel} is request-response but missing request/response schema`,
        {
          channel,
          hasRequest: Boolean(spec?.request),
          hasResponse: Boolean(spec?.response),
        },
      );
    }

    const req = renderSchema(spec.request);
    const res = renderSchema(spec.response);
    return `  ${JSON.stringify(channel)}: {\n    request: ${req};\n    response: ${res};\n  };`;
  });

  const errorCodeLines = [...contract.errorCodes]
    .slice()
    .sort()
    .map((c) => `  | ${JSON.stringify(c)}`);

  const content = normalizeNewlines(
    `/* eslint-disable */
/**
 * GENERATED FILE - DO NOT EDIT.
 * Source: apps/desktop/main/src/ipc/contract/ipc-contract.ts
 * Run: pnpm contract:generate
 */

export type IpcErrorCode =
${errorCodeLines.join("\n")};

export type IpcMeta = {
  requestId: string;
  ts: number;
};

export type IpcError = {
  code: IpcErrorCode;
  message: string;
  traceId?: string;
  details?: unknown;
  retryable?: boolean;
};

export type IpcOk<TData> = {
  ok: true;
  data: TData;
  meta?: IpcMeta;
};

export type IpcErr = {
  ok: false;
  error: IpcError;
  meta?: IpcMeta;
};

export type IpcResponse<TData> = IpcOk<TData> | IpcErr;

export const IPC_CHANNELS = ${JSON.stringify(channels, null, 2)} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[number];

export type IpcChannelSpec = {
${channelSpecLines.join("\n")}
};

export type IpcRequest<C extends IpcChannel> = IpcChannelSpec[C]["request"];

export type IpcResponseData<C extends IpcChannel> = IpcChannelSpec[C]["response"];

export type IpcInvokeResult<C extends IpcChannel> = IpcResponse<IpcResponseData<C>>;
`,
  );

  return normalizeNewlines(
    await prettier.format(content, { parser: "typescript" }),
  );
}

/**
 * Generate `packages/shared/types/ipc-generated.ts` from the IPC SSOT.
 *
 * Why: CI must block contract drift and reject channels that bypass the SSOT.
 */
export async function main(): Promise<void> {
  const repoRoot = process.cwd();
  const outPath = path.join(repoRoot, "packages/shared/types/ipc-generated.ts");
  const contractPath = path.join(
    repoRoot,
    "apps/desktop/main/src/ipc/contract/ipc-contract.ts",
  );

  const contractSource = await fs.readFile(contractPath, "utf8");
  const declaredChannelsInSource =
    extractDeclaredChannelsFromContractSource(contractSource);
  const channelSourceMap = Object.fromEntries(
    declaredChannelsInSource.map((channel) => [
      channel,
      normalizePath(contractPath),
    ]),
  );

  const channels = validateContractDefinition(ipcContract, {
    declaredChannelsInSource,
    channelSourceMap,
  });

  const channelSet = new Set(channels);
  const mainSrcDir = path.join(repoRoot, "apps/desktop/main/src");
  const tsFiles = await listTsFiles(mainSrcDir);

  for (const absFile of tsFiles) {
    const source = await fs.readFile(absFile, "utf8");
    validateIpcBindingsFromSource(channelSet, source, normalizePath(absFile));
  }

  const formatted = await buildGeneratedTypes(ipcContract);

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, formatted, "utf8");
}

async function runCli(): Promise<void> {
  try {
    await main();
  } catch (error) {
    if (error instanceof ContractGenerateError) {
      const details = error.details ? ` ${JSON.stringify(error.details)}` : "";
      console.error(`[${error.code}] ${error.message}${details}`);
      process.exitCode = 1;
      return;
    }
    throw error;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await runCli();
}
