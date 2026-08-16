/**
 * The CLI. Three verbs, one of which is the point.
 *
 *   eval-harness validate --cases <file>
 *   eval-harness score    --cases <file> --run <file> [--baseline <file>] [--tolerance N] [--json]
 *   eval-harness baseline --cases <file> --run <file> --out <file>
 *
 * `score` reads a run file and never calls a model. That is the default and
 * there is no flag to change it here: a live runner belongs in the app that
 * owns the system under test, and its job is to *produce* a run file. Keeping
 * scoring offline means a score is reproducible, free, and cannot move because
 * a vendor shipped a new checkpoint.
 *
 * Exit codes: 0 clean · 1 regression against the baseline · 2 usage or corpus
 * error. The 1 is what makes this usable from CI.
 */

import { readFileSync, writeFileSync } from "node:fs";
import {
  parseCases,
  parseOutputs,
  CorpusError,
  DRAFT_PLACEHOLDER,
  DRAFT_TAG,
} from "./case.ts";
import { scoreRun, compare, format, formatRegressions, type Report } from "./report.ts";

const USAGE = `eval-harness

  validate --cases <file>
      Check a corpus is well-formed: unique ids, tagged, spans verbatim.

  score --cases <file> --run <file> [--baseline <file>] [--tolerance N] [--json]
      Score a run. Per-tag first. Exits 1 if a baseline is given and anything
      regressed against it.

  baseline --cases <file> --run <file> --out <file>
      Freeze the current scores as the thing future runs are compared to.

  draft --docs <file> --out <file> [--app NAME] [--scorer NAME] [--prefix P]
      Turn raw documents into case stubs. Does the mechanical half — ids,
      structure, provenance — and leaves every judgement to you. The stubs
      are refused by every other command until you fill them in.
`;

function arg(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? undefined : argv[i + 1];
}

function read(path: string, what: string): string {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    throw new CorpusError(`cannot read the ${what} file at ${path}`);
  }
}

function loadReport(casesPath: string, runPath: string): Report {
  const cases = parseCases(read(casesPath, "cases"));
  const outputs = parseOutputs(read(runPath, "run"));
  const unknown = outputs.filter((o) => !cases.some((c) => c.id === o.case_id));
  if (unknown.length) {
    // Silently ignoring these would let a run drift away from its corpus and
    // still look healthy.
    throw new CorpusError(
      `the run has ${unknown.length} outputs for cases that are not in the ` +
        `corpus (first: ${unknown[0].case_id})`,
    );
  }
  return scoreRun(cases, outputs);
}

function main(argv: string[]): number {
  const verb = argv[0];

  if (!verb || verb === "--help" || verb === "-h") {
    console.log(USAGE);
    return verb ? 0 : 2;
  }

  if (verb === "validate") {
    const casesPath = arg(argv, "cases");
    if (!casesPath) throw new CorpusError("validate needs --cases");
    const cases = parseCases(read(casesPath, "cases"));
    const negatives = cases.filter((c) => c.expected === null).length;
    const untagged = new Set(cases.flatMap((c) => c.tags)).size;
    console.log(
      `${cases.length} cases · ${negatives} negatives · ${untagged} tags · ok`,
    );
    if (negatives === 0) {
      console.log(
        "  warning: no negatives. A set with no negatives measures nothing.",
      );
    }
    return 0;
  }

  if (verb === "score") {
    const casesPath = arg(argv, "cases");
    const runPath = arg(argv, "run");
    if (!casesPath || !runPath) throw new CorpusError("score needs --cases and --run");

    const report = loadReport(casesPath, runPath);
    const basePath = arg(argv, "baseline");
    const tolerance = Number(arg(argv, "tolerance") ?? 0);

    if (argv.includes("--json")) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(format(report));
    }

    if (!basePath) return 0;

    const baseline = JSON.parse(read(basePath, "baseline")) as Report;
    const regs = compare(baseline, report, tolerance);
    console.log("");
    if (regs.length === 0) {
      console.log("no regressions against the baseline");
      return 0;
    }
    console.log(formatRegressions(regs));
    return 1;
  }

  if (verb === "draft") {
    const docsPath = arg(argv, "docs");
    const out = arg(argv, "out");
    if (!docsPath || !out) throw new CorpusError("draft needs --docs and --out");

    const app = arg(argv, "app") ?? "unknown";
    const scorer = arg(argv, "scorer") ?? "span";
    const prefix = arg(argv, "prefix") ?? "case";

    // One JSON object per line: {"document": "...", "requirement": "..."}.
    // requirement is optional; everything else about the case is yours.
    const docs = read(docsPath, "docs")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("//"))
      .map((l, i) => {
        try {
          return JSON.parse(l) as { document?: string; requirement?: string; source?: string };
        } catch {
          throw new CorpusError(`docs line ${i + 1} is not valid JSON`);
        }
      });

    const bad = docs.findIndex((d) => typeof d.document !== "string" || !d.document);
    if (bad !== -1) throw new CorpusError(`docs line ${bad + 1} has no "document"`);

    const width = String(docs.length).length;
    const lines = docs.map((d, i) => {
      const input: Record<string, unknown> = { document: d.document };
      if (d.requirement) input.requirement = d.requirement;
      return JSON.stringify({
        id: `${prefix}-${String(i + 1).padStart(width, "0")}`,
        app,
        scorer,
        // The tag is what makes the stub inert. Removing it is the deliberate
        // act of saying "I have judged this one".
        tags: [DRAFT_TAG],
        input,
        expected: DRAFT_PLACEHOLDER,
        source: d.source ?? `drafted from ${docsPath}`,
      });
    });

    writeFileSync(
      out,
      `// ${lines.length} DRAFT cases. Every other command refuses this file until\n` +
        `// each case has a real "expected" and its "${DRAFT_TAG}" tag removed.\n` +
        `//\n` +
        `// For each: set "expected" to the verbatim span, or to null if the correct\n` +
        `// answer is that nothing is there. Then replace the tag with something\n` +
        `// meaningful, because an untagged case can only ever appear in the\n` +
        `// aggregate, which is the number that hides regressions.\n` +
        `//\n` +
        `// A set with no negatives measures nothing: aim for at least a fifth.\n` +
        lines.join("\n") +
        "\n",
      "utf-8",
    );
    console.log(`wrote ${lines.length} draft cases to ${out}`);
    console.log(`they will not score until you fill them in — that is the point`);
    return 0;
  }

  if (verb === "baseline") {
    const casesPath = arg(argv, "cases");
    const runPath = arg(argv, "run");
    const out = arg(argv, "out");
    if (!casesPath || !runPath || !out) {
      throw new CorpusError("baseline needs --cases, --run and --out");
    }
    const report = loadReport(casesPath, runPath);
    writeFileSync(out, JSON.stringify(report, null, 2) + "\n", "utf-8");
    console.log(format(report, false));
    console.log(`\nwrote ${out}`);
    return 0;
  }

  console.log(USAGE);
  return 2;
}

try {
  process.exit(main(process.argv.slice(2)));
} catch (err) {
  if (err instanceof CorpusError) {
    console.error(`error: ${err.message}`);
    process.exit(2);
  }
  throw err;
}
