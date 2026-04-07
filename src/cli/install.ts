import type { InstallArgs } from "./types"
import { runCliInstaller } from "./cli-installer"
import { runTuiInstaller } from "./tui-installer"
import { PLUGIN_VERSION } from "../shared/plugin-identity"

export async function install(args: InstallArgs): Promise<number> {
  return args.tui ? runTuiInstaller(args, PLUGIN_VERSION) : runCliInstaller(args, PLUGIN_VERSION)
}
