import { PluginContext } from "@lmstudio/sdk";
import { toolsProvider } from "./toolsProvider";
import { configSchematics, globalConfigSchematics } from "./config";

export async function main(context: PluginContext) {
  // Register configuration schemas
  context.withConfigSchematics(configSchematics);
  context.withGlobalConfigSchematics(globalConfigSchematics);

  // Register the tools provider
  context.withToolsProvider(toolsProvider);

  console.log("Qwen3 Coder Tools plugin loaded successfully!");
}
