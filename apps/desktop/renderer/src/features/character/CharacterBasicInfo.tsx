import React from "react";
import { useTranslation } from "react-i18next";
import { Input, Select } from "../../components/primitives";
import { Button } from "../../components/primitives";
import { ChevronDown } from "lucide-react";
import {
  getZodiacFromBirthDate,
  labelStyles,
  sectionHeaderStyles,
  ProfileTableRow,
  ProfileSummaryItem,
  TraitTag,
} from "./character-detail-shared";
import type { Character, ZodiacSign } from "./types";
import { ARCHETYPE_OPTIONS, ZODIAC_OPTIONS } from "./types";

function ChevronDownIcon({ className }: { className?: string }): JSX.Element {
  return (
    <ChevronDown
      className={className}
      size={16}
      strokeWidth={1.5}
      aria-hidden="true"
    />
  );
}

export interface CharacterBasicInfoProps {
  character: Character;
  isExpanded: boolean;
  onToggleExpand: () => void;
  contentId: string;
  zodiacLabel: string | undefined;
  archetypeLabel: string | undefined;
  newTrait: string;
  onNewTraitChange: (v: string) => void;
  onAddTrait: () => void;
  onRemoveTrait: (trait: string) => void;
  onTraitKeyDown: (e: React.KeyboardEvent) => void;
  newFeature: string;
  onNewFeatureChange: (v: string) => void;
  onAddFeature: () => void;
  onRemoveFeature: (feature: string) => void;
  onFeatureKeyDown: (e: React.KeyboardEvent) => void;
  onFieldChange: <K extends keyof Character>(
    field: K,
    value: Character[K],
  ) => void;
}

export function CharacterBasicInfo(
  props: CharacterBasicInfoProps,
): JSX.Element {
  const { t } = useTranslation();
  const c = props.character;

  return (
    <div className="space-y-3">
      <div className={sectionHeaderStyles}>
        {/* eslint-disable-next-line creonow/no-native-html-element -- semantic label, no Label primitive */}
        <label className={labelStyles}>{t("character.detail.profile")}</label>
        <Button
          variant="ghost"
          size="sm"
          onClick={props.onToggleExpand}
          aria-expanded={props.isExpanded}
          aria-controls={props.contentId}
          aria-label={
            props.isExpanded
              ? t("character.detail.collapseProfile")
              : t("character.detail.expandProfile")
          }
          className="!px-1.5 !py-0.5 !h-auto text-[10px] text-[var(--color-fg-placeholder)] hover:text-[var(--color-fg-muted)] inline-flex items-center gap-1 font-medium"
        >
          <span aria-hidden="true">
            {props.isExpanded
              ? t("character.detail.collapse")
              : t("character.detail.expand")}
          </span>
          <ChevronDownIcon
            className={[
              "transition-transform duration-[var(--duration-fast)]",
              props.isExpanded ? "rotate-180" : "",
            ].join(" ")}
          />
        </Button>
      </div>

      <div id={props.contentId}>
        {props.isExpanded ? (
          <ExpandedProfile {...props} />
        ) : (
          <CollapsedProfile
            character={c}
            zodiacLabel={props.zodiacLabel}
            archetypeLabel={props.archetypeLabel}
          />
        )}
      </div>
    </div>
  );
}

