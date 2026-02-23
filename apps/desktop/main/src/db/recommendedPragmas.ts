export const RECOMMENDED_BUSY_TIMEOUT_MS = 5_000;
export const RECOMMENDED_MMAP_SIZE_BYTES = 256 * 1024 * 1024;
export const RECOMMENDED_CACHE_SIZE_PAGES = -20_000;

type PragmasConnection = {
  pragma: (source: string) => unknown;
};

export function applyRecommendedPragmas(db: PragmasConnection): void {
  db.pragma(`busy_timeout = ${RECOMMENDED_BUSY_TIMEOUT_MS}`);
  db.pragma("synchronous = NORMAL");
  db.pragma(`mmap_size = ${RECOMMENDED_MMAP_SIZE_BYTES}`);
  db.pragma(`cache_size = ${RECOMMENDED_CACHE_SIZE_PAGES}`);
}
