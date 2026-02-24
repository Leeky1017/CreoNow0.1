type ValidationError = {
  code: string;
  message: string;
};

type ValidationResult = {
  ok: boolean;
  errors: ValidationError[];
};

export const PHASE4_REQUIRED_CHECKS = [
  "ci",
  "openspec-log-guard",
  "merge-serial",
] as const;

export const PHASE4_REQUIRED_CI_STAGE_CHECKS = [
  "lint",
  "typecheck",
  "unit-test",
  "build",
  "e2e-smoke",
] as const;

type DeliverableStatus = "draft" | "reviewing" | "accepted";
type AdrStatus = "Proposed" | "Accepted" | "Deprecated" | "Superseded";

const PHASE4_REQUIRED_DELIVERABLES = [
  "visual-audit-report",
  "screenshot-baseline-library",
  "benchmark-report",
  "adr-catalog",
  "ci-gate-config",
  "i18n-strategy-record",
] as const;

const DELIVERABLES_REQUIRING_ADR = new Set<string>([
  "visual-audit-report",
  "screenshot-baseline-library",
  "benchmark-report",
  "ci-gate-config",
  "i18n-strategy-record",
]);

const DELIVERABLE_STATUSES = new Set<DeliverableStatus>([
  "draft",
  "reviewing",
  "accepted",
]);

const ADR_STATUSES = new Set<AdrStatus>([
  "Proposed",
  "Accepted",
  "Deprecated",
  "Superseded",
]);

export type Phase4DeliverableId = (typeof PHASE4_REQUIRED_DELIVERABLES)[number];

export type Phase4Deliverable = {
  id: Phase4DeliverableId;
  status: DeliverableStatus;
  updatedAt: string;
  owner: string;
  adrId?: string;
};

export type Phase4AdrRecord = {
  id: string;
  status: AdrStatus;
  background: string;
  decision: string;
  alternatives: string[];
  consequences: string;
};

export type Phase4DeliverablesLedgerInput = {
  deliverables: Phase4Deliverable[];
  adrs: Phase4AdrRecord[];
};

function buildResult(errors: ValidationError[]): ValidationResult {
  return {
    ok: errors.length === 0,
    errors,
  };
}

