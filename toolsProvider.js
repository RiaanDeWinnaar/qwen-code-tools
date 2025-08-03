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
const agentProvider_1 = require("./agentProvider");
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
            content: zod_1.z.string().describe("Content to write to the file")
            // Removed overwrite parameter to avoid Qwen parsing issues
        },
        implementation: async ({ file_name, content }, { status, warn }) => {
            const workspaceFolder = config.get("workspaceFolder");
            const folderPath = (0, path_1.join)(ctl.getWorkingDirectory(), workspaceFolder);
            await (0, promises_1.mkdir)(folderPath, { recursive: true });
            const filePath = (0, path_1.join)(folderPath, file_name);
            // Always allow overwrite for simplicity with Qwen
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
        // Removed optional path parameter to simplify for Qwen
        },
        implementation: async ({}, { status }) => {
            const workspaceFolder = config.get("workspaceFolder");
            const basePath = (0, path_1.join)(ctl.getWorkingDirectory(), workspaceFolder);
            if (!(0, fs_1.existsSync)(basePath)) {
                await (0, promises_1.mkdir)(basePath, { recursive: true });
                return "Workspace directory created. No files yet.";
            }
            status(`Listing files in: ${workspaceFolder}`);
            const files = await (0, promises_1.readdir)(basePath, { withFileTypes: true });
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
            code: zod_1.z.string().describe("Code to execute")
            // Removed save_output parameter to simplify for Qwen
        },
        implementation: async ({ language, code }, { status, warn, signal }) => {
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
    // Web Search Tool (conditionally added based on config)
    const webSearchEnabled = config.get("enableWebSearch");
    if (webSearchEnabled) {
        const webSearchTool = (0, sdk_1.tool)({
            name: "web_search",
            description: (0, sdk_1.text) `
        Search the web for current information, news, and real-time data. Uses multiple search engines for comprehensive results.
      `,
            parameters: {
                query: zod_1.z.string().describe("Search query to find information about")
            },
            implementation: async ({ query }, { status, warn, signal }) => {
                status(`Searching the web for: ${query}`);
                try {
                    // Get Brave API key from config
                    const braveApiKey = config.get("braveApiKey");
                    // Try Brave Search API first (free tier: 5000 queries/month, or higher limits with API key)
                    try {
                        const braveUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=3`;
                        const braveHeaders = {
                            'Accept': 'application/json',
                            'Accept-Encoding': 'gzip',
                            'User-Agent': 'LMStudio-QwenTools/1.0'
                        };
                        // Add API key if available
                        if (braveApiKey && braveApiKey.trim()) {
                            braveHeaders['X-Subscription-Token'] = braveApiKey.trim();
                            status(`Using Brave Search with API key for: ${query}`);
                        }
                        else {
                            status(`Using Brave Search (free tier) for: ${query}`);
                        }
                        const braveResponse = await fetch(braveUrl, {
                            signal,
                            headers: braveHeaders
                        });
                        if (braveResponse.ok) {
                            const braveData = await braveResponse.json();
                            if (braveData.web && braveData.web.results && braveData.web.results.length > 0) {
                                const results = braveData.web.results.slice(0, 3);
                                const formattedResults = results.map((result, index) => `${index + 1}. **${result.title}**\n   ${result.description}\n   Source: ${result.url}`).join('\n\n');
                                return `Web search results for "${query}" (via Brave Search):\n\n${formattedResults}`;
                            }
                        }
                        else if (braveResponse.status === 401) {
                            warn("Brave Search API key invalid or expired");
                        }
                        else if (braveResponse.status === 429) {
                            warn("Brave Search rate limit exceeded - consider upgrading your API plan");
                        }
                    }
                    catch (braveError) {
                        if (braveApiKey && braveApiKey.trim()) {
                            warn("Brave Search API unavailable (check API key), trying fallback options");
                        }
                        else {
                            warn("Brave Search unavailable (no API key set), trying fallback options");
                        }
                    }
                    // Fallback to DuckDuckGo Instant Answer API
                    try {
                        const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
                        const ddgResponse = await fetch(ddgUrl, {
                            signal,
                            headers: { 'User-Agent': 'LMStudio-QwenTools/1.0' }
                        });
                        if (ddgResponse.ok) {
                            const ddgData = await ddgResponse.json();
                            if (ddgData.AbstractText && ddgData.AbstractText.length > 20) {
                                return `Search results for "${query}" (via DuckDuckGo):\n\n${ddgData.AbstractText}\n\nSource: ${ddgData.AbstractURL || 'DuckDuckGo Knowledge Base'}`;
                            }
                            if (ddgData.RelatedTopics && ddgData.RelatedTopics.length > 0) {
                                const results = ddgData.RelatedTopics.slice(0, 3).map((topic, index) => {
                                    if (topic.Text) {
                                        return `${index + 1}. ${topic.Text}`;
                                    }
                                    return null;
                                }).filter(Boolean);
                                if (results.length > 0) {
                                    return `Search results for "${query}" (via DuckDuckGo):\n\n${results.join('\n\n')}\n\nSource: DuckDuckGo Knowledge Base`;
                                }
                            }
                        }
                    }
                    catch (ddgError) {
                        warn("DuckDuckGo unavailable, trying Wikipedia fallback");
                    }
                    // Final fallback to Wikipedia
                    try {
                        const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
                        const wikiResponse = await fetch(wikiUrl, {
                            signal,
                            headers: { 'User-Agent': 'LMStudio-QwenTools/1.0' }
                        });
                        if (wikiResponse.ok) {
                            const wikiData = await wikiResponse.json();
                            if (wikiData.extract && wikiData.extract.length > 20) {
                                return `Search results for "${query}" (Wikipedia fallback):\n\n${wikiData.extract}\n\nSource: ${wikiData.content_urls?.desktop?.page || 'Wikipedia'}`;
                            }
                        }
                        // Wikipedia search if summary doesn't work
                        const wikiSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
                        const searchResponse = await fetch(wikiSearchUrl, {
                            signal,
                            headers: { 'User-Agent': 'LMStudio-QwenTools/1.0' }
                        });
                        if (searchResponse.ok) {
                            const searchData = await searchResponse.json();
                            if (searchData.query?.search?.length > 0) {
                                const results = searchData.query.search.slice(0, 3).map((result, index) => `${index + 1}. ${result.title}\n   ${result.snippet.replace(/<[^>]*>/g, '')}\n   https://en.wikipedia.org/wiki/${encodeURIComponent(result.title.replace(/ /g, '_'))}`).join('\n\n');
                                return `Search results for "${query}" (Wikipedia search):\n\n${results}`;
                            }
                        }
                    }
                    catch (wikiError) {
                        warn("All search services unavailable");
                    }
                    return `No search results found for "${query}". All search services appear to be unavailable. Please try:\n- Checking your internet connection\n- Using more specific search terms\n- Trying again later`;
                }
                catch (error) {
                    if (error.name === 'AbortError') {
                        return 'Web search was cancelled';
                    }
                    return `Web search failed: ${error.message}. Please check your internet connection and try again.`;
                }
            },
        });
        tools.push(webSearchTool);
    }
    // Package Management Tool
    const packageManagerTool = (0, sdk_1.tool)({
        name: "package_manager",
        description: (0, sdk_1.text) `
      Install packages using npm, pip, or other package managers. Useful for setting up project dependencies.
    `,
        parameters: {
            manager: zod_1.z.enum(["npm", "pip", "yarn", "pnpm"]).describe("Package manager to use"),
            action: zod_1.z.enum(["install", "uninstall", "list", "init"]).describe("Action to perform"),
            package_name: zod_1.z.string().optional().describe("Package name (not needed for list/init)")
        },
        implementation: async ({ manager, action, package_name }, { status, warn, signal }) => {
            const workspaceFolder = config.get("workspaceFolder");
            const folderPath = (0, path_1.join)(ctl.getWorkingDirectory(), workspaceFolder);
            let command;
            switch (manager) {
                case "npm":
                    if (action === "install" && package_name)
                        command = `npm install ${package_name}`;
                    else if (action === "uninstall" && package_name)
                        command = `npm uninstall ${package_name}`;
                    else if (action === "list")
                        command = "npm list";
                    else if (action === "init")
                        command = "npm init -y";
                    else
                        return "Error: Invalid npm action or missing package name";
                    break;
                case "pip":
                    if (action === "install" && package_name)
                        command = `pip install ${package_name}`;
                    else if (action === "uninstall" && package_name)
                        command = `pip uninstall ${package_name} -y`;
                    else if (action === "list")
                        command = "pip list";
                    else
                        return "Error: pip init not supported";
                    break;
                case "yarn":
                    if (action === "install" && package_name)
                        command = `yarn add ${package_name}`;
                    else if (action === "uninstall" && package_name)
                        command = `yarn remove ${package_name}`;
                    else if (action === "list")
                        command = "yarn list";
                    else if (action === "init")
                        command = "yarn init -y";
                    else
                        return "Error: Invalid yarn action or missing package name";
                    break;
                case "pnpm":
                    if (action === "install" && package_name)
                        command = `pnpm add ${package_name}`;
                    else if (action === "uninstall" && package_name)
                        command = `pnpm remove ${package_name}`;
                    else if (action === "list")
                        command = "pnpm list";
                    else if (action === "init")
                        command = "pnpm init";
                    else
                        return "Error: Invalid pnpm action or missing package name";
                    break;
                default:
                    return `Error: Unsupported package manager: ${manager}`;
            }
            status(`Running: ${command}`);
            warn("Package installation can modify your system. Make sure you trust the packages.");
            try {
                const { stdout, stderr } = await execAsync(command, {
                    signal,
                    cwd: folderPath,
                    timeout: 60000 // 60 seconds for package operations
                });
                return `${manager} ${action} completed:\n\nSTDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`;
            }
            catch (error) {
                return `Package manager error: ${error.message}`;
            }
        },
    });
    // Project Structure Tool
    const projectStructureTool = (0, sdk_1.tool)({
        name: "create_project_structure",
        description: (0, sdk_1.text) `
      Create a complete project structure with common files and folders. Useful for initializing new projects.
    `,
        parameters: {
            project_type: zod_1.z.enum(["python", "javascript", "typescript", "react", "vue", "express"]).describe("Type of project to create"),
            project_name: zod_1.z.string().describe("Name of the project")
        },
        implementation: async ({ project_type, project_name }, { status }) => {
            const workspaceFolder = config.get("workspaceFolder");
            const folderPath = (0, path_1.join)(ctl.getWorkingDirectory(), workspaceFolder);
            const projectPath = (0, path_1.join)(folderPath, project_name);
            await (0, promises_1.mkdir)(projectPath, { recursive: true });
            status(`Creating ${project_type} project structure for ${project_name}`);
            try {
                switch (project_type) {
                    case "python":
                        await (0, promises_1.mkdir)((0, path_1.join)(projectPath, "src"), { recursive: true });
                        await (0, promises_1.mkdir)((0, path_1.join)(projectPath, "tests"), { recursive: true });
                        await (0, promises_1.writeFile)((0, path_1.join)(projectPath, "main.py"), "# Main application file\n\ndef main():\n    print('Hello, World!')\n\nif __name__ == '__main__':\n    main()\n", "utf-8");
                        await (0, promises_1.writeFile)((0, path_1.join)(projectPath, "requirements.txt"), "# Add your Python dependencies here\n", "utf-8");
                        await (0, promises_1.writeFile)((0, path_1.join)(projectPath, "README.md"), `# ${project_name}\n\nA Python project.\n\n## Installation\n\n\`\`\`bash\npip install -r requirements.txt\n\`\`\`\n\n## Usage\n\n\`\`\`bash\npython main.py\n\`\`\`\n`, "utf-8");
                        break;
                    case "javascript":
                    case "typescript":
                        await (0, promises_1.mkdir)((0, path_1.join)(projectPath, "src"), { recursive: true });
                        const ext = project_type === "typescript" ? "ts" : "js";
                        await (0, promises_1.writeFile)((0, path_1.join)(projectPath, `src/index.${ext}`), "// Main application file\nconsole.log('Hello, World!');\n", "utf-8");
                        await (0, promises_1.writeFile)((0, path_1.join)(projectPath, "package.json"), JSON.stringify({
                            name: project_name,
                            version: "1.0.0",
                            description: `A ${project_type} project`,
                            main: `src/index.${ext}`,
                            scripts: {
                                start: `node src/index.${ext}`,
                                dev: `node src/index.${ext}`
                            }
                        }, null, 2), "utf-8");
                        if (project_type === "typescript") {
                            await (0, promises_1.writeFile)((0, path_1.join)(projectPath, "tsconfig.json"), JSON.stringify({
                                compilerOptions: {
                                    target: "ES2020",
                                    module: "commonjs",
                                    outDir: "./dist",
                                    strict: true
                                }
                            }, null, 2), "utf-8");
                        }
                        break;
                    default:
                        return `Project type ${project_type} structure not yet implemented`;
                }
                await (0, promises_1.writeFile)((0, path_1.join)(projectPath, ".gitignore"), "node_modules/\n*.log\n.env\ndist/\n__pycache__/\n*.pyc\n", "utf-8");
                return `Successfully created ${project_type} project structure for "${project_name}" with:\n- Source directory\n- Main entry file\n- Package/dependency file\n- README.md\n- .gitignore`;
            }
            catch (error) {
                return `Error creating project structure: ${error.message}`;
            }
        },
    });
    // Add all tools to the array
    tools.push(createFileTool);
    tools.push(readFileTool);
    tools.push(listFilesTool);
    tools.push(executeCodeTool);
    tools.push(gitOperationTool);
    tools.push(packageManagerTool);
    tools.push(projectStructureTool);
    // Web search tool is already conditionally added above if enabled
    // Add autonomous agent tool if Agent Mode is enabled
    const agentTool = (0, agentProvider_1.createAgentTool)(ctl);
    if (agentTool) {
        tools.push(agentTool);
    }
    return tools;
}
//# sourceMappingURL=toolsProvider.js.map