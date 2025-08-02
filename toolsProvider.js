"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolsProvider = toolsProvider;
const sdk_1 = require("@lmstudio/sdk");
const zod_1 = require("zod");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const child_process_1 = require("child_process");
const util_1 = require("util");
const config_1 = require("./config");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function toolsProvider(ctl) {
    const tools = [];
    // Get configuration
    const config = ctl.getPluginConfig(config_1.configSchematics);
    // File Management Tools
    const createFileTool = (0, sdk_1.tool)({
        name: "create_file",
        description: (0, sdk_1.text) `
      Create a new file with specified content. Useful for creating code files, documentation, or any text-based files.
    `,
        parameters: {
            file_name: zod_1.z.string().describe("Name of the file to create"),
            content: zod_1.z.string().describe("Content to write to the file"),
            overwrite: zod_1.z.boolean().optional().describe("Whether to overwrite if file exists")
        },
        implementation: async ({ file_name, content, overwrite }, { status, warn }) => {
            const workspaceFolder = config.get("workspaceFolder");
            const folderPath = (0, path_1.join)(ctl.getWorkingDirectory(), workspaceFolder);
            await (0, promises_1.mkdir)(folderPath, { recursive: true });
            const filePath = (0, path_1.join)(folderPath, file_name);
            if ((0, fs_1.existsSync)(filePath) && !overwrite) {
                return `Error: File ${file_name} already exists. Use overwrite=true to replace it.`;
            }
            const maxSize = config.get("maxFileSize") * 1024;
            if (content.length > maxSize) {
                warn(`File content is larger than ${config.get("maxFileSize")}KB`);
            }
            status(`Creating file: ${file_name}`);
            await (0, promises_1.writeFile)(filePath, content, "utf-8");
            return `File ${file_name} created successfully in ${workspaceFolder}/`;
        },
    });
    const readFileTool = (0, sdk_1.tool)({
        name: "read_file",
        description: (0, sdk_1.text) `
      Read the content of an existing file. Useful for examining code, configuration files, or any text-based content.
    `,
        parameters: {
            file_name: zod_1.z.string().describe("Name of the file to read")
        },
        implementation: async ({ file_name }, { status }) => {
            const workspaceFolder = config.get("workspaceFolder");
            const filePath = (0, path_1.join)(ctl.getWorkingDirectory(), workspaceFolder, file_name);
            if (!(0, fs_1.existsSync)(filePath)) {
                return `Error: File ${file_name} does not exist in ${workspaceFolder}/`;
            }
            const stats = (0, fs_1.statSync)(filePath);
            const maxSize = config.get("maxFileSize") * 1024;
            if (stats.size > maxSize) {
                return `Error: File ${file_name} is too large (${Math.round(stats.size / 1024)}KB > ${config.get("maxFileSize")}KB)`;
            }
            status(`Reading file: ${file_name}`);
            const content = await (0, promises_1.readFile)(filePath, "utf-8");
            return content;
        },
    });
    const listFilesTool = (0, sdk_1.tool)({
        name: "list_files",
        description: (0, sdk_1.text) `
      List files in the workspace directory. Useful for exploring project structure.
    `,
        parameters: {
            path: zod_1.z.string().optional().describe("Subdirectory to list (optional)")
        },
        implementation: async ({ path }, { status }) => {
            const workspaceFolder = config.get("workspaceFolder");
            const basePath = (0, path_1.join)(ctl.getWorkingDirectory(), workspaceFolder);
            const targetPath = path ? (0, path_1.join)(basePath, path) : basePath;
            if (!(0, fs_1.existsSync)(targetPath)) {
                return `Error: Directory ${path ? path : workspaceFolder} does not exist`;
            }
            status(`Listing files in: ${path ? path : workspaceFolder}`);
            const files = await (0, promises_1.readdir)(targetPath, { withFileTypes: true });
            const fileList = files.map(file => {
                const type = file.isDirectory() ? "DIR" : "FILE";
                const ext = file.isFile() ? (0, path_1.extname)(file.name) : "";
                return `${type}: ${file.name}${ext ? ` (${ext})` : ""}`;
            });
            return fileList.length > 0 ? fileList.join("\n") : "Directory is empty";
        },
    });
    // Code Execution Tools
    const executeCodeTool = (0, sdk_1.tool)({
        name: "execute_code",
        description: (0, sdk_1.text) `
      Execute code in various languages (Python, JavaScript, etc.). Useful for testing code snippets or running scripts.
    `,
        parameters: {
            language: zod_1.z.enum(["python", "javascript", "bash", "node"]).describe("Programming language to execute"),
            code: zod_1.z.string().describe("Code to execute"),
            save_output: zod_1.z.boolean().optional().describe("Whether to save output to a file")
        },
        implementation: async ({ language, code, save_output }, { status, warn, signal }) => {
            const workspaceFolder = config.get("workspaceFolder");
            const folderPath = (0, path_1.join)(ctl.getWorkingDirectory(), workspaceFolder);
            await (0, promises_1.mkdir)(folderPath, { recursive: true });
            const fileExt = language === "python" ? "py" : language === "javascript" || language === "node" ? "js" : "sh";
            const tempFile = (0, path_1.join)(folderPath, `temp_${Date.now()}.${fileExt}`);
            await (0, promises_1.writeFile)(tempFile, code, "utf-8");
            let command;
            switch (language) {
                case "python":
                    command = `python "${tempFile}"`;
                    break;
                case "javascript":
                case "node":
                    command = `node "${tempFile}"`;
                    break;
                case "bash":
                    command = `bash "${tempFile}"`;
                    break;
                default:
                    return `Error: Unsupported language: ${language}`;
            }
            status(`Executing ${language} code...`);
            warn("Code execution can be dangerous. Make sure the code is safe.");
            try {
                const { stdout, stderr } = await execAsync(command, {
                    signal,
                    cwd: folderPath,
                    timeout: 30000 // Use fixed 30 second timeout
                });
                const output = `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`;
                if (save_output) {
                    const outputFile = (0, path_1.join)(folderPath, `output_${Date.now()}.txt`);
                    await (0, promises_1.writeFile)(outputFile, output, "utf-8");
                    status(`Output saved to: ${(0, path_1.basename)(outputFile)}`);
                }
                return output;
            }
            catch (error) {
                return `Execution error: ${error.message}`;
            }
        },
    });
    // Git Operations Tool
    const gitOperationTool = (0, sdk_1.tool)({
        name: "git_operation",
        description: "Perform basic Git operations in the workspace. Useful for version control of code projects.",
        parameters: {
            operation: zod_1.z.enum(["init", "status", "add", "commit", "log"]).describe("Git operation to perform"),
            files: zod_1.z.string().optional().describe("Files to add (for 'add' operation)"),
            message: zod_1.z.string().optional().describe("Commit message (for 'commit' operation)")
        },
        implementation: async ({ operation, files, message }, { status, signal }) => {
            const workspaceFolder = config.get("workspaceFolder");
            const folderPath = (0, path_1.join)(ctl.getWorkingDirectory(), workspaceFolder);
            let command;
            switch (operation) {
                case "init":
                    command = "git init";
                    break;
                case "status":
                    command = "git status";
                    break;
                case "add":
                    command = `git add ${files ? files : "."}`;
                    break;
                case "commit":
                    if (!message)
                        return "Error: Commit message is required for commit operation";
                    command = `git commit -m "${message}"`;
                    break;
                case "log":
                    command = "git log --oneline -10";
                    break;
                default:
                    return `Error: Unsupported git operation: ${operation}`;
            }
            status(`Executing: ${command}`);
            try {
                const { stdout, stderr } = await execAsync(command, {
                    signal,
                    cwd: folderPath,
                    timeout: 10000
                });
                return stdout ? stdout : stderr;
            }
            catch (error) {
                return `Git error: ${error.message}`;
            }
        },
    });
    // Add all tools to the array
    tools.push(createFileTool);
    tools.push(readFileTool);
    tools.push(listFilesTool);
    tools.push(executeCodeTool);
    tools.push(gitOperationTool);
    return tools;
}
//# sourceMappingURL=toolsProvider.js.map