import { create } from "zustand";

// =============================================================================
// Types
// =============================================================================

/**
 * Template structure defines initial folders and files
 */
export interface TemplateStructure {
  /** Initial folders to create */
  folders: string[];
  /** Initial files to create */
  files: { path: string; content?: string }[];
}

/**
 * Project template definition
 */
export interface ProjectTemplate {
  /** Unique identifier */
  id: string;
  /** Template name */
  name: string;
  /** Template type: preset (built-in) or custom (user-created) */
  type: "preset" | "custom";
  /** Optional icon identifier */
  icon?: string;
  /** Template description */
  description?: string;
  /** Initial folder/file structure */
  structure: TemplateStructure;
  /** Creation timestamp (for custom templates) */
  createdAt?: number;
}

// =============================================================================
// Preset Templates
// =============================================================================

const PRESET_TEMPLATES: ProjectTemplate[] = [
  {
    id: "preset-novel",
    name: "Novel",
    type: "preset",
    description: "Long-form fiction with chapter structure",
    structure: {
      folders: ["chapters", "characters", "worldbuilding"],
      files: [
        { path: "chapters/chapter-01.md", content: "# Chapter 1\n\n" },
        { path: "outline.md", content: "# Story Outline\n\n## Act 1\n\n## Act 2\n\n## Act 3\n" },
      ],
    },
  },
  {
    id: "preset-short",
    name: "Short Story",
    type: "preset",
    description: "Single document for short fiction",
    structure: {
      folders: [],
      files: [{ path: "story.md", content: "# Untitled Story\n\n" }],
    },
  },
  {
    id: "preset-script",
    name: "Screenplay",
    type: "preset",
    description: "Script format with scenes and dialogue",
    structure: {
      folders: ["scenes"],
      files: [
        { path: "scenes/scene-01.md", content: "# Scene 1\n\nINT. LOCATION - DAY\n\n" },
        { path: "characters.md", content: "# Characters\n\n" },
      ],
    },
  },
  {
    id: "preset-other",
    name: "Other",
    type: "preset",
    description: "Blank project with no predefined structure",
    structure: {
      folders: [],
      files: [],
    },
  },
];

// =============================================================================
// Store Interface
// =============================================================================

interface TemplateState {
  /** System preset templates (read-only) */
  presets: ProjectTemplate[];
  /** User custom templates */
  customs: ProjectTemplate[];
  /** Loading state */
  loading: boolean;
  /** Last error */
  error: string | null;
}

interface TemplateActions {
  /** Load all templates */
  loadTemplates: () => Promise<void>;
  /** Create a new custom template */
  createTemplate: (
    template: Omit<ProjectTemplate, "id" | "type" | "createdAt">,
  ) => Promise<ProjectTemplate>;
  /** Update an existing custom template */
  updateTemplate: (
    id: string,
    updates: Partial<Omit<ProjectTemplate, "id" | "type">>,
  ) => Promise<void>;
  /** Delete a custom template */
  deleteTemplate: (id: string) => Promise<void>;
  /** Get all templates (presets + customs) */
  getAllTemplates: () => ProjectTemplate[];
  /** Get a template by ID */
  getTemplateById: (id: string) => ProjectTemplate | undefined;
  /** Clear error */
  clearError: () => void;
}

type TemplateStore = TemplateState & TemplateActions;

// =============================================================================
// Store Implementation
// =============================================================================

/**
 * Generate a unique ID for custom templates
 */
function generateTemplateId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Storage key for persisting custom templates
 */
export const STORAGE_KEY = "creonow.templates.customs";

function isTemplateStructure(value: unknown): value is TemplateStructure {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<TemplateStructure>;
  const { folders, files } = candidate;

  if (!Array.isArray(folders) || !folders.every((folder) => typeof folder === "string")) {
    return false;
  }

  if (!Array.isArray(files)) {
    return false;
  }

  return files.every((file) => {
    if (typeof file !== "object" || file === null) {
      return false;
    }
    const candidateFile = file as { path?: unknown; content?: unknown };
    return (
      typeof candidateFile.path === "string" &&
      (candidateFile.content === undefined || typeof candidateFile.content === "string")
    );
  });
}

function isCustomTemplate(value: unknown): value is ProjectTemplate {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<ProjectTemplate>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    candidate.type === "custom" &&
    isTemplateStructure(candidate.structure) &&
    (candidate.icon === undefined || typeof candidate.icon === "string") &&
    (candidate.description === undefined || typeof candidate.description === "string") &&
    (candidate.createdAt === undefined || typeof candidate.createdAt === "number")
  );
}

/**
 * Load custom templates from localStorage
 */
function loadCustomTemplatesFromStorage(): ProjectTemplate[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }

    const customs = parsed.filter(isCustomTemplate);
    if (customs.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customs));
    }

    return customs;
  } catch (error) {
    console.error("Failed to load custom templates from storage", {
      storageKey: STORAGE_KEY,
      error,
    });
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

/**
 * Save custom templates to localStorage
 */
function saveCustomTemplatesToStorage(templates: ProjectTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (error) {
    console.error("Failed to save custom templates to storage", {
      storageKey: STORAGE_KEY,
      error,
    });
  }
}

/**
 * Template store for managing project templates
 */
export const useTemplateStore = create<TemplateStore>((set, get) => ({
  // State
  presets: PRESET_TEMPLATES,
  customs: [],
  loading: false,
  error: null,

  // Actions
  loadTemplates: async () => {
    set({ loading: true, error: null });
    try {
      const customs = loadCustomTemplatesFromStorage();
      set({ customs, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load templates",
        loading: false,
      });
    }
  },

  createTemplate: async (template) => {
    const { customs } = get();
    const newTemplate: ProjectTemplate = {
      ...template,
      id: generateTemplateId(),
      type: "custom",
      createdAt: Date.now(),
    };

    const updated = [...customs, newTemplate];
    saveCustomTemplatesToStorage(updated);
    set({ customs: updated });

    return newTemplate;
  },

  updateTemplate: async (id, updates) => {
    const { customs } = get();
    const index = customs.findIndex((t) => t.id === id);

    if (index === -1) {
      throw new Error(`Template not found: ${id}`);
    }

    const updated = [...customs];
    updated[index] = { ...updated[index], ...updates };

    saveCustomTemplatesToStorage(updated);
    set({ customs: updated });
  },

  deleteTemplate: async (id) => {
    const { customs } = get();
    const updated = customs.filter((t) => t.id !== id);

    saveCustomTemplatesToStorage(updated);
    set({ customs: updated });
  },

  getAllTemplates: () => {
    const { presets, customs } = get();
    return [...presets, ...customs];
  },

  getTemplateById: (id) => {
    const { presets, customs } = get();
    return presets.find((t) => t.id === id) || customs.find((t) => t.id === id);
  },

  clearError: () => {
    set({ error: null });
  },
}));