function ExpandedProfile(props: CharacterBasicInfoProps): JSX.Element {
  const { t } = useTranslation();
  const c = props.character;
  return (
    <div className="rounded-lg overflow-hidden border border-[var(--color-border-default)] divide-y divide-[var(--color-border-default)] bg-[var(--color-bg-base)]">
      <ProfileTableRow label={t("character.detail.age")}>
        <Input
          type="text"
          value={c.age?.toString() ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            props.onFieldChange("age", val ? parseInt(val, 10) : undefined);
          }}
          fullWidth
        />
      </ProfileTableRow>
      <ProfileTableRow label={t("character.detail.birthDate")}>
        <Input
          type="date"
          value={c.birthDate ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            props.onFieldChange("birthDate", val ? val : undefined);
            const zodiac = val ? getZodiacFromBirthDate(val) : undefined;
            if (zodiac) props.onFieldChange("zodiac", zodiac);
          }}
          fullWidth
        />
      </ProfileTableRow>
      <ProfileTableRow label={t("character.detail.zodiac")}>
        <Select
          value={c.zodiac ?? ""}
          onValueChange={(val) =>
            props.onFieldChange("zodiac", val ? (val as ZodiacSign) : undefined)
          }
          options={ZODIAC_OPTIONS.map((z) => ({
            value: z.value,
            label: z.label,
          }))}
          placeholder={t("character.detail.selectZodiacPlaceholder")}
          fullWidth
          layer="modal"
        />
      </ProfileTableRow>
      <ProfileTableRow label={t("character.detail.archetype")}>
        <Select
          value={c.archetype ?? ""}
          onValueChange={(val) => props.onFieldChange("archetype", val)}
          options={ARCHETYPE_OPTIONS.map((a) => ({
            value: a.value,
            label: a.label,
          }))}
          placeholder={t("character.detail.selectArchetypePlaceholder")}
          fullWidth
          layer="modal"
        />
      </ProfileTableRow>
      <ProfileTableRow label={t("character.detail.features")}>
        <div className="flex flex-wrap gap-2">
          {(c.features ?? []).map((feature) => (
            <TraitTag
              key={feature}
              trait={feature}
              onRemove={() => props.onRemoveFeature(feature)}
            />
          ))}
          <Input
            type="text"
            placeholder={t("character.detail.addFeaturePlaceholder")}
            value={props.newFeature}
            onChange={(e) => props.onNewFeatureChange(e.target.value)}
            onKeyDown={props.onFeatureKeyDown}
            onBlur={props.onAddFeature}
            className="!bg-transparent !border-0 !h-auto !px-1 !py-1 !text-xs !min-w-20 ml-1 hover:!bg-[var(--color-bg-surface)] !rounded focus-visible:!outline-none"
          />
        </div>
      </ProfileTableRow>
      <ProfileTableRow label={t("character.detail.personality")}>
        <div className="flex flex-wrap gap-2">
          {c.traits.map((trait) => (
            <TraitTag
              key={trait}
              trait={trait}
              onRemove={() => props.onRemoveTrait(trait)}
            />
          ))}
          <Input
            type="text"
            placeholder={t("character.detail.addTraitPlaceholder")}
            value={props.newTrait}
            onChange={(e) => props.onNewTraitChange(e.target.value)}
            onKeyDown={props.onTraitKeyDown}
            onBlur={props.onAddTrait}
            className="!bg-transparent !border-0 !h-auto !px-1 !py-1 !text-xs !min-w-15 ml-1 hover:!bg-[var(--color-bg-surface)] !rounded focus-visible:!outline-none"
          />
        </div>
      </ProfileTableRow>
    </div>
  );
}

function CollapsedProfile({
  character: c,
  zodiacLabel,
  archetypeLabel,
}: {
  character: Character;
  zodiacLabel: string | undefined;
  archetypeLabel: string | undefined;
}): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-base)] p-3">
      <div className="flex flex-wrap gap-2">
        <ProfileSummaryItem
          label={t("character.detail.age")}
          value={c.age !== undefined ? String(c.age) : "—"}
        />
        <ProfileSummaryItem
          label={t("character.detail.birth")}
          value={c.birthDate ?? "—"}
        />
        <ProfileSummaryItem
          label={t("character.detail.zodiac")}
          value={zodiacLabel ?? "—"}
        />
        <ProfileSummaryItem
          label={t("character.detail.archetype")}
          value={archetypeLabel ?? "—"}
        />
        <ProfileSummaryItem
          label={t("character.detail.features")}
          value={String((c.features ?? []).length)}
        />
        <ProfileSummaryItem
          label={t("character.detail.traits")}
          value={String(c.traits.length)}
        />
      </div>
    </div>
  );
}
