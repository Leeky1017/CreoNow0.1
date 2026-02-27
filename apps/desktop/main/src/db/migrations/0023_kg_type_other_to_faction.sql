-- AUD-C11-S4: migrate legacy kg_entities.type='other' to supported type='faction'.
-- Why: renderer/runtime no longer performs legacy 'other' compatibility mapping.

UPDATE kg_entities
SET type = 'faction'
WHERE lower(trim(type)) = 'other';
