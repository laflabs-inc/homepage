import { execFileSync, spawnSync } from "node:child_process"
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

function runVercelBuild(migrationExitCode = 0) {
  const directory = mkdtempSync(join(tmpdir(), "laflabs-vercel-build-"))
  temporaryDirectories.push(directory)
  const traceFile = join(directory, "trace")
  const fakeNpm = join(directory, "npm")

  writeFileSync(fakeNpm, `#!/bin/sh
if [ "$2" = "db:migrate" ]; then
  printf 'migrate\\n' >> "$TRACE_FILE"
  exit "$MIGRATION_EXIT_CODE"
fi
if [ "$2" = "build" ]; then
  printf 'build\\n' >> "$TRACE_FILE"
fi
`)
  chmodSync(fakeNpm, 0o755)

  const npmExecutable = execFileSync("which", ["npm"], { encoding: "utf8" }).trim()
  const result = spawnSync(npmExecutable, ["run", "vercel-build"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${directory}:${process.env.PATH ?? ""}`,
      TRACE_FILE: traceFile,
      MIGRATION_EXIT_CODE: String(migrationExitCode),
    },
  })

  let trace = ""
  try {
    trace = readFileSync(traceFile, "utf8")
  } catch {
    // A missing trace is the expected RED state before the deploy script exists.
  }

  return { status: result.status, trace }
}

describe("Vercel deployment build", () => {
  it("migrates the target database before compiling the application", () => {
    expect(runVercelBuild()).toEqual({ status: 0, trace: "migrate\nbuild\n" })
  })

  it("does not deploy application code when migration fails", () => {
    expect(runVercelBuild(1)).toEqual({ status: 1, trace: "migrate\n" })
  })
})
