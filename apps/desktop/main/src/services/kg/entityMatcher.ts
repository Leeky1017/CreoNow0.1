import type { AiContextLevel } from "./kgService";

export type MatchableEntity = {
  id: string;
  name: string;
  aliases: string[];
  aiContextLevel: AiContextLevel;
};

export type MatchResult = {
  entityId: string;
  matchedTerm: string;
  position: number;
};

type PatternOutput = {
  entityId: string;
  matchedTerm: string;
  length: number;
};

type AutomatonNode = {
  transitions: Map<string, number>;
  fail: number;
  outputs: PatternOutput[];
};

/**
 * Match detected entity references from raw text for Retrieved-layer injection.
 *
 * Why: Context fetchers need deterministic, synchronous reference detection
 * without relying on async LLM recognition.
 */
export function matchEntities(
  text: string,
  entities: MatchableEntity[],
): MatchResult[] {
  if (text.length === 0 || entities.length === 0) {
    return [];
  }

  const { nodes, entityOrderById } = buildAutomaton(entities);
  if (nodes.length === 1) {
    return [];
  }

  const bestMatchesByEntityId = new Map<string, MatchResult>();
  let state = 0;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]!;

    while (state !== 0 && !nodes[state].transitions.has(character)) {
      state = nodes[state].fail;
    }

    const transitionedState = nodes[state].transitions.get(character);
    state = transitionedState === undefined ? 0 : transitionedState;

    if (nodes[state].outputs.length === 0) {
      continue;
    }

    for (const output of nodes[state].outputs) {
      const position = index - output.length + 1;
      const existing = bestMatchesByEntityId.get(output.entityId);

      if (
        existing &&
        (position > existing.position ||
          (position === existing.position &&
            output.matchedTerm.length <= existing.matchedTerm.length))
      ) {
        continue;
      }

      bestMatchesByEntityId.set(output.entityId, {
        entityId: output.entityId,
        matchedTerm: output.matchedTerm,
        position,
      });
    }
  }

  return [...bestMatchesByEntityId.values()].sort((left, right) => {
    if (left.position !== right.position) {
      return left.position - right.position;
    }
    if (left.matchedTerm.length !== right.matchedTerm.length) {
      return right.matchedTerm.length - left.matchedTerm.length;
    }
    return (
      (entityOrderById.get(left.entityId) ?? Number.MAX_SAFE_INTEGER) -
      (entityOrderById.get(right.entityId) ?? Number.MAX_SAFE_INTEGER)
    );
  });
}

function buildAutomaton(entities: MatchableEntity[]): {
  nodes: AutomatonNode[];
  entityOrderById: Map<string, number>;
} {
  const nodes: AutomatonNode[] = [
    {
      transitions: new Map<string, number>(),
      fail: 0,
      outputs: [],
    },
  ];

  const entityOrderById = new Map<string, number>();
  const seenTermsByEntityId = new Map<string, Set<string>>();
  for (const entity of entities) {
    if (entity.aiContextLevel !== "when_detected") {
      continue;
    }
    if (!entityOrderById.has(entity.id)) {
      entityOrderById.set(entity.id, entityOrderById.size);
    }

    let seenTerms = seenTermsByEntityId.get(entity.id);
    if (!seenTerms) {
      seenTerms = new Set<string>();
      seenTermsByEntityId.set(entity.id, seenTerms);
    }

    const candidates = [entity.name, ...entity.aliases];
    for (const candidate of candidates) {
      if (candidate.trim().length === 0 || seenTerms.has(candidate)) {
        continue;
      }
      seenTerms.add(candidate);
      addPattern(nodes, {
        entityId: entity.id,
        matchedTerm: candidate,
        length: candidate.length,
      });
    }
  }

  buildFailureLinks(nodes);
  return { nodes, entityOrderById };
}

function addPattern(nodes: AutomatonNode[], output: PatternOutput): void {
  let state = 0;
  for (let index = 0; index < output.matchedTerm.length; index += 1) {
    const character = output.matchedTerm[index]!;
    const next = nodes[state].transitions.get(character);
    if (next !== undefined) {
      state = next;
      continue;
    }

    const created = nodes.length;
    nodes[state].transitions.set(character, created);
    nodes.push({
      transitions: new Map<string, number>(),
      fail: 0,
      outputs: [],
    });
    state = created;
  }
  nodes[state].outputs.push(output);
}

function buildFailureLinks(nodes: AutomatonNode[]): void {
  const queue: number[] = [];
  for (const nextState of nodes[0].transitions.values()) {
    nodes[nextState].fail = 0;
    queue.push(nextState);
  }

  for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
    const state = queue[queueIndex]!;

    for (const [character, nextState] of nodes[state].transitions.entries()) {
      queue.push(nextState);

      let failureState = nodes[state].fail;
      while (
        failureState !== 0 &&
        !nodes[failureState].transitions.has(character)
      ) {
        failureState = nodes[failureState].fail;
      }

      const fallback = nodes[failureState].transitions.get(character);
      nodes[nextState].fail = fallback === undefined ? 0 : fallback;

      if (nodes[nodes[nextState].fail].outputs.length > 0) {
        nodes[nextState].outputs = nodes[nextState].outputs.concat(
          nodes[nodes[nextState].fail].outputs,
        );
      }
    }
  }
}
