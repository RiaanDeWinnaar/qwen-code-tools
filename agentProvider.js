"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgentTool = createAgentTool;
const sdk_1 = require("@lmstudio/sdk");
const zod_1 = require("zod");
const config_1 = require("./config");
function createAgentTool(ctl) {
    const config = ctl.getPluginConfig(config_1.configSchematics);
    const agentMode = config.get("operationMode");
    if (!agentMode) {
        return null; // Don't provide agent tool if mode is disabled
    }
    return (0, sdk_1.tool)({
        name: "autonomous_agent",
        description: (0, sdk_1.text) `
      🤖 Autonomous Agent Mode: Execute complex development tasks automatically.
      This tool enables autonomous behavior where the agent can plan and execute 
      multi-step development workflows without asking permission for each tool use.
      Only available when Agent Mode is enabled in configuration.
    `,
        parameters: {
            task_description: zod_1.z.string().describe("Detailed description of the development task to complete autonomously"),
            scope: zod_1.z.string().optional().describe("Optional scope or constraints for the task")
        },
        implementation: async ({ task_description, scope }, { status, warn }) => {
            status("🤖 Agent Mode: Analyzing task and planning autonomous approach...");
            try {
                // This is a meta-tool that guides autonomous behavior
                const guidance = (0, sdk_1.text) `
**AUTONOMOUS DEVELOPMENT AGENT ACTIVATED** 🤖

**Task**: ${task_description}
${scope ? `**Scope**: ${scope}` : ''}

**Available Tools for Autonomous Use:**
- create_file: Create any type of file with content  
- read_file: Read existing files to understand codebase
- list_files: Explore directory structures and find files
- execute_code: Run Python/JavaScript code with output capture
- git_operation: Initialize repos, commit changes, manage version control
- package_manager: Install dependencies (npm, pip, yarn, etc.)
- create_project_structure: Scaffold complete project templates
- web_search: Research latest information and best practices

**Autonomous Execution Protocol:**
1. **ANALYZE**: Break down the task into concrete steps
2. **RESEARCH**: Use web_search for unfamiliar topics/current practices
3. **EXPLORE**: Use list_files/read_file to understand existing code
4. **PLAN**: Design the complete approach and required components
5. **IMPLEMENT**: Use create_file, package_manager, execute_code as needed
6. **TEST**: Verify functionality with execute_code
7. **DOCUMENT**: Create README and documentation  
8. **VERSION**: Commit changes with git_operation

**Instructions:**
- Proceed autonomously without asking permission for each tool use
- Make decisions based on best practices and current standards
- Handle errors gracefully and adapt approach as needed
- Provide status updates during long operations
- Deliver a complete, working solution

**Begin autonomous execution now.**`;
                status("🚀 Autonomous agent guidance provided. Proceeding with task execution...");
                return guidance;
            }
            catch (error) {
                warn(`Agent mode error: ${error.message}`);
                return `🚫 Agent mode error: ${error.message}\n\nFalling back to individual tool mode. Use specific tools like create_file, read_file, etc.`;
            }
        },
    });
}
// Force rebuild
//# sourceMappingURL=agentProvider.js.map