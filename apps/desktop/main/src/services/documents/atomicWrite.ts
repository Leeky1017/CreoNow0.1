import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const DIR_FSYNC_IGNORE_CODES = new Set(["EINVAL", "ENOTSUP", "EPERM"]);

type AtomicWriteArgs = {
  targetPath: string;
  writeTemp: (tempPath: string) => Promise<void>;
};

function getErrorCode(error: unknown): string | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }
  return undefined;
}

async function syncDirectory(directoryPath: string): Promise<void> {
  let handle: fs.FileHandle | null = null;

  try {
    handle = await fs.open(directoryPath, "r");
  } catch (error) {
    const code = getErrorCode(error);
    if (typeof code === "string" && DIR_FSYNC_IGNORE_CODES.has(code)) {
      return;
    }
    throw error;
  }

  try {
    await handle.sync();
  } catch (error) {
    const code = getErrorCode(error);
    if (typeof code === "string" && DIR_FSYNC_IGNORE_CODES.has(code)) {
      return;
    }
    throw error;
  } finally {
    await handle.close();
  }
}

/**
 * Persist file content with atomic rename semantics.
 *
 * Why: interrupted writes must not expose partial bytes at the target path.
 */
export async function atomicWrite(args: AtomicWriteArgs): Promise<void> {
  const directoryPath = path.dirname(args.targetPath);
  const tempPath = path.join(
    directoryPath,
    `.${path.basename(args.targetPath)}.${randomUUID()}.tmp`,
  );

  await fs.mkdir(directoryPath, { recursive: true });

  try {
    await args.writeTemp(tempPath);

    const tempFileHandle = await fs.open(tempPath, "r");
    try {
      await tempFileHandle.sync();
    } finally {
      await tempFileHandle.close();
    }

    await fs.rename(tempPath, args.targetPath);
    await syncDirectory(directoryPath);
  } catch (error) {
    await fs.rm(tempPath, { force: true });
    throw error;
  }
}