function addError(
  errors: ValidationError[],
  code: string,
  message: string,
): void {
  errors.push({ code, message });
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseTimestamp(value: string): number | null {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return parsed;
}

function isIsoTimestamp(value: string): boolean {
  return parseTimestamp(value) !== null;
}

function isAcceptedAdrStatus(status: AdrStatus): boolean {
  return status === "Accepted";
}

export function validateDeliverablesAndAdr(
  input: Phase4DeliverablesLedgerInput,
): ValidationResult {
  const errors: ValidationError[] = [];

  const deliverablesById = new Map<string, Phase4Deliverable>();
  for (const deliverable of input.deliverables) {
    if (deliverablesById.has(deliverable.id)) {
      addError(
        errors,
        "DELIVERABLE_DUPLICATED",
        `duplicated deliverable id: ${deliverable.id}`,
      );
      continue;
    }

    deliverablesById.set(deliverable.id, deliverable);

    if (!DELIVERABLE_STATUSES.has(deliverable.status)) {
      addError(
        errors,
        "DELIVERABLE_STATUS_INVALID",
        `deliverable ${deliverable.id} has invalid status`,
      );
    }

    if (!isIsoTimestamp(deliverable.updatedAt)) {
      addError(
        errors,
        "DELIVERABLE_UPDATED_AT_INVALID",
        `deliverable ${deliverable.id} must carry ISO timestamp`,
      );
    }

    if (!hasText(deliverable.owner)) {
      addError(
        errors,
        "DELIVERABLE_OWNER_MISSING",
        `deliverable ${deliverable.id} must define owner`,
      );
    }
  }

  const adrById = new Map<string, Phase4AdrRecord>();
  for (const adr of input.adrs) {
    if (adrById.has(adr.id)) {
      addError(errors, "ADR_DUPLICATED", `duplicated ADR id: ${adr.id}`);
      continue;
    }

    adrById.set(adr.id, adr);

    if (!ADR_STATUSES.has(adr.status)) {
      addError(
        errors,
        "ADR_STATUS_INVALID",
        `ADR ${adr.id} has invalid status`,
      );
    }

    if (!hasText(adr.background)) {
      addError(
        errors,
        "ADR_BACKGROUND_MISSING",
        `ADR ${adr.id} background is required`,
      );
    }

    if (!hasText(adr.decision)) {
      addError(
        errors,
        "ADR_DECISION_MISSING",
        `ADR ${adr.id} decision is required`,
      );
    }

    if (adr.alternatives.length === 0) {
      addError(
        errors,
        "ADR_ALTERNATIVES_MISSING",
        `ADR ${adr.id} alternatives are required`,
      );
    }

    if (!hasText(adr.consequences)) {
      addError(
        errors,
        "ADR_CONSEQUENCES_MISSING",
        `ADR ${adr.id} consequences are required`,
      );
    }
  }

  for (const requiredId of PHASE4_REQUIRED_DELIVERABLES) {
    const deliverable = deliverablesById.get(requiredId);
    if (!deliverable) {
      addError(
        errors,
        "DELIVERABLE_MISSING",
        `required deliverable missing: ${requiredId}`,
      );
      continue;
    }

    if (!DELIVERABLES_REQUIRING_ADR.has(requiredId)) {
      continue;
    }

    if (!hasText(deliverable.adrId)) {
      addError(
        errors,
        "ADR_LINK_MISSING",
        `deliverable ${requiredId} must link to ADR`,
      );
      continue;
    }

    const linkedAdr = adrById.get(deliverable.adrId);
    if (!linkedAdr) {
      addError(
        errors,
        "ADR_LINK_NOT_FOUND",
        `deliverable ${requiredId} points to missing ADR ${deliverable.adrId}`,
      );
      continue;
    }

    if (!isAcceptedAdrStatus(linkedAdr.status)) {
      addError(
        errors,
        "ADR_NOT_ACCEPTED",
        `deliverable ${requiredId} must link to Accepted ADR before review`,
      );
    }
  }

  return buildResult(errors);
}

type BranchKind =
  | "feat"
  | "refactor"
  | "fix"
  | "style"
  | "cleanup"
  | "experiment";

const ALLOWED_BRANCH_KINDS = new Set<BranchKind>([
  "feat",
  "refactor",
  "fix",
  "style",
  "cleanup",
  "experiment",
]);

const SHORT_LIVED_BRANCH_LIMIT_DAYS = 5;

export type Phase4ExecutionBranch = {
  name: string;
  createdAt: string;
  mergedAt?: string;
  targetBranch: string;
  promoted?: boolean;
  riskReviewId?: string;
};

export type Phase4BranchStrategyInput = {
  governanceBranch: string;
  now: string;
  executionBranches: Phase4ExecutionBranch[];
};

function extractBranchKind(branchName: string): BranchKind | null {
  const [rawKind] = branchName.split("/");
  if (!rawKind) {
    return null;
  }

  if (!ALLOWED_BRANCH_KINDS.has(rawKind as BranchKind)) {
    return null;
  }

  return rawKind as BranchKind;
}

function computeAgeDays(startAt: string, endAt: string): number | null {
  const start = parseTimestamp(startAt);
  const end = parseTimestamp(endAt);
  if (start === null || end === null) {
    return null;
  }

  return (end - start) / (1000 * 60 * 60 * 24);
}

export function validateBranchLifecyclePolicy(
  input: Phase4BranchStrategyInput,
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!/^task\/[0-9]+-[a-z0-9-]+$/u.test(input.governanceBranch)) {
    addError(
      errors,
      "BRANCH_GOVERNANCE_PATTERN_INVALID",
      "governance branch must follow task/<N>-<slug>",
    );
  }

  if (!isIsoTimestamp(input.now)) {
    addError(
      errors,
      "BRANCH_NOW_INVALID",
      "strategy input now must be an ISO timestamp",
    );
  }

  for (const branch of input.executionBranches) {
    const kind = extractBranchKind(branch.name);
    if (!kind) {
      addError(
        errors,
        "BRANCH_PREFIX_INVALID",
        `execution branch ${branch.name} must use an allowed prefix`,
      );
      continue;
    }

    if (!isIsoTimestamp(branch.createdAt)) {
      addError(
        errors,
        "BRANCH_CREATED_AT_INVALID",
        `execution branch ${branch.name} has invalid createdAt`,
      );
      continue;
    }

    const lifecycleEnd = branch.mergedAt ?? input.now;
    if (!isIsoTimestamp(lifecycleEnd)) {
      addError(
        errors,
        "BRANCH_MERGED_AT_INVALID",
        `execution branch ${branch.name} has invalid mergedAt`,
      );
      continue;
    }

    const ageDays = computeAgeDays(branch.createdAt, lifecycleEnd);
    if (ageDays === null) {
      addError(
        errors,
        "BRANCH_LIFECYCLE_WINDOW_INVALID",
        `execution branch ${branch.name} lifecycle window is invalid`,
      );
      continue;
    }

    if (ageDays < 0) {
      addError(
        errors,
        "BRANCH_CHRONOLOGY_INVALID",
        `execution branch ${branch.name} has createdAt after mergedAt/now`,
      );
      continue;
    }

    if (kind === "experiment") {
      if (
        branch.targetBranch !== input.governanceBranch &&
        branch.targetBranch !== "main"
      ) {
        addError(
          errors,
          "BRANCH_TARGET_INVALID",
          `experiment branch ${branch.name} must target governance branch or main`,
        );
      }

      if (branch.targetBranch === "main") {
        if (branch.promoted !== true || !hasText(branch.riskReviewId)) {
          addError(
            errors,
            "BRANCH_EXPERIMENT_PROMOTION_REQUIRED",
            `experiment branch ${branch.name} cannot target main before promotion review`,
          );
        }
      }

      continue;
    }

    if (!hasText(branch.mergedAt)) {
      addError(
        errors,
        "BRANCH_NOT_MERGED_BACK",
        `execution branch ${branch.name} must merge back before delivery closeout`,
      );
      continue;
    }

    if (ageDays > SHORT_LIVED_BRANCH_LIMIT_DAYS) {
      addError(
        errors,
        "BRANCH_LIFECYCLE_EXCEEDED",
        `execution branch ${branch.name} exceeds ${SHORT_LIVED_BRANCH_LIMIT_DAYS.toString()} day policy`,
      );
    }

    if (branch.targetBranch !== input.governanceBranch) {
      addError(
        errors,
        "BRANCH_TARGET_INVALID",
        `execution branch ${branch.name} must merge back to governance branch`,
      );
    }
  }

  return buildResult(errors);
}

