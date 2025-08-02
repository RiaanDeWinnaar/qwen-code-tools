"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const toolsProvider_1 = require("./toolsProvider");
const config_1 = require("./config");
async function main(context) {
    // Register configuration schemas
    context.withConfigSchematics(config_1.configSchematics);
    context.withGlobalConfigSchematics(config_1.globalConfigSchematics);
    // Register the tools provider
    context.withToolsProvider(toolsProvider_1.toolsProvider);
    console.log("Qwen3 Coder Tools plugin loaded successfully!");
}
//# sourceMappingURL=index.js.map