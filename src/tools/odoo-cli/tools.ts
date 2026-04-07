import type { PluginInput } from "@opencode-ai/plugin"
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { spawn } from "child_process"
import type { OdooCliResult } from "./types"

function runOdooCli(
  odooBinPath: string,
  projectRoot: string,
  args: string[],
): Promise<OdooCliResult> {
  return new Promise((resolve) => {
    const fullCommand = `${odooBinPath} ${args.join(" ")}`.trim()
    const start = Date.now()
    const child = spawn(odooBinPath, args, {
      cwd: projectRoot,
      timeout: 180_000,
    })

    let stdout = ""
    let stderr = ""

    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString()
    })
    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString()
    })

    child.on("close", (code) => {
      resolve({ command: fullCommand, stdout: stdout.trim(), stderr: stderr.trim(), exitCode: code ?? 1, duration: Date.now() - start })
    })

    child.on("error", (err) => {
      resolve({ command: fullCommand, stdout: "", stderr: err.message, exitCode: 1, duration: Date.now() - start })
    })
  })
}

export function createOdooCliTool(ctx: PluginInput): Record<string, ToolDefinition> {
  const odooCli: ToolDefinition = tool({
    description:
      "Execute Odoo CLI commands (odoo-bin / odoo). " +
      "Supports scaffold, shell, db operations, module update/install, testing, and development mode. " +
      "Use this instead of running odoo-bin directly via shell for safety and structured output.",
    args: {
      command: tool.schema
        .string()
        .describe("The Odoo command or flag to execute (e.g. 'scaffold', 'shell', '--update', 'db')"),
      args: tool.schema
        .array(tool.schema.string())
        .optional()
        .describe("Additional arguments (e.g. module names, database name, flags)"),
      odoo_bin_path: tool.schema
        .string()
        .optional()
        .describe("Path to odoo-bin executable. Defaults to './odoo-bin' or 'odoo'"),
      project_root: tool.schema
        .string()
        .optional()
        .describe("Odoo project root directory. Defaults to current working directory."),
      database: tool.schema
        .string()
        .optional()
        .describe("Database name to operate on (adds -d flag)"),
      config_file: tool.schema
        .string()
        .optional()
        .describe("Path to odoo.conf (adds -c flag)"),
    },
    execute: async (params) => {
      const projectRoot = params.project_root ?? ctx.directory
      const odooBin = params.odoo_bin_path ?? "./odoo-bin"
      const commandArgs: string[] = []

      if (params.config_file) {
        commandArgs.push("-c", params.config_file)
      }
      if (params.database) {
        commandArgs.push("-d", params.database)
      }

      commandArgs.push(params.command)
      if (params.args) {
        commandArgs.push(...params.args)
      }

      const result = await runOdooCli(odooBin, projectRoot, commandArgs)

      const output = [`$ ${result.command}`, `Exit code: ${result.exitCode} (${result.duration}ms)`]
      if (result.stdout) output.push(`\nOutput:\n${result.stdout}`)
      if (result.stderr) output.push(`\nStderr:\n${result.stderr}`)

      return output.join("\n")
    },
  })

  const odooModuleUpdate: ToolDefinition = tool({
    description:
      "Update one or more Odoo modules. Equivalent to 'odoo-bin -u module1,module2 --stop-after-init'. " +
      "Safely applies model changes, views, data, and access rules.",
    args: {
      modules: tool.schema
        .array(tool.schema.string())
        .describe("Module technical names to update (e.g. ['sale', 'purchase'])"),
      database: tool.schema.string().describe("Target database name"),
      odoo_bin_path: tool.schema.string().optional(),
      config_file: tool.schema.string().optional(),
      project_root: tool.schema.string().optional(),
    },
    execute: async (params) => {
      const projectRoot = params.project_root ?? ctx.directory
      const odooBin = params.odoo_bin_path ?? "./odoo-bin"
      const args = [
        "-d", params.database,
        "-u", params.modules.join(","),
        "--stop-after-init",
      ]
      if (params.config_file) args.unshift("-c", params.config_file)

      const result = await runOdooCli(odooBin, projectRoot, args)

      const output = [`Module update: ${params.modules.join(", ")}`, `$ ${result.command}`, `Exit: ${result.exitCode} (${result.duration}ms)`]
      if (result.stdout) output.push(`\nOutput:\n${result.stdout}`)
      if (result.stderr) output.push(`\nStderr:\n${result.stderr}`)
      return output.join("\n")
    },
  })

  const odooModuleInstall: ToolDefinition = tool({
    description:
      "Install one or more Odoo modules. Equivalent to 'odoo-bin -i module1,module2 --stop-after-init'.",
    args: {
      modules: tool.schema
        .array(tool.schema.string())
        .describe("Module technical names to install"),
      database: tool.schema.string().describe("Target database name"),
      odoo_bin_path: tool.schema.string().optional(),
      config_file: tool.schema.string().optional(),
      project_root: tool.schema.string().optional(),
    },
    execute: async (params) => {
      const projectRoot = params.project_root ?? ctx.directory
      const odooBin = params.odoo_bin_path ?? "./odoo-bin"
      const args = [
        "-d", params.database,
        "-i", params.modules.join(","),
        "--stop-after-init",
      ]
      if (params.config_file) args.unshift("-c", params.config_file)

      const result = await runOdooCli(odooBin, projectRoot, args)
      const output = [`Module install: ${params.modules.join(", ")}`, `$ ${result.command}`, `Exit: ${result.exitCode} (${result.duration}ms)`]
      if (result.stdout) output.push(`\nOutput:\n${result.stdout}`)
      if (result.stderr) output.push(`\nStderr:\n${result.stderr}`)
      return output.join("\n")
    },
  })

  const odooTestModule: ToolDefinition = tool({
    description:
      "Run tests for specific Odoo module(s). Uses --test-enable with optional --test-tags.",
    args: {
      modules: tool.schema.array(tool.schema.string()).describe("Module(s) to test"),
      database: tool.schema.string().describe("Test database name"),
      test_tags: tool.schema.string().optional().describe("Test tags filter (e.g. 'sale,-slow')"),
      odoo_bin_path: tool.schema.string().optional(),
      config_file: tool.schema.string().optional(),
      project_root: tool.schema.string().optional(),
    },
    execute: async (params) => {
      const projectRoot = params.project_root ?? ctx.directory
      const odooBin = params.odoo_bin_path ?? "./odoo-bin"
      const args = [
        "-d", params.database,
        "-u", params.modules.join(","),
        "--test-enable",
        "--stop-after-init",
      ]
      if (params.test_tags) args.push(`--test-tags=${params.test_tags}`)
      if (params.config_file) args.unshift("-c", params.config_file)

      const result = await runOdooCli(odooBin, projectRoot, args)
      const output = [`Test modules: ${params.modules.join(", ")}`, `$ ${result.command}`, `Exit: ${result.exitCode} (${result.duration}ms)`]
      if (result.stdout) output.push(`\n${result.stdout}`)
      if (result.stderr) output.push(`\nStderr:\n${result.stderr}`)
      return output.join("\n")
    },
  })

  return {
    odoo_cli: odooCli,
    odoo_module_update: odooModuleUpdate,
    odoo_module_install: odooModuleInstall,
    odoo_test_module: odooTestModule,
  }
}
