#!/usr/bin/env node
// Node 22 needs the flag to strip types; 23+ does it by default. Re-exec
// rather than requiring a build step, so the source you read is the source
// that runs.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const cli = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "cli.ts");
const { status } = spawnSync(
  process.execPath,
  ["--experimental-strip-types", "--no-warnings", cli, ...process.argv.slice(2)],
  { stdio: "inherit" },
);
process.exit(status ?? 2);