type RequiredCheckState = "success" | "failure" | "pending";
type QualityGateState = "pass" | "fail";

const PHASE4_QUALITY_GATE_NAMES = [
  "hardcodedColor",
  "hardcodedZIndex",
  "transitionAll",
  "viewportOwnership",
  "ipcBypass",
  "i18nLiteral",
] as const;

type Phase4QualityGateName = (typeof PHASE4_QUALITY_GATE_NAMES)[number];

export type Phase4CiStageCheckName =
  (typeof PHASE4_REQUIRED_CI_STAGE_CHECKS)[number];

export type Phase4CiGateInput = {
  autoMergeEnabled: boolean;
  requiredChecks: Array<{
    name: string;
    state: RequiredCheckState;
  }>;
  qualityGates: Record<Phase4QualityGateName, QualityGateState>;
  stageChecks: Array<{
    name: Phase4CiStageCheckName;
    state: RequiredCheckState;
  }>;
};

function sameStringSet(
  left: readonly string[],
  right: readonly string[],
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const leftSet = new Set(left);
  const rightSet = new Set(right);
  if (leftSet.size !== rightSet.size) {
    return false;
  }

  for (const value of leftSet) {
    if (!rightSet.has(value)) {
      return false;
    }
  }

  return true;
}

export function validateCiDeliveryGate(
  input: Phase4CiGateInput,
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!input.autoMergeEnabled) {
    addError(
      errors,
      "CI_AUTO_MERGE_DISABLED",
      "delivery is blocked when auto-merge is disabled",
    );
  }

  const checkNames = input.requiredChecks.map((check) => check.name);
  if (!sameStringSet(checkNames, PHASE4_REQUIRED_CHECKS)) {
    addError(
      errors,
      "CI_REQUIRED_CHECK_CONTRACT_DRIFT",
      "required checks contract must remain ci + openspec-log-guard + merge-serial",
    );
  }

  for (const requiredCheck of PHASE4_REQUIRED_CHECKS) {
    const check = input.requiredChecks.find(
      (item) => item.name === requiredCheck,
    );
    if (!check || check.state !== "success") {
      addError(
        errors,
        "CI_REQUIRED_CHECK_NOT_GREEN",
        `${requiredCheck} must be success`,
      );
    }
  }

  for (const gateName of PHASE4_QUALITY_GATE_NAMES) {
    if (input.qualityGates[gateName] !== "pass") {
      addError(
        errors,
        "CI_QUALITY_GATE_FAILED",
        `quality gate ${gateName} failed`,
      );
    }
  }

  const stageCheckNames = input.stageChecks.map((check) => check.name);
  if (!sameStringSet(stageCheckNames, PHASE4_REQUIRED_CI_STAGE_CHECKS)) {
    addError(
      errors,
      "CI_STAGE_CHECK_CONTRACT_DRIFT",
      "stage checks contract must include lint/typecheck/unit-test/build/e2e-smoke",
    );
  }

  for (const stageName of PHASE4_REQUIRED_CI_STAGE_CHECKS) {
    const stageCheck = input.stageChecks.find(
      (check) => check.name === stageName,
    );
    if (!stageCheck || stageCheck.state !== "success") {
      addError(
        errors,
        "CI_STAGE_CHECK_NOT_GREEN",
        `${stageName} stage check must be success`,
      );
    }
  }

  return buildResult(errors);
}

type LocaleTree = {
  [key: string]: string | LocaleTree;
};

function flattenLocaleTree(
  node: string | LocaleTree,
  prefix: string,
  out: Set<string>,
): void {
  if (typeof node === "string") {
    if (prefix.length > 0) {
      out.add(prefix);
    }
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    const nextPrefix = prefix.length === 0 ? key : `${prefix}.${key}`;
    flattenLocaleTree(value, nextPrefix, out);
  }
}

export function buildLocaleKeyIndex(
  localeTrees: Record<string, string | LocaleTree>,
): Record<string, string[]> {
  const index: Record<string, string[]> = {};

  for (const [locale, tree] of Object.entries(localeTrees)) {
    const keys = new Set<string>();
    flattenLocaleTree(tree, "", keys);
    index[locale] = [...keys].sort((left, right) => left.localeCompare(right));
  }

  return index;
}

export function flattenLocaleKeys(
  localeTrees: Record<string, string | LocaleTree>,
): string[] {
  const keyUnion = new Set<string>();
  const index = buildLocaleKeyIndex(localeTrees);
  for (const keys of Object.values(index)) {
    for (const key of keys) {
      keyUnion.add(key);
    }
  }
  return [...keyUnion].sort((left, right) => left.localeCompare(right));
}

export type Phase4I18nSubmission = {
  uiChanges: Array<{
    componentPath: string;
    i18nKey?: string;
    rawLiteral?: string;
  }>;
  localeKeyIndex: Record<string, string[]>;
  requiredLocales: string[];
  formattingRequirements: Array<"date" | "number" | "relativeTime">;
  intlCalls: string[];
  hardcodedFormattingPatterns: string[];
};

const REQUIRED_INTL_CALLS: Record<"date" | "number" | "relativeTime", string> =
  {
    date: "Intl.DateTimeFormat",
    number: "Intl.NumberFormat",
    relativeTime: "Intl.RelativeTimeFormat",
  };

export function validateI18nSubmissionGate(
  input: Phase4I18nSubmission,
): ValidationResult {
  const errors: ValidationError[] = [];
  const localeLookup = new Map<string, Set<string>>();

  for (const locale of input.requiredLocales) {
    const keys = input.localeKeyIndex[locale];
    if (!keys) {
      addError(
        errors,
        "I18N_REQUIRED_LOCALE_MISSING",
        `required locale ${locale} is missing from locale index`,
      );
      continue;
    }

    localeLookup.set(locale, new Set(keys));
  }

  for (const change of input.uiChanges) {
    if (hasText(change.rawLiteral)) {
      addError(
        errors,
        "I18N_LITERAL_NOT_EXTRACTED",
        `component ${change.componentPath} introduces non-extracted literal`,
      );
    }

    if (!hasText(change.i18nKey)) {
      addError(
        errors,
        "I18N_KEY_MISSING",
        `component ${change.componentPath} must provide i18n key`,
      );
      continue;
    }

    for (const [locale, keySet] of localeLookup) {
      if (!keySet.has(change.i18nKey)) {
        addError(
          errors,
          "I18N_KEY_LOCALE_GAP",
          `component ${change.componentPath} key ${change.i18nKey} missing in locale ${locale}`,
        );
      }
    }
  }

  const intlCallSet = new Set(input.intlCalls);
  for (const requirement of input.formattingRequirements) {
    const expectedCall = REQUIRED_INTL_CALLS[requirement];
    if (!intlCallSet.has(expectedCall)) {
      addError(
        errors,
        "I18N_INTL_MISSING",
        `missing ${expectedCall} for ${requirement} formatting`,
      );
    }
  }

  if (input.hardcodedFormattingPatterns.length > 0) {
    addError(
      errors,
      "I18N_HARDCODED_FORMAT",
      `hardcoded format patterns found: ${input.hardcodedFormattingPatterns.join(", ")}`,
    );
  }

  return buildResult(errors);
}
