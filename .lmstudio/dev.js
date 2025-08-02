"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/config.ts
var import_sdk, configSchematics, globalConfigSchematics;
var init_config = __esm({
  "src/config.ts"() {
    "use strict";
    import_sdk = require("@lmstudio/sdk");
    configSchematics = (0, import_sdk.createConfigSchematics)().field(
      "workspaceFolder",
      "string",
      {
        displayName: "Workspace Folder",
        subtitle: "The folder where files will be created and managed."
      },
      "qwen_workspace"
    ).field(
      "maxFileSize",
      "numeric",
      {
        displayName: "Max File Size (KB)",
        subtitle: "Maximum size for files that can be read or created."
      },
      1024
    ).field(
      "enableWebSearch",
      "boolean",
      {
        displayName: "Enable Web Search",
        subtitle: "Allow the model to search the web for information."
      },
      false
    ).field(
      "braveApiKey",
      "string",
      {
        displayName: "Brave Search API Key",
        subtitle: "API key for Brave Search (optional - improves search quality and rate limits)",
        placeholder: "Enter your Brave API key here..."
      },
      ""
    ).build();
    globalConfigSchematics = (0, import_sdk.createConfigSchematics)().field(
      "defaultTimeout",
      "numeric",
      {
        displayName: "Default Timeout (seconds)",
        subtitle: "Default timeout for long-running operations."
      },
      30
    ).build();
  }
});

// src/toolsProvider.ts
async function toolsProvider(ctl) {
  const tools = [];
  const config = ctl.getPluginConfig(configSchematics);
  const createFileTool = (0, import_sdk2.tool)({
    name: "create_file",
    description: import_sdk2.text`
      Create a new file with specified content. Useful for creating code files, documentation, or any text-based files.
    `,
    parameters: {
      file_name: import_zod.z.string().describe("Name of the file to create"),
      content: import_zod.z.string().describe("Content to write to the file")
      // Removed overwrite parameter to avoid Qwen parsing issues
    },
    implementation: async ({ file_name, content }, { status, warn }) => {
      const workspaceFolder = config.get("workspaceFolder");
      const folderPath = (0, import_path.join)(ctl.getWorkingDirectory(), workspaceFolder);
      await (0, import_promises.mkdir)(folderPath, { recursive: true });
      const filePath = (0, import_path.join)(folderPath, file_name);
      const maxSize = config.get("maxFileSize") * 1024;
      if (content.length > maxSize) {
        warn(`File content is larger than ${config.get("maxFileSize")}KB`);
      }
      status(`Creating file: ${file_name}`);
      await (0, import_promises.writeFile)(filePath, content, "utf-8");
      return `File ${file_name} created successfully in ${workspaceFolder}/`;
    }
  });
  const readFileTool = (0, import_sdk2.tool)({
    name: "read_file",
    description: import_sdk2.text`
      Read the content of an existing file. Useful for examining code, configuration files, or any text-based content.
    `,
    parameters: {
      file_name: import_zod.z.string().describe("Name of the file to read")
    },
    implementation: async ({ file_name }, { status }) => {
      const workspaceFolder = config.get("workspaceFolder");
      const filePath = (0, import_path.join)(ctl.getWorkingDirectory(), workspaceFolder, file_name);
      if (!(0, import_fs.existsSync)(filePath)) {
        return `Error: File ${file_name} does not exist in ${workspaceFolder}/`;
      }
      const stats = (0, import_fs.statSync)(filePath);
      const maxSize = config.get("maxFileSize") * 1024;
      if (stats.size > maxSize) {
        return `Error: File ${file_name} is too large (${Math.round(stats.size / 1024)}KB > ${config.get("maxFileSize")}KB)`;
      }
      status(`Reading file: ${file_name}`);
      const content = await (0, import_promises.readFile)(filePath, "utf-8");
      return content;
    }
  });
  const listFilesTool = (0, import_sdk2.tool)({
    name: "list_files",
    description: import_sdk2.text`
      List files in the workspace directory. Useful for exploring project structure.
    `,
    parameters: {
      // Removed optional path parameter to simplify for Qwen
    },
    implementation: async ({}, { status }) => {
      const workspaceFolder = config.get("workspaceFolder");
      const basePath = (0, import_path.join)(ctl.getWorkingDirectory(), workspaceFolder);
      if (!(0, import_fs.existsSync)(basePath)) {
        await (0, import_promises.mkdir)(basePath, { recursive: true });
        return "Workspace directory created. No files yet.";
      }
      status(`Listing files in: ${workspaceFolder}`);
      const files = await (0, import_promises.readdir)(basePath, { withFileTypes: true });
      const fileList = files.map((file) => {
        const type = file.isDirectory() ? "DIR" : "FILE";
        const ext = file.isFile() ? (0, import_path.extname)(file.name) : "";
        return `${type}: ${file.name}${ext ? ` (${ext})` : ""}`;
      });
      return fileList.length > 0 ? fileList.join("\n") : "Directory is empty";
    }
  });
  const executeCodeTool = (0, import_sdk2.tool)({
    name: "execute_code",
    description: import_sdk2.text`
      Execute code in various languages (Python, JavaScript, etc.). Useful for testing code snippets or running scripts.
    `,
    parameters: {
      language: import_zod.z.enum(["python", "javascript", "bash", "node"]).describe("Programming language to execute"),
      code: import_zod.z.string().describe("Code to execute")
      // Removed save_output parameter to simplify for Qwen
    },
    implementation: async ({ language, code }, { status, warn, signal }) => {
      const workspaceFolder = config.get("workspaceFolder");
      const folderPath = (0, import_path.join)(ctl.getWorkingDirectory(), workspaceFolder);
      await (0, import_promises.mkdir)(folderPath, { recursive: true });
      const fileExt = language === "python" ? "py" : language === "javascript" || language === "node" ? "js" : "sh";
      const tempFile = (0, import_path.join)(folderPath, `temp_${Date.now()}.${fileExt}`);
      await (0, import_promises.writeFile)(tempFile, code, "utf-8");
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
          timeout: 3e4
          // Use fixed 30 second timeout
        });
        const output = `STDOUT:
${stdout}

STDERR:
${stderr}`;
        return output;
      } catch (error) {
        return `Execution error: ${error.message}`;
      }
    }
  });
  const gitOperationTool = (0, import_sdk2.tool)({
    name: "git_operation",
    description: "Perform basic Git operations in the workspace. Useful for version control of code projects.",
    parameters: {
      operation: import_zod.z.enum(["init", "status", "add", "commit", "log"]).describe("Git operation to perform"),
      files: import_zod.z.string().optional().describe("Files to add (for 'add' operation)"),
      message: import_zod.z.string().optional().describe("Commit message (for 'commit' operation)")
    },
    implementation: async ({ operation, files, message }, { status, signal }) => {
      const workspaceFolder = config.get("workspaceFolder");
      const folderPath = (0, import_path.join)(ctl.getWorkingDirectory(), workspaceFolder);
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
          if (!message) return "Error: Commit message is required for commit operation";
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
          timeout: 1e4
        });
        return stdout ? stdout : stderr;
      } catch (error) {
        return `Git error: ${error.message}`;
      }
    }
  });
  const webSearchEnabled = config.get("enableWebSearch");
  if (webSearchEnabled) {
    const webSearchTool = (0, import_sdk2.tool)({
      name: "web_search",
      description: import_sdk2.text`
        Search the web for current information, news, and real-time data. Uses multiple search engines for comprehensive results.
      `,
      parameters: {
        query: import_zod.z.string().describe("Search query to find information about")
      },
      implementation: async ({ query }, { status, warn, signal }) => {
        status(`Searching the web for: ${query}`);
        try {
          const braveApiKey = config.get("braveApiKey");
          try {
            const braveUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=3`;
            const braveHeaders = {
              "Accept": "application/json",
              "Accept-Encoding": "gzip",
              "User-Agent": "LMStudio-QwenTools/1.0"
            };
            if (braveApiKey && braveApiKey.trim()) {
              braveHeaders["X-Subscription-Token"] = braveApiKey.trim();
              status(`Using Brave Search with API key for: ${query}`);
            } else {
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
                const formattedResults = results.map(
                  (result, index) => `${index + 1}. **${result.title}**
   ${result.description}
   Source: ${result.url}`
                ).join("\n\n");
                return `Web search results for "${query}" (via Brave Search):

${formattedResults}`;
              }
            } else if (braveResponse.status === 401) {
              warn("Brave Search API key invalid or expired");
            } else if (braveResponse.status === 429) {
              warn("Brave Search rate limit exceeded - consider upgrading your API plan");
            }
          } catch (braveError) {
            if (braveApiKey && braveApiKey.trim()) {
              warn("Brave Search API unavailable (check API key), trying fallback options");
            } else {
              warn("Brave Search unavailable (no API key set), trying fallback options");
            }
          }
          try {
            const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
            const ddgResponse = await fetch(ddgUrl, {
              signal,
              headers: { "User-Agent": "LMStudio-QwenTools/1.0" }
            });
            if (ddgResponse.ok) {
              const ddgData = await ddgResponse.json();
              if (ddgData.AbstractText && ddgData.AbstractText.length > 20) {
                return `Search results for "${query}" (via DuckDuckGo):

${ddgData.AbstractText}

Source: ${ddgData.AbstractURL || "DuckDuckGo Knowledge Base"}`;
              }
              if (ddgData.RelatedTopics && ddgData.RelatedTopics.length > 0) {
                const results = ddgData.RelatedTopics.slice(0, 3).map((topic, index) => {
                  if (topic.Text) {
                    return `${index + 1}. ${topic.Text}`;
                  }
                  return null;
                }).filter(Boolean);
                if (results.length > 0) {
                  return `Search results for "${query}" (via DuckDuckGo):

${results.join("\n\n")}

Source: DuckDuckGo Knowledge Base`;
                }
              }
            }
          } catch (ddgError) {
            warn("DuckDuckGo unavailable, trying Wikipedia fallback");
          }
          try {
            const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
            const wikiResponse = await fetch(wikiUrl, {
              signal,
              headers: { "User-Agent": "LMStudio-QwenTools/1.0" }
            });
            if (wikiResponse.ok) {
              const wikiData = await wikiResponse.json();
              if (wikiData.extract && wikiData.extract.length > 20) {
                return `Search results for "${query}" (Wikipedia fallback):

${wikiData.extract}

Source: ${wikiData.content_urls?.desktop?.page || "Wikipedia"}`;
              }
            }
            const wikiSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
            const searchResponse = await fetch(wikiSearchUrl, {
              signal,
              headers: { "User-Agent": "LMStudio-QwenTools/1.0" }
            });
            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              if (searchData.query?.search?.length > 0) {
                const results = searchData.query.search.slice(0, 3).map(
                  (result, index) => `${index + 1}. ${result.title}
   ${result.snippet.replace(/<[^>]*>/g, "")}
   https://en.wikipedia.org/wiki/${encodeURIComponent(result.title.replace(/ /g, "_"))}`
                ).join("\n\n");
                return `Search results for "${query}" (Wikipedia search):

${results}`;
              }
            }
          } catch (wikiError) {
            warn("All search services unavailable");
          }
          return `No search results found for "${query}". All search services appear to be unavailable. Please try:
- Checking your internet connection
- Using more specific search terms
- Trying again later`;
        } catch (error) {
          if (error.name === "AbortError") {
            return "Web search was cancelled";
          }
          return `Web search failed: ${error.message}. Please check your internet connection and try again.`;
        }
      }
    });
    tools.push(webSearchTool);
  }
  const packageManagerTool = (0, import_sdk2.tool)({
    name: "package_manager",
    description: import_sdk2.text`
      Install packages using npm, pip, or other package managers. Useful for setting up project dependencies.
    `,
    parameters: {
      manager: import_zod.z.enum(["npm", "pip", "yarn", "pnpm"]).describe("Package manager to use"),
      action: import_zod.z.enum(["install", "uninstall", "list", "init"]).describe("Action to perform"),
      package_name: import_zod.z.string().optional().describe("Package name (not needed for list/init)")
    },
    implementation: async ({ manager, action, package_name }, { status, warn, signal }) => {
      const workspaceFolder = config.get("workspaceFolder");
      const folderPath = (0, import_path.join)(ctl.getWorkingDirectory(), workspaceFolder);
      let command;
      switch (manager) {
        case "npm":
          if (action === "install" && package_name) command = `npm install ${package_name}`;
          else if (action === "uninstall" && package_name) command = `npm uninstall ${package_name}`;
          else if (action === "list") command = "npm list";
          else if (action === "init") command = "npm init -y";
          else return "Error: Invalid npm action or missing package name";
          break;
        case "pip":
          if (action === "install" && package_name) command = `pip install ${package_name}`;
          else if (action === "uninstall" && package_name) command = `pip uninstall ${package_name} -y`;
          else if (action === "list") command = "pip list";
          else return "Error: pip init not supported";
          break;
        case "yarn":
          if (action === "install" && package_name) command = `yarn add ${package_name}`;
          else if (action === "uninstall" && package_name) command = `yarn remove ${package_name}`;
          else if (action === "list") command = "yarn list";
          else if (action === "init") command = "yarn init -y";
          else return "Error: Invalid yarn action or missing package name";
          break;
        case "pnpm":
          if (action === "install" && package_name) command = `pnpm add ${package_name}`;
          else if (action === "uninstall" && package_name) command = `pnpm remove ${package_name}`;
          else if (action === "list") command = "pnpm list";
          else if (action === "init") command = "pnpm init";
          else return "Error: Invalid pnpm action or missing package name";
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
          timeout: 6e4
          // 60 seconds for package operations
        });
        return `${manager} ${action} completed:

STDOUT:
${stdout}

STDERR:
${stderr}`;
      } catch (error) {
        return `Package manager error: ${error.message}`;
      }
    }
  });
  const projectStructureTool = (0, import_sdk2.tool)({
    name: "create_project_structure",
    description: import_sdk2.text`
      Create a complete project structure with common files and folders. Useful for initializing new projects.
    `,
    parameters: {
      project_type: import_zod.z.enum(["python", "javascript", "typescript", "react", "vue", "express"]).describe("Type of project to create"),
      project_name: import_zod.z.string().describe("Name of the project")
    },
    implementation: async ({ project_type, project_name }, { status }) => {
      const workspaceFolder = config.get("workspaceFolder");
      const folderPath = (0, import_path.join)(ctl.getWorkingDirectory(), workspaceFolder);
      const projectPath = (0, import_path.join)(folderPath, project_name);
      await (0, import_promises.mkdir)(projectPath, { recursive: true });
      status(`Creating ${project_type} project structure for ${project_name}`);
      try {
        switch (project_type) {
          case "python":
            await (0, import_promises.mkdir)((0, import_path.join)(projectPath, "src"), { recursive: true });
            await (0, import_promises.mkdir)((0, import_path.join)(projectPath, "tests"), { recursive: true });
            await (0, import_promises.writeFile)((0, import_path.join)(projectPath, "main.py"), "# Main application file\n\ndef main():\n    print('Hello, World!')\n\nif __name__ == '__main__':\n    main()\n", "utf-8");
            await (0, import_promises.writeFile)((0, import_path.join)(projectPath, "requirements.txt"), "# Add your Python dependencies here\n", "utf-8");
            await (0, import_promises.writeFile)((0, import_path.join)(projectPath, "README.md"), `# ${project_name}

A Python project.

## Installation

\`\`\`bash
pip install -r requirements.txt
\`\`\`

## Usage

\`\`\`bash
python main.py
\`\`\`
`, "utf-8");
            break;
          case "javascript":
          case "typescript":
            await (0, import_promises.mkdir)((0, import_path.join)(projectPath, "src"), { recursive: true });
            const ext = project_type === "typescript" ? "ts" : "js";
            await (0, import_promises.writeFile)((0, import_path.join)(projectPath, `src/index.${ext}`), "// Main application file\nconsole.log('Hello, World!');\n", "utf-8");
            await (0, import_promises.writeFile)((0, import_path.join)(projectPath, "package.json"), JSON.stringify({
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
              await (0, import_promises.writeFile)((0, import_path.join)(projectPath, "tsconfig.json"), JSON.stringify({
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
        await (0, import_promises.writeFile)((0, import_path.join)(projectPath, ".gitignore"), "node_modules/\n*.log\n.env\ndist/\n__pycache__/\n*.pyc\n", "utf-8");
        return `Successfully created ${project_type} project structure for "${project_name}" with:
- Source directory
- Main entry file
- Package/dependency file
- README.md
- .gitignore`;
      } catch (error) {
        return `Error creating project structure: ${error.message}`;
      }
    }
  });
  tools.push(createFileTool);
  tools.push(readFileTool);
  tools.push(listFilesTool);
  tools.push(executeCodeTool);
  tools.push(gitOperationTool);
  tools.push(packageManagerTool);
  tools.push(projectStructureTool);
  return tools;
}
var import_sdk2, import_zod, import_fs, import_promises, import_path, import_child_process, import_util, execAsync;
var init_toolsProvider = __esm({
  "src/toolsProvider.ts"() {
    "use strict";
    import_sdk2 = require("@lmstudio/sdk");
    import_zod = require("zod");
    import_fs = require("fs");
    import_promises = require("fs/promises");
    import_path = require("path");
    import_child_process = require("child_process");
    import_util = require("util");
    init_config();
    execAsync = (0, import_util.promisify)(import_child_process.exec);
  }
});

// src/index.ts
var src_exports = {};
__export(src_exports, {
  main: () => main
});
async function main(context) {
  context.withConfigSchematics(configSchematics);
  context.withGlobalConfigSchematics(globalConfigSchematics);
  context.withToolsProvider(toolsProvider);
  console.log("Qwen3 Coder Tools plugin loaded successfully!");
}
var init_src = __esm({
  "src/index.ts"() {
    "use strict";
    init_toolsProvider();
    init_config();
  }
});

// .lmstudio/entry.ts
var import_sdk3 = require("@lmstudio/sdk");
var clientIdentifier = process.env.LMS_PLUGIN_CLIENT_IDENTIFIER;
var clientPasskey = process.env.LMS_PLUGIN_CLIENT_PASSKEY;
var client = new import_sdk3.LMStudioClient({
  clientIdentifier,
  clientPasskey
});
globalThis.__LMS_PLUGIN_CONTEXT = true;
var predictionLoopHandlerSet = false;
var promptPreprocessorSet = false;
var configSchematicsSet = false;
var globalConfigSchematicsSet = false;
var toolsProviderSet = false;
var generatorSet = false;
var selfRegistrationHost = client.plugins.getSelfRegistrationHost();
var pluginContext = {
  withPredictionLoopHandler: (generate) => {
    if (predictionLoopHandlerSet) {
      throw new Error("PredictionLoopHandler already registered");
    }
    if (toolsProviderSet) {
      throw new Error("PredictionLoopHandler cannot be used with a tools provider");
    }
    predictionLoopHandlerSet = true;
    selfRegistrationHost.setPredictionLoopHandler(generate);
    return pluginContext;
  },
  withPromptPreprocessor: (preprocess) => {
    if (promptPreprocessorSet) {
      throw new Error("PromptPreprocessor already registered");
    }
    promptPreprocessorSet = true;
    selfRegistrationHost.setPromptPreprocessor(preprocess);
    return pluginContext;
  },
  withConfigSchematics: (configSchematics2) => {
    if (configSchematicsSet) {
      throw new Error("Config schematics already registered");
    }
    configSchematicsSet = true;
    selfRegistrationHost.setConfigSchematics(configSchematics2);
    return pluginContext;
  },
  withGlobalConfigSchematics: (globalConfigSchematics2) => {
    if (globalConfigSchematicsSet) {
      throw new Error("Global config schematics already registered");
    }
    globalConfigSchematicsSet = true;
    selfRegistrationHost.setGlobalConfigSchematics(globalConfigSchematics2);
    return pluginContext;
  },
  withToolsProvider: (toolsProvider2) => {
    if (toolsProviderSet) {
      throw new Error("Tools provider already registered");
    }
    if (predictionLoopHandlerSet) {
      throw new Error("Tools provider cannot be used with a predictionLoopHandler");
    }
    toolsProviderSet = true;
    selfRegistrationHost.setToolsProvider(toolsProvider2);
    return pluginContext;
  },
  withGenerator: (generator) => {
    if (generatorSet) {
      throw new Error("Generator already registered");
    }
    generatorSet = true;
    selfRegistrationHost.setGenerator(generator);
    return pluginContext;
  }
};
Promise.resolve().then(() => (init_src(), src_exports)).then(async (module2) => {
  return await module2.main(pluginContext);
}).then(() => {
  selfRegistrationHost.initCompleted();
}).catch((error) => {
  console.error("Failed to execute the main function of the plugin.");
  console.error(error);
});
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbmZpZy50cyIsICIuLi9zcmMvdG9vbHNQcm92aWRlci50cyIsICIuLi9zcmMvaW5kZXgudHMiLCAiZW50cnkudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIlx1RkVGRmltcG9ydCB7IGNyZWF0ZUNvbmZpZ1NjaGVtYXRpY3MgfSBmcm9tIFwiQGxtc3R1ZGlvL3Nka1wiO1xuXG5leHBvcnQgY29uc3QgY29uZmlnU2NoZW1hdGljcyA9IGNyZWF0ZUNvbmZpZ1NjaGVtYXRpY3MoKVxuICAuZmllbGQoXG4gICAgXCJ3b3Jrc3BhY2VGb2xkZXJcIixcbiAgICBcInN0cmluZ1wiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIldvcmtzcGFjZSBGb2xkZXJcIixcbiAgICAgIHN1YnRpdGxlOiBcIlRoZSBmb2xkZXIgd2hlcmUgZmlsZXMgd2lsbCBiZSBjcmVhdGVkIGFuZCBtYW5hZ2VkLlwiLFxuICAgIH0sXG4gICAgXCJxd2VuX3dvcmtzcGFjZVwiXG4gIClcbiAgLmZpZWxkKFxuICAgIFwibWF4RmlsZVNpemVcIixcbiAgICBcIm51bWVyaWNcIixcbiAgICB7XG4gICAgICBkaXNwbGF5TmFtZTogXCJNYXggRmlsZSBTaXplIChLQilcIixcbiAgICAgIHN1YnRpdGxlOiBcIk1heGltdW0gc2l6ZSBmb3IgZmlsZXMgdGhhdCBjYW4gYmUgcmVhZCBvciBjcmVhdGVkLlwiLFxuICAgIH0sXG4gICAgMTAyNFxuICApXG4gIC5maWVsZChcbiAgICBcImVuYWJsZVdlYlNlYXJjaFwiLFxuICAgIFwiYm9vbGVhblwiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIkVuYWJsZSBXZWIgU2VhcmNoXCIsXG4gICAgICBzdWJ0aXRsZTogXCJBbGxvdyB0aGUgbW9kZWwgdG8gc2VhcmNoIHRoZSB3ZWIgZm9yIGluZm9ybWF0aW9uLlwiLFxuICAgIH0sXG4gICAgZmFsc2VcbiAgKVxuICAuZmllbGQoXG4gICAgXCJicmF2ZUFwaUtleVwiLFxuICAgIFwic3RyaW5nXCIsXG4gICAge1xuICAgICAgZGlzcGxheU5hbWU6IFwiQnJhdmUgU2VhcmNoIEFQSSBLZXlcIixcbiAgICAgIHN1YnRpdGxlOiBcIkFQSSBrZXkgZm9yIEJyYXZlIFNlYXJjaCAob3B0aW9uYWwgLSBpbXByb3ZlcyBzZWFyY2ggcXVhbGl0eSBhbmQgcmF0ZSBsaW1pdHMpXCIsXG4gICAgICBwbGFjZWhvbGRlcjogXCJFbnRlciB5b3VyIEJyYXZlIEFQSSBrZXkgaGVyZS4uLlwiLFxuICAgIH0sXG4gICAgXCJcIlxuICApXG4gIC5idWlsZCgpO1xuXG5leHBvcnQgY29uc3QgZ2xvYmFsQ29uZmlnU2NoZW1hdGljcyA9IGNyZWF0ZUNvbmZpZ1NjaGVtYXRpY3MoKVxuICAuZmllbGQoXG4gICAgXCJkZWZhdWx0VGltZW91dFwiLFxuICAgIFwibnVtZXJpY1wiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIkRlZmF1bHQgVGltZW91dCAoc2Vjb25kcylcIixcbiAgICAgIHN1YnRpdGxlOiBcIkRlZmF1bHQgdGltZW91dCBmb3IgbG9uZy1ydW5uaW5nIG9wZXJhdGlvbnMuXCIsXG4gICAgfSxcbiAgICAzMFxuICApXG4gIC5idWlsZCgpO1xuIiwgIlx1RkVGRmltcG9ydCB7IHRleHQsIHRvb2wsIFRvb2wsIFRvb2xzUHJvdmlkZXJDb250cm9sbGVyIH0gZnJvbSBcIkBsbXN0dWRpby9zZGtcIjtcbmltcG9ydCB7IHogfSBmcm9tIFwiem9kXCI7XG5pbXBvcnQgeyBleGlzdHNTeW5jLCBzdGF0U3luYyB9IGZyb20gXCJmc1wiO1xuaW1wb3J0IHsgcmVhZEZpbGUsIHdyaXRlRmlsZSwgbWtkaXIsIHJlYWRkaXIgfSBmcm9tIFwiZnMvcHJvbWlzZXNcIjtcbmltcG9ydCB7IGpvaW4sIGV4dG5hbWUsIGJhc2VuYW1lIH0gZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGV4ZWMgfSBmcm9tIFwiY2hpbGRfcHJvY2Vzc1wiO1xuaW1wb3J0IHsgcHJvbWlzaWZ5IH0gZnJvbSBcInV0aWxcIjtcbmltcG9ydCB7IGNvbmZpZ1NjaGVtYXRpY3MgfSBmcm9tIFwiLi9jb25maWdcIjtcblxuY29uc3QgZXhlY0FzeW5jID0gcHJvbWlzaWZ5KGV4ZWMpO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdG9vbHNQcm92aWRlcihjdGw6IFRvb2xzUHJvdmlkZXJDb250cm9sbGVyKSB7XG4gIGNvbnN0IHRvb2xzOiBUb29sW10gPSBbXTtcbiAgXG4gIC8vIEdldCBjb25maWd1cmF0aW9uXG4gIGNvbnN0IGNvbmZpZyA9IGN0bC5nZXRQbHVnaW5Db25maWcoY29uZmlnU2NoZW1hdGljcyk7XG5cbiAgLy8gRmlsZSBNYW5hZ2VtZW50IFRvb2xzXG4gIGNvbnN0IGNyZWF0ZUZpbGVUb29sID0gdG9vbCh7XG4gICAgbmFtZTogXCJjcmVhdGVfZmlsZVwiLFxuICAgIGRlc2NyaXB0aW9uOiB0ZXh0YFxuICAgICAgQ3JlYXRlIGEgbmV3IGZpbGUgd2l0aCBzcGVjaWZpZWQgY29udGVudC4gVXNlZnVsIGZvciBjcmVhdGluZyBjb2RlIGZpbGVzLCBkb2N1bWVudGF0aW9uLCBvciBhbnkgdGV4dC1iYXNlZCBmaWxlcy5cbiAgICBgLFxuICAgIHBhcmFtZXRlcnM6IHsgXG4gICAgICBmaWxlX25hbWU6IHouc3RyaW5nKCkuZGVzY3JpYmUoXCJOYW1lIG9mIHRoZSBmaWxlIHRvIGNyZWF0ZVwiKSxcbiAgICAgIGNvbnRlbnQ6IHouc3RyaW5nKCkuZGVzY3JpYmUoXCJDb250ZW50IHRvIHdyaXRlIHRvIHRoZSBmaWxlXCIpXG4gICAgICAvLyBSZW1vdmVkIG92ZXJ3cml0ZSBwYXJhbWV0ZXIgdG8gYXZvaWQgUXdlbiBwYXJzaW5nIGlzc3Vlc1xuICAgIH0sXG4gICAgaW1wbGVtZW50YXRpb246IGFzeW5jICh7IGZpbGVfbmFtZSwgY29udGVudCB9LCB7IHN0YXR1cywgd2FybiB9KSA9PiB7XG4gICAgICBjb25zdCB3b3Jrc3BhY2VGb2xkZXIgPSBjb25maWcuZ2V0KFwid29ya3NwYWNlRm9sZGVyXCIpIGFzIHN0cmluZztcbiAgICAgIGNvbnN0IGZvbGRlclBhdGggPSBqb2luKGN0bC5nZXRXb3JraW5nRGlyZWN0b3J5KCksIHdvcmtzcGFjZUZvbGRlcik7XG4gICAgICBcbiAgICAgIGF3YWl0IG1rZGlyKGZvbGRlclBhdGgsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgY29uc3QgZmlsZVBhdGggPSBqb2luKGZvbGRlclBhdGgsIGZpbGVfbmFtZSk7XG4gICAgICBcbiAgICAgIC8vIEFsd2F5cyBhbGxvdyBvdmVyd3JpdGUgZm9yIHNpbXBsaWNpdHkgd2l0aCBRd2VuXG4gICAgICBjb25zdCBtYXhTaXplID0gKGNvbmZpZy5nZXQoXCJtYXhGaWxlU2l6ZVwiKSBhcyBudW1iZXIpICogMTAyNDtcbiAgICAgIGlmIChjb250ZW50Lmxlbmd0aCA+IG1heFNpemUpIHtcbiAgICAgICAgd2FybihgRmlsZSBjb250ZW50IGlzIGxhcmdlciB0aGFuICR7Y29uZmlnLmdldChcIm1heEZpbGVTaXplXCIpfUtCYCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHN0YXR1cyhgQ3JlYXRpbmcgZmlsZTogJHtmaWxlX25hbWV9YCk7XG4gICAgICBhd2FpdCB3cml0ZUZpbGUoZmlsZVBhdGgsIGNvbnRlbnQsIFwidXRmLThcIik7XG4gICAgICByZXR1cm4gYEZpbGUgJHtmaWxlX25hbWV9IGNyZWF0ZWQgc3VjY2Vzc2Z1bGx5IGluICR7d29ya3NwYWNlRm9sZGVyfS9gO1xuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnN0IHJlYWRGaWxlVG9vbCA9IHRvb2woe1xuICAgIG5hbWU6IFwicmVhZF9maWxlXCIsXG4gICAgZGVzY3JpcHRpb246IHRleHRgXG4gICAgICBSZWFkIHRoZSBjb250ZW50IG9mIGFuIGV4aXN0aW5nIGZpbGUuIFVzZWZ1bCBmb3IgZXhhbWluaW5nIGNvZGUsIGNvbmZpZ3VyYXRpb24gZmlsZXMsIG9yIGFueSB0ZXh0LWJhc2VkIGNvbnRlbnQuXG4gICAgYCxcbiAgICBwYXJhbWV0ZXJzOiB7IFxuICAgICAgZmlsZV9uYW1lOiB6LnN0cmluZygpLmRlc2NyaWJlKFwiTmFtZSBvZiB0aGUgZmlsZSB0byByZWFkXCIpXG4gICAgfSxcbiAgICBpbXBsZW1lbnRhdGlvbjogYXN5bmMgKHsgZmlsZV9uYW1lIH0sIHsgc3RhdHVzIH0pID0+IHtcbiAgICAgIGNvbnN0IHdvcmtzcGFjZUZvbGRlciA9IGNvbmZpZy5nZXQoXCJ3b3Jrc3BhY2VGb2xkZXJcIikgYXMgc3RyaW5nO1xuICAgICAgY29uc3QgZmlsZVBhdGggPSBqb2luKGN0bC5nZXRXb3JraW5nRGlyZWN0b3J5KCksIHdvcmtzcGFjZUZvbGRlciwgZmlsZV9uYW1lKTtcbiAgICAgIFxuICAgICAgaWYgKCFleGlzdHNTeW5jKGZpbGVQYXRoKSkge1xuICAgICAgICByZXR1cm4gYEVycm9yOiBGaWxlICR7ZmlsZV9uYW1lfSBkb2VzIG5vdCBleGlzdCBpbiAke3dvcmtzcGFjZUZvbGRlcn0vYDtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgY29uc3Qgc3RhdHMgPSBzdGF0U3luYyhmaWxlUGF0aCk7XG4gICAgICBjb25zdCBtYXhTaXplID0gKGNvbmZpZy5nZXQoXCJtYXhGaWxlU2l6ZVwiKSBhcyBudW1iZXIpICogMTAyNDtcbiAgICAgIFxuICAgICAgaWYgKHN0YXRzLnNpemUgPiBtYXhTaXplKSB7XG4gICAgICAgIHJldHVybiBgRXJyb3I6IEZpbGUgJHtmaWxlX25hbWV9IGlzIHRvbyBsYXJnZSAoJHtNYXRoLnJvdW5kKHN0YXRzLnNpemUvMTAyNCl9S0IgPiAke2NvbmZpZy5nZXQoXCJtYXhGaWxlU2l6ZVwiKX1LQilgO1xuICAgICAgfVxuICAgICAgXG4gICAgICBzdGF0dXMoYFJlYWRpbmcgZmlsZTogJHtmaWxlX25hbWV9YCk7XG4gICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgcmVhZEZpbGUoZmlsZVBhdGgsIFwidXRmLThcIik7XG4gICAgICByZXR1cm4gY29udGVudDtcbiAgICB9LFxuICB9KTtcblxuICBjb25zdCBsaXN0RmlsZXNUb29sID0gdG9vbCh7XG4gICAgbmFtZTogXCJsaXN0X2ZpbGVzXCIsXG4gICAgZGVzY3JpcHRpb246IHRleHRgXG4gICAgICBMaXN0IGZpbGVzIGluIHRoZSB3b3Jrc3BhY2UgZGlyZWN0b3J5LiBVc2VmdWwgZm9yIGV4cGxvcmluZyBwcm9qZWN0IHN0cnVjdHVyZS5cbiAgICBgLFxuICAgIHBhcmFtZXRlcnM6IHsgXG4gICAgICAvLyBSZW1vdmVkIG9wdGlvbmFsIHBhdGggcGFyYW1ldGVyIHRvIHNpbXBsaWZ5IGZvciBRd2VuXG4gICAgfSxcbiAgICBpbXBsZW1lbnRhdGlvbjogYXN5bmMgKHsgfSwgeyBzdGF0dXMgfSkgPT4ge1xuICAgICAgY29uc3Qgd29ya3NwYWNlRm9sZGVyID0gY29uZmlnLmdldChcIndvcmtzcGFjZUZvbGRlclwiKSBhcyBzdHJpbmc7XG4gICAgICBjb25zdCBiYXNlUGF0aCA9IGpvaW4oY3RsLmdldFdvcmtpbmdEaXJlY3RvcnkoKSwgd29ya3NwYWNlRm9sZGVyKTtcbiAgICAgIFxuICAgICAgaWYgKCFleGlzdHNTeW5jKGJhc2VQYXRoKSkge1xuICAgICAgICBhd2FpdCBta2RpcihiYXNlUGF0aCwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIHJldHVybiBcIldvcmtzcGFjZSBkaXJlY3RvcnkgY3JlYXRlZC4gTm8gZmlsZXMgeWV0LlwiO1xuICAgICAgfVxuICAgICAgXG4gICAgICBzdGF0dXMoYExpc3RpbmcgZmlsZXMgaW46ICR7d29ya3NwYWNlRm9sZGVyfWApO1xuICAgICAgY29uc3QgZmlsZXMgPSBhd2FpdCByZWFkZGlyKGJhc2VQYXRoLCB7IHdpdGhGaWxlVHlwZXM6IHRydWUgfSk7XG4gICAgICBcbiAgICAgIGNvbnN0IGZpbGVMaXN0ID0gZmlsZXMubWFwKGZpbGUgPT4ge1xuICAgICAgICBjb25zdCB0eXBlID0gZmlsZS5pc0RpcmVjdG9yeSgpID8gXCJESVJcIiA6IFwiRklMRVwiO1xuICAgICAgICBjb25zdCBleHQgPSBmaWxlLmlzRmlsZSgpID8gZXh0bmFtZShmaWxlLm5hbWUpIDogXCJcIjtcbiAgICAgICAgcmV0dXJuIGAke3R5cGV9OiAke2ZpbGUubmFtZX0ke2V4dCA/IGAgKCR7ZXh0fSlgIDogXCJcIn1gO1xuICAgICAgfSk7XG4gICAgICBcbiAgICAgIHJldHVybiBmaWxlTGlzdC5sZW5ndGggPiAwID8gZmlsZUxpc3Quam9pbihcIlxcblwiKSA6IFwiRGlyZWN0b3J5IGlzIGVtcHR5XCI7XG4gICAgfSxcbiAgfSk7XG5cbiAgLy8gQ29kZSBFeGVjdXRpb24gVG9vbHNcbiAgY29uc3QgZXhlY3V0ZUNvZGVUb29sID0gdG9vbCh7XG4gICAgbmFtZTogXCJleGVjdXRlX2NvZGVcIixcbiAgICBkZXNjcmlwdGlvbjogdGV4dGBcbiAgICAgIEV4ZWN1dGUgY29kZSBpbiB2YXJpb3VzIGxhbmd1YWdlcyAoUHl0aG9uLCBKYXZhU2NyaXB0LCBldGMuKS4gVXNlZnVsIGZvciB0ZXN0aW5nIGNvZGUgc25pcHBldHMgb3IgcnVubmluZyBzY3JpcHRzLlxuICAgIGAsXG4gICAgcGFyYW1ldGVyczoge1xuICAgICAgbGFuZ3VhZ2U6IHouZW51bShbXCJweXRob25cIiwgXCJqYXZhc2NyaXB0XCIsIFwiYmFzaFwiLCBcIm5vZGVcIl0pLmRlc2NyaWJlKFwiUHJvZ3JhbW1pbmcgbGFuZ3VhZ2UgdG8gZXhlY3V0ZVwiKSxcbiAgICAgIGNvZGU6IHouc3RyaW5nKCkuZGVzY3JpYmUoXCJDb2RlIHRvIGV4ZWN1dGVcIilcbiAgICAgIC8vIFJlbW92ZWQgc2F2ZV9vdXRwdXQgcGFyYW1ldGVyIHRvIHNpbXBsaWZ5IGZvciBRd2VuXG4gICAgfSxcbiAgICBpbXBsZW1lbnRhdGlvbjogYXN5bmMgKHsgbGFuZ3VhZ2UsIGNvZGUgfSwgeyBzdGF0dXMsIHdhcm4sIHNpZ25hbCB9KSA9PiB7XG4gICAgICBjb25zdCB3b3Jrc3BhY2VGb2xkZXIgPSBjb25maWcuZ2V0KFwid29ya3NwYWNlRm9sZGVyXCIpIGFzIHN0cmluZztcbiAgICAgIGNvbnN0IGZvbGRlclBhdGggPSBqb2luKGN0bC5nZXRXb3JraW5nRGlyZWN0b3J5KCksIHdvcmtzcGFjZUZvbGRlcik7XG4gICAgICBhd2FpdCBta2Rpcihmb2xkZXJQYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgIFxuICAgICAgY29uc3QgZmlsZUV4dCA9IGxhbmd1YWdlID09PSBcInB5dGhvblwiID8gXCJweVwiIDogbGFuZ3VhZ2UgPT09IFwiamF2YXNjcmlwdFwiIHx8IGxhbmd1YWdlID09PSBcIm5vZGVcIiA/IFwianNcIiA6IFwic2hcIjtcbiAgICAgIGNvbnN0IHRlbXBGaWxlID0gam9pbihmb2xkZXJQYXRoLCBgdGVtcF8ke0RhdGUubm93KCl9LiR7ZmlsZUV4dH1gKTtcbiAgICAgIFxuICAgICAgYXdhaXQgd3JpdGVGaWxlKHRlbXBGaWxlLCBjb2RlLCBcInV0Zi04XCIpO1xuICAgICAgXG4gICAgICBsZXQgY29tbWFuZDogc3RyaW5nO1xuICAgICAgc3dpdGNoIChsYW5ndWFnZSkge1xuICAgICAgICBjYXNlIFwicHl0aG9uXCI6XG4gICAgICAgICAgY29tbWFuZCA9IGBweXRob24gXCIke3RlbXBGaWxlfVwiYDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImphdmFzY3JpcHRcIjpcbiAgICAgICAgY2FzZSBcIm5vZGVcIjpcbiAgICAgICAgICBjb21tYW5kID0gYG5vZGUgXCIke3RlbXBGaWxlfVwiYDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImJhc2hcIjpcbiAgICAgICAgICBjb21tYW5kID0gYGJhc2ggXCIke3RlbXBGaWxlfVwiYDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gYEVycm9yOiBVbnN1cHBvcnRlZCBsYW5ndWFnZTogJHtsYW5ndWFnZX1gO1xuICAgICAgfVxuICAgICAgXG4gICAgICBzdGF0dXMoYEV4ZWN1dGluZyAke2xhbmd1YWdlfSBjb2RlLi4uYCk7XG4gICAgICB3YXJuKFwiQ29kZSBleGVjdXRpb24gY2FuIGJlIGRhbmdlcm91cy4gTWFrZSBzdXJlIHRoZSBjb2RlIGlzIHNhZmUuXCIpO1xuICAgICAgXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB7IHN0ZG91dCwgc3RkZXJyIH0gPSBhd2FpdCBleGVjQXN5bmMoY29tbWFuZCwgeyBcbiAgICAgICAgICBzaWduYWwsXG4gICAgICAgICAgY3dkOiBmb2xkZXJQYXRoLFxuICAgICAgICAgIHRpbWVvdXQ6IDMwMDAwICAvLyBVc2UgZml4ZWQgMzAgc2Vjb25kIHRpbWVvdXRcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICBjb25zdCBvdXRwdXQgPSBgU1RET1VUOlxcbiR7c3Rkb3V0fVxcblxcblNUREVSUjpcXG4ke3N0ZGVycn1gO1xuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICByZXR1cm4gYEV4ZWN1dGlvbiBlcnJvcjogJHtlcnJvci5tZXNzYWdlfWA7XG4gICAgICB9XG4gICAgfSxcbiAgfSk7XG5cbiAgLy8gR2l0IE9wZXJhdGlvbnMgVG9vbFxuICBjb25zdCBnaXRPcGVyYXRpb25Ub29sID0gdG9vbCh7XG4gICAgbmFtZTogXCJnaXRfb3BlcmF0aW9uXCIsXG4gICAgZGVzY3JpcHRpb246IFwiUGVyZm9ybSBiYXNpYyBHaXQgb3BlcmF0aW9ucyBpbiB0aGUgd29ya3NwYWNlLiBVc2VmdWwgZm9yIHZlcnNpb24gY29udHJvbCBvZiBjb2RlIHByb2plY3RzLlwiLFxuICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgIG9wZXJhdGlvbjogei5lbnVtKFtcImluaXRcIiwgXCJzdGF0dXNcIiwgXCJhZGRcIiwgXCJjb21taXRcIiwgXCJsb2dcIl0pLmRlc2NyaWJlKFwiR2l0IG9wZXJhdGlvbiB0byBwZXJmb3JtXCIpLFxuICAgICAgZmlsZXM6IHouc3RyaW5nKCkub3B0aW9uYWwoKS5kZXNjcmliZShcIkZpbGVzIHRvIGFkZCAoZm9yICdhZGQnIG9wZXJhdGlvbilcIiksXG4gICAgICBtZXNzYWdlOiB6LnN0cmluZygpLm9wdGlvbmFsKCkuZGVzY3JpYmUoXCJDb21taXQgbWVzc2FnZSAoZm9yICdjb21taXQnIG9wZXJhdGlvbilcIilcbiAgICB9LFxuICAgIGltcGxlbWVudGF0aW9uOiBhc3luYyAoeyBvcGVyYXRpb24sIGZpbGVzLCBtZXNzYWdlIH0sIHsgc3RhdHVzLCBzaWduYWwgfSkgPT4ge1xuICAgICAgY29uc3Qgd29ya3NwYWNlRm9sZGVyID0gY29uZmlnLmdldChcIndvcmtzcGFjZUZvbGRlclwiKSBhcyBzdHJpbmc7XG4gICAgICBjb25zdCBmb2xkZXJQYXRoID0gam9pbihjdGwuZ2V0V29ya2luZ0RpcmVjdG9yeSgpLCB3b3Jrc3BhY2VGb2xkZXIpO1xuICAgICAgXG4gICAgICBsZXQgY29tbWFuZDogc3RyaW5nO1xuICAgICAgc3dpdGNoIChvcGVyYXRpb24pIHtcbiAgICAgICAgY2FzZSBcImluaXRcIjpcbiAgICAgICAgICBjb21tYW5kID0gXCJnaXQgaW5pdFwiO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwic3RhdHVzXCI6XG4gICAgICAgICAgY29tbWFuZCA9IFwiZ2l0IHN0YXR1c1wiO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiYWRkXCI6XG4gICAgICAgICAgY29tbWFuZCA9IGBnaXQgYWRkICR7ZmlsZXMgPyBmaWxlcyA6IFwiLlwifWA7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJjb21taXRcIjpcbiAgICAgICAgICBpZiAoIW1lc3NhZ2UpIHJldHVybiBcIkVycm9yOiBDb21taXQgbWVzc2FnZSBpcyByZXF1aXJlZCBmb3IgY29tbWl0IG9wZXJhdGlvblwiO1xuICAgICAgICAgIGNvbW1hbmQgPSBgZ2l0IGNvbW1pdCAtbSBcIiR7bWVzc2FnZX1cImA7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJsb2dcIjpcbiAgICAgICAgICBjb21tYW5kID0gXCJnaXQgbG9nIC0tb25lbGluZSAtMTBcIjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gYEVycm9yOiBVbnN1cHBvcnRlZCBnaXQgb3BlcmF0aW9uOiAke29wZXJhdGlvbn1gO1xuICAgICAgfVxuICAgICAgXG4gICAgICBzdGF0dXMoYEV4ZWN1dGluZzogJHtjb21tYW5kfWApO1xuICAgICAgXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB7IHN0ZG91dCwgc3RkZXJyIH0gPSBhd2FpdCBleGVjQXN5bmMoY29tbWFuZCwgeyBcbiAgICAgICAgICBzaWduYWwsXG4gICAgICAgICAgY3dkOiBmb2xkZXJQYXRoLFxuICAgICAgICAgIHRpbWVvdXQ6IDEwMDAwIFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHN0ZG91dCA/IHN0ZG91dCA6IHN0ZGVycjtcbiAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgcmV0dXJuIGBHaXQgZXJyb3I6ICR7ZXJyb3IubWVzc2FnZX1gO1xuICAgICAgfVxuICAgIH0sXG4gIH0pO1xuXG4gIC8vIFdlYiBTZWFyY2ggVG9vbCAoY29uZGl0aW9uYWxseSBhZGRlZCBiYXNlZCBvbiBjb25maWcpXG4gIGNvbnN0IHdlYlNlYXJjaEVuYWJsZWQgPSBjb25maWcuZ2V0KFwiZW5hYmxlV2ViU2VhcmNoXCIpIGFzIGJvb2xlYW47XG4gIGlmICh3ZWJTZWFyY2hFbmFibGVkKSB7XG4gICAgY29uc3Qgd2ViU2VhcmNoVG9vbCA9IHRvb2woe1xuICAgICAgbmFtZTogXCJ3ZWJfc2VhcmNoXCIsXG4gICAgICBkZXNjcmlwdGlvbjogdGV4dGBcbiAgICAgICAgU2VhcmNoIHRoZSB3ZWIgZm9yIGN1cnJlbnQgaW5mb3JtYXRpb24sIG5ld3MsIGFuZCByZWFsLXRpbWUgZGF0YS4gVXNlcyBtdWx0aXBsZSBzZWFyY2ggZW5naW5lcyBmb3IgY29tcHJlaGVuc2l2ZSByZXN1bHRzLlxuICAgICAgYCxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgcXVlcnk6IHouc3RyaW5nKCkuZGVzY3JpYmUoXCJTZWFyY2ggcXVlcnkgdG8gZmluZCBpbmZvcm1hdGlvbiBhYm91dFwiKVxuICAgICAgfSxcbiAgICAgIGltcGxlbWVudGF0aW9uOiBhc3luYyAoeyBxdWVyeSB9LCB7IHN0YXR1cywgd2Fybiwgc2lnbmFsIH0pID0+IHtcbiAgICAgICAgc3RhdHVzKGBTZWFyY2hpbmcgdGhlIHdlYiBmb3I6ICR7cXVlcnl9YCk7XG4gICAgICAgIFxuICAgICAgICB0cnkge1xuICAgICAgICAgIC8vIEdldCBCcmF2ZSBBUEkga2V5IGZyb20gY29uZmlnXG4gICAgICAgICAgY29uc3QgYnJhdmVBcGlLZXkgPSBjb25maWcuZ2V0KFwiYnJhdmVBcGlLZXlcIikgYXMgc3RyaW5nO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIFRyeSBCcmF2ZSBTZWFyY2ggQVBJIGZpcnN0IChmcmVlIHRpZXI6IDUwMDAgcXVlcmllcy9tb250aCwgb3IgaGlnaGVyIGxpbWl0cyB3aXRoIEFQSSBrZXkpXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGJyYXZlVXJsID0gYGh0dHBzOi8vYXBpLnNlYXJjaC5icmF2ZS5jb20vcmVzL3YxL3dlYi9zZWFyY2g/cT0ke2VuY29kZVVSSUNvbXBvbmVudChxdWVyeSl9JmNvdW50PTNgO1xuICAgICAgICAgICAgY29uc3QgYnJhdmVIZWFkZXJzOiBIZWFkZXJzSW5pdCA9IHtcbiAgICAgICAgICAgICAgJ0FjY2VwdCc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgJ0FjY2VwdC1FbmNvZGluZyc6ICdnemlwJyxcbiAgICAgICAgICAgICAgJ1VzZXItQWdlbnQnOiAnTE1TdHVkaW8tUXdlblRvb2xzLzEuMCdcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEFkZCBBUEkga2V5IGlmIGF2YWlsYWJsZVxuICAgICAgICAgICAgaWYgKGJyYXZlQXBpS2V5ICYmIGJyYXZlQXBpS2V5LnRyaW0oKSkge1xuICAgICAgICAgICAgICBicmF2ZUhlYWRlcnNbJ1gtU3Vic2NyaXB0aW9uLVRva2VuJ10gPSBicmF2ZUFwaUtleS50cmltKCk7XG4gICAgICAgICAgICAgIHN0YXR1cyhgVXNpbmcgQnJhdmUgU2VhcmNoIHdpdGggQVBJIGtleSBmb3I6ICR7cXVlcnl9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzdGF0dXMoYFVzaW5nIEJyYXZlIFNlYXJjaCAoZnJlZSB0aWVyKSBmb3I6ICR7cXVlcnl9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnN0IGJyYXZlUmVzcG9uc2UgPSBhd2FpdCBmZXRjaChicmF2ZVVybCwge1xuICAgICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICAgICAgIGhlYWRlcnM6IGJyYXZlSGVhZGVyc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChicmF2ZVJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGJyYXZlRGF0YSA9IGF3YWl0IGJyYXZlUmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgICAgICBpZiAoYnJhdmVEYXRhLndlYiAmJiBicmF2ZURhdGEud2ViLnJlc3VsdHMgJiYgYnJhdmVEYXRhLndlYi5yZXN1bHRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHRzID0gYnJhdmVEYXRhLndlYi5yZXN1bHRzLnNsaWNlKDAsIDMpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1hdHRlZFJlc3VsdHMgPSByZXN1bHRzLm1hcCgocmVzdWx0OiBhbnksIGluZGV4OiBudW1iZXIpID0+IFxuICAgICAgICAgICAgICAgICAgYCR7aW5kZXggKyAxfS4gKioke3Jlc3VsdC50aXRsZX0qKlxcbiAgICR7cmVzdWx0LmRlc2NyaXB0aW9ufVxcbiAgIFNvdXJjZTogJHtyZXN1bHQudXJsfWBcbiAgICAgICAgICAgICAgICApLmpvaW4oJ1xcblxcbicpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBgV2ViIHNlYXJjaCByZXN1bHRzIGZvciBcIiR7cXVlcnl9XCIgKHZpYSBCcmF2ZSBTZWFyY2gpOlxcblxcbiR7Zm9ybWF0dGVkUmVzdWx0c31gO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGJyYXZlUmVzcG9uc2Uuc3RhdHVzID09PSA0MDEpIHtcbiAgICAgICAgICAgICAgd2FybihcIkJyYXZlIFNlYXJjaCBBUEkga2V5IGludmFsaWQgb3IgZXhwaXJlZFwiKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYnJhdmVSZXNwb25zZS5zdGF0dXMgPT09IDQyOSkge1xuICAgICAgICAgICAgICB3YXJuKFwiQnJhdmUgU2VhcmNoIHJhdGUgbGltaXQgZXhjZWVkZWQgLSBjb25zaWRlciB1cGdyYWRpbmcgeW91ciBBUEkgcGxhblwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoIChicmF2ZUVycm9yKSB7XG4gICAgICAgICAgICBpZiAoYnJhdmVBcGlLZXkgJiYgYnJhdmVBcGlLZXkudHJpbSgpKSB7XG4gICAgICAgICAgICAgIHdhcm4oXCJCcmF2ZSBTZWFyY2ggQVBJIHVuYXZhaWxhYmxlIChjaGVjayBBUEkga2V5KSwgdHJ5aW5nIGZhbGxiYWNrIG9wdGlvbnNcIik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB3YXJuKFwiQnJhdmUgU2VhcmNoIHVuYXZhaWxhYmxlIChubyBBUEkga2V5IHNldCksIHRyeWluZyBmYWxsYmFjayBvcHRpb25zXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICAvLyBGYWxsYmFjayB0byBEdWNrRHVja0dvIEluc3RhbnQgQW5zd2VyIEFQSVxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBkZGdVcmwgPSBgaHR0cHM6Ly9hcGkuZHVja2R1Y2tnby5jb20vP3E9JHtlbmNvZGVVUklDb21wb25lbnQocXVlcnkpfSZmb3JtYXQ9anNvbiZub19odG1sPTEmc2tpcF9kaXNhbWJpZz0xYDtcbiAgICAgICAgICAgIGNvbnN0IGRkZ1Jlc3BvbnNlID0gYXdhaXQgZmV0Y2goZGRnVXJsLCB7IFxuICAgICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ1VzZXItQWdlbnQnOiAnTE1TdHVkaW8tUXdlblRvb2xzLzEuMCcgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChkZGdSZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICBjb25zdCBkZGdEYXRhID0gYXdhaXQgZGRnUmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgaWYgKGRkZ0RhdGEuQWJzdHJhY3RUZXh0ICYmIGRkZ0RhdGEuQWJzdHJhY3RUZXh0Lmxlbmd0aCA+IDIwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBTZWFyY2ggcmVzdWx0cyBmb3IgXCIke3F1ZXJ5fVwiICh2aWEgRHVja0R1Y2tHbyk6XFxuXFxuJHtkZGdEYXRhLkFic3RyYWN0VGV4dH1cXG5cXG5Tb3VyY2U6ICR7ZGRnRGF0YS5BYnN0cmFjdFVSTCB8fCAnRHVja0R1Y2tHbyBLbm93bGVkZ2UgQmFzZSd9YDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgaWYgKGRkZ0RhdGEuUmVsYXRlZFRvcGljcyAmJiBkZGdEYXRhLlJlbGF0ZWRUb3BpY3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdHMgPSBkZGdEYXRhLlJlbGF0ZWRUb3BpY3Muc2xpY2UoMCwgMykubWFwKCh0b3BpYzogYW55LCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICBpZiAodG9waWMuVGV4dCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYCR7aW5kZXggKyAxfS4gJHt0b3BpYy5UZXh0fWA7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9KS5maWx0ZXIoQm9vbGVhbik7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGBTZWFyY2ggcmVzdWx0cyBmb3IgXCIke3F1ZXJ5fVwiICh2aWEgRHVja0R1Y2tHbyk6XFxuXFxuJHtyZXN1bHRzLmpvaW4oJ1xcblxcbicpfVxcblxcblNvdXJjZTogRHVja0R1Y2tHbyBLbm93bGVkZ2UgQmFzZWA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCAoZGRnRXJyb3IpIHtcbiAgICAgICAgICAgIHdhcm4oXCJEdWNrRHVja0dvIHVuYXZhaWxhYmxlLCB0cnlpbmcgV2lraXBlZGlhIGZhbGxiYWNrXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICAvLyBGaW5hbCBmYWxsYmFjayB0byBXaWtpcGVkaWFcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgd2lraVVybCA9IGBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvYXBpL3Jlc3RfdjEvcGFnZS9zdW1tYXJ5LyR7ZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5KX1gO1xuICAgICAgICAgICAgY29uc3Qgd2lraVJlc3BvbnNlID0gYXdhaXQgZmV0Y2god2lraVVybCwgeyBcbiAgICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdVc2VyLUFnZW50JzogJ0xNU3R1ZGlvLVF3ZW5Ub29scy8xLjAnIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAod2lraVJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHdpa2lEYXRhID0gYXdhaXQgd2lraVJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgICAgICAgaWYgKHdpa2lEYXRhLmV4dHJhY3QgJiYgd2lraURhdGEuZXh0cmFjdC5sZW5ndGggPiAyMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBgU2VhcmNoIHJlc3VsdHMgZm9yIFwiJHtxdWVyeX1cIiAoV2lraXBlZGlhIGZhbGxiYWNrKTpcXG5cXG4ke3dpa2lEYXRhLmV4dHJhY3R9XFxuXFxuU291cmNlOiAke3dpa2lEYXRhLmNvbnRlbnRfdXJscz8uZGVza3RvcD8ucGFnZSB8fCAnV2lraXBlZGlhJ31gO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIFdpa2lwZWRpYSBzZWFyY2ggaWYgc3VtbWFyeSBkb2Vzbid0IHdvcmtcbiAgICAgICAgICAgIGNvbnN0IHdpa2lTZWFyY2hVcmwgPSBgaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3cvYXBpLnBocD9hY3Rpb249cXVlcnkmbGlzdD1zZWFyY2gmc3JzZWFyY2g9JHtlbmNvZGVVUklDb21wb25lbnQocXVlcnkpfSZmb3JtYXQ9anNvbiZvcmlnaW49KmA7XG4gICAgICAgICAgICBjb25zdCBzZWFyY2hSZXNwb25zZSA9IGF3YWl0IGZldGNoKHdpa2lTZWFyY2hVcmwsIHsgXG4gICAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgICAgICAgaGVhZGVyczogeyAnVXNlci1BZ2VudCc6ICdMTVN0dWRpby1Rd2VuVG9vbHMvMS4wJyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHNlYXJjaFJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHNlYXJjaERhdGEgPSBhd2FpdCBzZWFyY2hSZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgICAgIGlmIChzZWFyY2hEYXRhLnF1ZXJ5Py5zZWFyY2g/Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHRzID0gc2VhcmNoRGF0YS5xdWVyeS5zZWFyY2guc2xpY2UoMCwgMykubWFwKChyZXN1bHQ6IGFueSwgaW5kZXg6IG51bWJlcikgPT4gXG4gICAgICAgICAgICAgICAgICBgJHtpbmRleCArIDF9LiAke3Jlc3VsdC50aXRsZX1cXG4gICAke3Jlc3VsdC5zbmlwcGV0LnJlcGxhY2UoLzxbXj5dKj4vZywgJycpfVxcbiAgIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpLyR7ZW5jb2RlVVJJQ29tcG9uZW50KHJlc3VsdC50aXRsZS5yZXBsYWNlKC8gL2csICdfJykpfWBcbiAgICAgICAgICAgICAgICApLmpvaW4oJ1xcblxcbicpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBgU2VhcmNoIHJlc3VsdHMgZm9yIFwiJHtxdWVyeX1cIiAoV2lraXBlZGlhIHNlYXJjaCk6XFxuXFxuJHtyZXN1bHRzfWA7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoICh3aWtpRXJyb3IpIHtcbiAgICAgICAgICAgIHdhcm4oXCJBbGwgc2VhcmNoIHNlcnZpY2VzIHVuYXZhaWxhYmxlXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICByZXR1cm4gYE5vIHNlYXJjaCByZXN1bHRzIGZvdW5kIGZvciBcIiR7cXVlcnl9XCIuIEFsbCBzZWFyY2ggc2VydmljZXMgYXBwZWFyIHRvIGJlIHVuYXZhaWxhYmxlLiBQbGVhc2UgdHJ5Olxcbi0gQ2hlY2tpbmcgeW91ciBpbnRlcm5ldCBjb25uZWN0aW9uXFxuLSBVc2luZyBtb3JlIHNwZWNpZmljIHNlYXJjaCB0ZXJtc1xcbi0gVHJ5aW5nIGFnYWluIGxhdGVyYDtcbiAgICAgICAgICBcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgIGlmIChlcnJvci5uYW1lID09PSAnQWJvcnRFcnJvcicpIHtcbiAgICAgICAgICAgIHJldHVybiAnV2ViIHNlYXJjaCB3YXMgY2FuY2VsbGVkJztcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGBXZWIgc2VhcmNoIGZhaWxlZDogJHtlcnJvci5tZXNzYWdlfS4gUGxlYXNlIGNoZWNrIHlvdXIgaW50ZXJuZXQgY29ubmVjdGlvbiBhbmQgdHJ5IGFnYWluLmA7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSk7XG4gICAgXG4gICAgdG9vbHMucHVzaCh3ZWJTZWFyY2hUb29sKTtcbiAgfVxuXG4gIC8vIFBhY2thZ2UgTWFuYWdlbWVudCBUb29sXG4gIGNvbnN0IHBhY2thZ2VNYW5hZ2VyVG9vbCA9IHRvb2woe1xuICAgIG5hbWU6IFwicGFja2FnZV9tYW5hZ2VyXCIsXG4gICAgZGVzY3JpcHRpb246IHRleHRgXG4gICAgICBJbnN0YWxsIHBhY2thZ2VzIHVzaW5nIG5wbSwgcGlwLCBvciBvdGhlciBwYWNrYWdlIG1hbmFnZXJzLiBVc2VmdWwgZm9yIHNldHRpbmcgdXAgcHJvamVjdCBkZXBlbmRlbmNpZXMuXG4gICAgYCxcbiAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICBtYW5hZ2VyOiB6LmVudW0oW1wibnBtXCIsIFwicGlwXCIsIFwieWFyblwiLCBcInBucG1cIl0pLmRlc2NyaWJlKFwiUGFja2FnZSBtYW5hZ2VyIHRvIHVzZVwiKSxcbiAgICAgIGFjdGlvbjogei5lbnVtKFtcImluc3RhbGxcIiwgXCJ1bmluc3RhbGxcIiwgXCJsaXN0XCIsIFwiaW5pdFwiXSkuZGVzY3JpYmUoXCJBY3Rpb24gdG8gcGVyZm9ybVwiKSxcbiAgICAgIHBhY2thZ2VfbmFtZTogei5zdHJpbmcoKS5vcHRpb25hbCgpLmRlc2NyaWJlKFwiUGFja2FnZSBuYW1lIChub3QgbmVlZGVkIGZvciBsaXN0L2luaXQpXCIpXG4gICAgfSxcbiAgICBpbXBsZW1lbnRhdGlvbjogYXN5bmMgKHsgbWFuYWdlciwgYWN0aW9uLCBwYWNrYWdlX25hbWUgfSwgeyBzdGF0dXMsIHdhcm4sIHNpZ25hbCB9KSA9PiB7XG4gICAgICBjb25zdCB3b3Jrc3BhY2VGb2xkZXIgPSBjb25maWcuZ2V0KFwid29ya3NwYWNlRm9sZGVyXCIpIGFzIHN0cmluZztcbiAgICAgIGNvbnN0IGZvbGRlclBhdGggPSBqb2luKGN0bC5nZXRXb3JraW5nRGlyZWN0b3J5KCksIHdvcmtzcGFjZUZvbGRlcik7XG4gICAgICBcbiAgICAgIGxldCBjb21tYW5kOiBzdHJpbmc7XG4gICAgICBzd2l0Y2ggKG1hbmFnZXIpIHtcbiAgICAgICAgY2FzZSBcIm5wbVwiOlxuICAgICAgICAgIGlmIChhY3Rpb24gPT09IFwiaW5zdGFsbFwiICYmIHBhY2thZ2VfbmFtZSkgY29tbWFuZCA9IGBucG0gaW5zdGFsbCAke3BhY2thZ2VfbmFtZX1gO1xuICAgICAgICAgIGVsc2UgaWYgKGFjdGlvbiA9PT0gXCJ1bmluc3RhbGxcIiAmJiBwYWNrYWdlX25hbWUpIGNvbW1hbmQgPSBgbnBtIHVuaW5zdGFsbCAke3BhY2thZ2VfbmFtZX1gO1xuICAgICAgICAgIGVsc2UgaWYgKGFjdGlvbiA9PT0gXCJsaXN0XCIpIGNvbW1hbmQgPSBcIm5wbSBsaXN0XCI7XG4gICAgICAgICAgZWxzZSBpZiAoYWN0aW9uID09PSBcImluaXRcIikgY29tbWFuZCA9IFwibnBtIGluaXQgLXlcIjtcbiAgICAgICAgICBlbHNlIHJldHVybiBcIkVycm9yOiBJbnZhbGlkIG5wbSBhY3Rpb24gb3IgbWlzc2luZyBwYWNrYWdlIG5hbWVcIjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInBpcFwiOlxuICAgICAgICAgIGlmIChhY3Rpb24gPT09IFwiaW5zdGFsbFwiICYmIHBhY2thZ2VfbmFtZSkgY29tbWFuZCA9IGBwaXAgaW5zdGFsbCAke3BhY2thZ2VfbmFtZX1gO1xuICAgICAgICAgIGVsc2UgaWYgKGFjdGlvbiA9PT0gXCJ1bmluc3RhbGxcIiAmJiBwYWNrYWdlX25hbWUpIGNvbW1hbmQgPSBgcGlwIHVuaW5zdGFsbCAke3BhY2thZ2VfbmFtZX0gLXlgO1xuICAgICAgICAgIGVsc2UgaWYgKGFjdGlvbiA9PT0gXCJsaXN0XCIpIGNvbW1hbmQgPSBcInBpcCBsaXN0XCI7XG4gICAgICAgICAgZWxzZSByZXR1cm4gXCJFcnJvcjogcGlwIGluaXQgbm90IHN1cHBvcnRlZFwiO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwieWFyblwiOlxuICAgICAgICAgIGlmIChhY3Rpb24gPT09IFwiaW5zdGFsbFwiICYmIHBhY2thZ2VfbmFtZSkgY29tbWFuZCA9IGB5YXJuIGFkZCAke3BhY2thZ2VfbmFtZX1gO1xuICAgICAgICAgIGVsc2UgaWYgKGFjdGlvbiA9PT0gXCJ1bmluc3RhbGxcIiAmJiBwYWNrYWdlX25hbWUpIGNvbW1hbmQgPSBgeWFybiByZW1vdmUgJHtwYWNrYWdlX25hbWV9YDtcbiAgICAgICAgICBlbHNlIGlmIChhY3Rpb24gPT09IFwibGlzdFwiKSBjb21tYW5kID0gXCJ5YXJuIGxpc3RcIjtcbiAgICAgICAgICBlbHNlIGlmIChhY3Rpb24gPT09IFwiaW5pdFwiKSBjb21tYW5kID0gXCJ5YXJuIGluaXQgLXlcIjtcbiAgICAgICAgICBlbHNlIHJldHVybiBcIkVycm9yOiBJbnZhbGlkIHlhcm4gYWN0aW9uIG9yIG1pc3NpbmcgcGFja2FnZSBuYW1lXCI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJwbnBtXCI6XG4gICAgICAgICAgaWYgKGFjdGlvbiA9PT0gXCJpbnN0YWxsXCIgJiYgcGFja2FnZV9uYW1lKSBjb21tYW5kID0gYHBucG0gYWRkICR7cGFja2FnZV9uYW1lfWA7XG4gICAgICAgICAgZWxzZSBpZiAoYWN0aW9uID09PSBcInVuaW5zdGFsbFwiICYmIHBhY2thZ2VfbmFtZSkgY29tbWFuZCA9IGBwbnBtIHJlbW92ZSAke3BhY2thZ2VfbmFtZX1gO1xuICAgICAgICAgIGVsc2UgaWYgKGFjdGlvbiA9PT0gXCJsaXN0XCIpIGNvbW1hbmQgPSBcInBucG0gbGlzdFwiO1xuICAgICAgICAgIGVsc2UgaWYgKGFjdGlvbiA9PT0gXCJpbml0XCIpIGNvbW1hbmQgPSBcInBucG0gaW5pdFwiO1xuICAgICAgICAgIGVsc2UgcmV0dXJuIFwiRXJyb3I6IEludmFsaWQgcG5wbSBhY3Rpb24gb3IgbWlzc2luZyBwYWNrYWdlIG5hbWVcIjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gYEVycm9yOiBVbnN1cHBvcnRlZCBwYWNrYWdlIG1hbmFnZXI6ICR7bWFuYWdlcn1gO1xuICAgICAgfVxuICAgICAgXG4gICAgICBzdGF0dXMoYFJ1bm5pbmc6ICR7Y29tbWFuZH1gKTtcbiAgICAgIHdhcm4oXCJQYWNrYWdlIGluc3RhbGxhdGlvbiBjYW4gbW9kaWZ5IHlvdXIgc3lzdGVtLiBNYWtlIHN1cmUgeW91IHRydXN0IHRoZSBwYWNrYWdlcy5cIik7XG4gICAgICBcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHsgc3Rkb3V0LCBzdGRlcnIgfSA9IGF3YWl0IGV4ZWNBc3luYyhjb21tYW5kLCB7IFxuICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgICBjd2Q6IGZvbGRlclBhdGgsXG4gICAgICAgICAgdGltZW91dDogNjAwMDAgIC8vIDYwIHNlY29uZHMgZm9yIHBhY2thZ2Ugb3BlcmF0aW9uc1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGAke21hbmFnZXJ9ICR7YWN0aW9ufSBjb21wbGV0ZWQ6XFxuXFxuU1RET1VUOlxcbiR7c3Rkb3V0fVxcblxcblNUREVSUjpcXG4ke3N0ZGVycn1gO1xuICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICByZXR1cm4gYFBhY2thZ2UgbWFuYWdlciBlcnJvcjogJHtlcnJvci5tZXNzYWdlfWA7XG4gICAgICB9XG4gICAgfSxcbiAgfSk7XG5cbiAgLy8gUHJvamVjdCBTdHJ1Y3R1cmUgVG9vbFxuICBjb25zdCBwcm9qZWN0U3RydWN0dXJlVG9vbCA9IHRvb2woe1xuICAgIG5hbWU6IFwiY3JlYXRlX3Byb2plY3Rfc3RydWN0dXJlXCIsXG4gICAgZGVzY3JpcHRpb246IHRleHRgXG4gICAgICBDcmVhdGUgYSBjb21wbGV0ZSBwcm9qZWN0IHN0cnVjdHVyZSB3aXRoIGNvbW1vbiBmaWxlcyBhbmQgZm9sZGVycy4gVXNlZnVsIGZvciBpbml0aWFsaXppbmcgbmV3IHByb2plY3RzLlxuICAgIGAsXG4gICAgcGFyYW1ldGVyczoge1xuICAgICAgcHJvamVjdF90eXBlOiB6LmVudW0oW1wicHl0aG9uXCIsIFwiamF2YXNjcmlwdFwiLCBcInR5cGVzY3JpcHRcIiwgXCJyZWFjdFwiLCBcInZ1ZVwiLCBcImV4cHJlc3NcIl0pLmRlc2NyaWJlKFwiVHlwZSBvZiBwcm9qZWN0IHRvIGNyZWF0ZVwiKSxcbiAgICAgIHByb2plY3RfbmFtZTogei5zdHJpbmcoKS5kZXNjcmliZShcIk5hbWUgb2YgdGhlIHByb2plY3RcIilcbiAgICB9LFxuICAgIGltcGxlbWVudGF0aW9uOiBhc3luYyAoeyBwcm9qZWN0X3R5cGUsIHByb2plY3RfbmFtZSB9LCB7IHN0YXR1cyB9KSA9PiB7XG4gICAgICBjb25zdCB3b3Jrc3BhY2VGb2xkZXIgPSBjb25maWcuZ2V0KFwid29ya3NwYWNlRm9sZGVyXCIpIGFzIHN0cmluZztcbiAgICAgIGNvbnN0IGZvbGRlclBhdGggPSBqb2luKGN0bC5nZXRXb3JraW5nRGlyZWN0b3J5KCksIHdvcmtzcGFjZUZvbGRlcik7XG4gICAgICBjb25zdCBwcm9qZWN0UGF0aCA9IGpvaW4oZm9sZGVyUGF0aCwgcHJvamVjdF9uYW1lKTtcbiAgICAgIFxuICAgICAgYXdhaXQgbWtkaXIocHJvamVjdFBhdGgsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgXG4gICAgICBzdGF0dXMoYENyZWF0aW5nICR7cHJvamVjdF90eXBlfSBwcm9qZWN0IHN0cnVjdHVyZSBmb3IgJHtwcm9qZWN0X25hbWV9YCk7XG4gICAgICBcbiAgICAgIHRyeSB7XG4gICAgICAgIHN3aXRjaCAocHJvamVjdF90eXBlKSB7XG4gICAgICAgICAgY2FzZSBcInB5dGhvblwiOlxuICAgICAgICAgICAgYXdhaXQgbWtkaXIoam9pbihwcm9qZWN0UGF0aCwgXCJzcmNcIiksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICAgICAgYXdhaXQgbWtkaXIoam9pbihwcm9qZWN0UGF0aCwgXCJ0ZXN0c1wiKSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgICAgICBhd2FpdCB3cml0ZUZpbGUoam9pbihwcm9qZWN0UGF0aCwgXCJtYWluLnB5XCIpLCBcIiMgTWFpbiBhcHBsaWNhdGlvbiBmaWxlXFxuXFxuZGVmIG1haW4oKTpcXG4gICAgcHJpbnQoJ0hlbGxvLCBXb3JsZCEnKVxcblxcbmlmIF9fbmFtZV9fID09ICdfX21haW5fXyc6XFxuICAgIG1haW4oKVxcblwiLCBcInV0Zi04XCIpO1xuICAgICAgICAgICAgYXdhaXQgd3JpdGVGaWxlKGpvaW4ocHJvamVjdFBhdGgsIFwicmVxdWlyZW1lbnRzLnR4dFwiKSwgXCIjIEFkZCB5b3VyIFB5dGhvbiBkZXBlbmRlbmNpZXMgaGVyZVxcblwiLCBcInV0Zi04XCIpO1xuICAgICAgICAgICAgYXdhaXQgd3JpdGVGaWxlKGpvaW4ocHJvamVjdFBhdGgsIFwiUkVBRE1FLm1kXCIpLCBgIyAke3Byb2plY3RfbmFtZX1cXG5cXG5BIFB5dGhvbiBwcm9qZWN0LlxcblxcbiMjIEluc3RhbGxhdGlvblxcblxcblxcYFxcYFxcYGJhc2hcXG5waXAgaW5zdGFsbCAtciByZXF1aXJlbWVudHMudHh0XFxuXFxgXFxgXFxgXFxuXFxuIyMgVXNhZ2VcXG5cXG5cXGBcXGBcXGBiYXNoXFxucHl0aG9uIG1haW4ucHlcXG5cXGBcXGBcXGBcXG5gLCBcInV0Zi04XCIpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBcbiAgICAgICAgICBjYXNlIFwiamF2YXNjcmlwdFwiOlxuICAgICAgICAgIGNhc2UgXCJ0eXBlc2NyaXB0XCI6XG4gICAgICAgICAgICBhd2FpdCBta2Rpcihqb2luKHByb2plY3RQYXRoLCBcInNyY1wiKSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgICAgICBjb25zdCBleHQgPSBwcm9qZWN0X3R5cGUgPT09IFwidHlwZXNjcmlwdFwiID8gXCJ0c1wiIDogXCJqc1wiO1xuICAgICAgICAgICAgYXdhaXQgd3JpdGVGaWxlKGpvaW4ocHJvamVjdFBhdGgsIGBzcmMvaW5kZXguJHtleHR9YCksIFwiLy8gTWFpbiBhcHBsaWNhdGlvbiBmaWxlXFxuY29uc29sZS5sb2coJ0hlbGxvLCBXb3JsZCEnKTtcXG5cIiwgXCJ1dGYtOFwiKTtcbiAgICAgICAgICAgIGF3YWl0IHdyaXRlRmlsZShqb2luKHByb2plY3RQYXRoLCBcInBhY2thZ2UuanNvblwiKSwgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICBuYW1lOiBwcm9qZWN0X25hbWUsXG4gICAgICAgICAgICAgIHZlcnNpb246IFwiMS4wLjBcIixcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGBBICR7cHJvamVjdF90eXBlfSBwcm9qZWN0YCxcbiAgICAgICAgICAgICAgbWFpbjogYHNyYy9pbmRleC4ke2V4dH1gLFxuICAgICAgICAgICAgICBzY3JpcHRzOiB7XG4gICAgICAgICAgICAgICAgc3RhcnQ6IGBub2RlIHNyYy9pbmRleC4ke2V4dH1gLFxuICAgICAgICAgICAgICAgIGRldjogYG5vZGUgc3JjL2luZGV4LiR7ZXh0fWBcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgbnVsbCwgMiksIFwidXRmLThcIik7XG4gICAgICAgICAgICBpZiAocHJvamVjdF90eXBlID09PSBcInR5cGVzY3JpcHRcIikge1xuICAgICAgICAgICAgICBhd2FpdCB3cml0ZUZpbGUoam9pbihwcm9qZWN0UGF0aCwgXCJ0c2NvbmZpZy5qc29uXCIpLCBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgY29tcGlsZXJPcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgICB0YXJnZXQ6IFwiRVMyMDIwXCIsXG4gICAgICAgICAgICAgICAgICBtb2R1bGU6IFwiY29tbW9uanNcIixcbiAgICAgICAgICAgICAgICAgIG91dERpcjogXCIuL2Rpc3RcIixcbiAgICAgICAgICAgICAgICAgIHN0cmljdDogdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSwgbnVsbCwgMiksIFwidXRmLThcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIFxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gYFByb2plY3QgdHlwZSAke3Byb2plY3RfdHlwZX0gc3RydWN0dXJlIG5vdCB5ZXQgaW1wbGVtZW50ZWRgO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBhd2FpdCB3cml0ZUZpbGUoam9pbihwcm9qZWN0UGF0aCwgXCIuZ2l0aWdub3JlXCIpLCBcIm5vZGVfbW9kdWxlcy9cXG4qLmxvZ1xcbi5lbnZcXG5kaXN0L1xcbl9fcHljYWNoZV9fL1xcbioucHljXFxuXCIsIFwidXRmLThcIik7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gYFN1Y2Nlc3NmdWxseSBjcmVhdGVkICR7cHJvamVjdF90eXBlfSBwcm9qZWN0IHN0cnVjdHVyZSBmb3IgXCIke3Byb2plY3RfbmFtZX1cIiB3aXRoOlxcbi0gU291cmNlIGRpcmVjdG9yeVxcbi0gTWFpbiBlbnRyeSBmaWxlXFxuLSBQYWNrYWdlL2RlcGVuZGVuY3kgZmlsZVxcbi0gUkVBRE1FLm1kXFxuLSAuZ2l0aWdub3JlYDtcbiAgICAgICAgXG4gICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgIHJldHVybiBgRXJyb3IgY3JlYXRpbmcgcHJvamVjdCBzdHJ1Y3R1cmU6ICR7ZXJyb3IubWVzc2FnZX1gO1xuICAgICAgfVxuICAgIH0sXG4gIH0pO1xuXG4gIC8vIEFkZCBhbGwgdG9vbHMgdG8gdGhlIGFycmF5XG4gIHRvb2xzLnB1c2goY3JlYXRlRmlsZVRvb2wpO1xuICB0b29scy5wdXNoKHJlYWRGaWxlVG9vbCk7XG4gIHRvb2xzLnB1c2gobGlzdEZpbGVzVG9vbCk7XG4gIHRvb2xzLnB1c2goZXhlY3V0ZUNvZGVUb29sKTtcbiAgdG9vbHMucHVzaChnaXRPcGVyYXRpb25Ub29sKTtcbiAgdG9vbHMucHVzaChwYWNrYWdlTWFuYWdlclRvb2wpO1xuICB0b29scy5wdXNoKHByb2plY3RTdHJ1Y3R1cmVUb29sKTtcblxuICByZXR1cm4gdG9vbHM7XG59XG4iLCAiXHVGRUZGaW1wb3J0IHsgUGx1Z2luQ29udGV4dCB9IGZyb20gXCJAbG1zdHVkaW8vc2RrXCI7XG5pbXBvcnQgeyB0b29sc1Byb3ZpZGVyIH0gZnJvbSBcIi4vdG9vbHNQcm92aWRlclwiO1xuaW1wb3J0IHsgY29uZmlnU2NoZW1hdGljcywgZ2xvYmFsQ29uZmlnU2NoZW1hdGljcyB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWFpbihjb250ZXh0OiBQbHVnaW5Db250ZXh0KSB7XG4gIC8vIFJlZ2lzdGVyIGNvbmZpZ3VyYXRpb24gc2NoZW1hc1xuICBjb250ZXh0LndpdGhDb25maWdTY2hlbWF0aWNzKGNvbmZpZ1NjaGVtYXRpY3MpO1xuICBjb250ZXh0LndpdGhHbG9iYWxDb25maWdTY2hlbWF0aWNzKGdsb2JhbENvbmZpZ1NjaGVtYXRpY3MpO1xuXG4gIC8vIFJlZ2lzdGVyIHRoZSB0b29scyBwcm92aWRlclxuICBjb250ZXh0LndpdGhUb29sc1Byb3ZpZGVyKHRvb2xzUHJvdmlkZXIpO1xuXG4gIGNvbnNvbGUubG9nKFwiUXdlbjMgQ29kZXIgVG9vbHMgcGx1Z2luIGxvYWRlZCBzdWNjZXNzZnVsbHkhXCIpO1xufVxyXG4iLCAiaW1wb3J0IHsgTE1TdHVkaW9DbGllbnQsIHR5cGUgUGx1Z2luQ29udGV4dCB9IGZyb20gXCJAbG1zdHVkaW8vc2RrXCI7XG5cbmRlY2xhcmUgdmFyIHByb2Nlc3M6IGFueTtcblxuLy8gV2UgcmVjZWl2ZSBydW50aW1lIGluZm9ybWF0aW9uIGluIHRoZSBlbnZpcm9ubWVudCB2YXJpYWJsZXMuXG5jb25zdCBjbGllbnRJZGVudGlmaWVyID0gcHJvY2Vzcy5lbnYuTE1TX1BMVUdJTl9DTElFTlRfSURFTlRJRklFUjtcbmNvbnN0IGNsaWVudFBhc3NrZXkgPSBwcm9jZXNzLmVudi5MTVNfUExVR0lOX0NMSUVOVF9QQVNTS0VZO1xuXG5jb25zdCBjbGllbnQgPSBuZXcgTE1TdHVkaW9DbGllbnQoe1xuICBjbGllbnRJZGVudGlmaWVyLFxuICBjbGllbnRQYXNza2V5LFxufSk7XG5cbihnbG9iYWxUaGlzIGFzIGFueSkuX19MTVNfUExVR0lOX0NPTlRFWFQgPSB0cnVlO1xuXG5sZXQgcHJlZGljdGlvbkxvb3BIYW5kbGVyU2V0ID0gZmFsc2U7XG5sZXQgcHJvbXB0UHJlcHJvY2Vzc29yU2V0ID0gZmFsc2U7XG5sZXQgY29uZmlnU2NoZW1hdGljc1NldCA9IGZhbHNlO1xubGV0IGdsb2JhbENvbmZpZ1NjaGVtYXRpY3NTZXQgPSBmYWxzZTtcbmxldCB0b29sc1Byb3ZpZGVyU2V0ID0gZmFsc2U7XG5sZXQgZ2VuZXJhdG9yU2V0ID0gZmFsc2U7XG5cbmNvbnN0IHNlbGZSZWdpc3RyYXRpb25Ib3N0ID0gY2xpZW50LnBsdWdpbnMuZ2V0U2VsZlJlZ2lzdHJhdGlvbkhvc3QoKTtcblxuY29uc3QgcGx1Z2luQ29udGV4dDogUGx1Z2luQ29udGV4dCA9IHtcbiAgd2l0aFByZWRpY3Rpb25Mb29wSGFuZGxlcjogKGdlbmVyYXRlKSA9PiB7XG4gICAgaWYgKHByZWRpY3Rpb25Mb29wSGFuZGxlclNldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUHJlZGljdGlvbkxvb3BIYW5kbGVyIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG4gICAgaWYgKHRvb2xzUHJvdmlkZXJTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlByZWRpY3Rpb25Mb29wSGFuZGxlciBjYW5ub3QgYmUgdXNlZCB3aXRoIGEgdG9vbHMgcHJvdmlkZXJcIik7XG4gICAgfVxuXG4gICAgcHJlZGljdGlvbkxvb3BIYW5kbGVyU2V0ID0gdHJ1ZTtcbiAgICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5zZXRQcmVkaWN0aW9uTG9vcEhhbmRsZXIoZ2VuZXJhdGUpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxuICB3aXRoUHJvbXB0UHJlcHJvY2Vzc29yOiAocHJlcHJvY2VzcykgPT4ge1xuICAgIGlmIChwcm9tcHRQcmVwcm9jZXNzb3JTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlByb21wdFByZXByb2Nlc3NvciBhbHJlYWR5IHJlZ2lzdGVyZWRcIik7XG4gICAgfVxuICAgIHByb21wdFByZXByb2Nlc3NvclNldCA9IHRydWU7XG4gICAgc2VsZlJlZ2lzdHJhdGlvbkhvc3Quc2V0UHJvbXB0UHJlcHJvY2Vzc29yKHByZXByb2Nlc3MpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxuICB3aXRoQ29uZmlnU2NoZW1hdGljczogKGNvbmZpZ1NjaGVtYXRpY3MpID0+IHtcbiAgICBpZiAoY29uZmlnU2NoZW1hdGljc1NldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29uZmlnIHNjaGVtYXRpY3MgYWxyZWFkeSByZWdpc3RlcmVkXCIpO1xuICAgIH1cbiAgICBjb25maWdTY2hlbWF0aWNzU2V0ID0gdHJ1ZTtcbiAgICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5zZXRDb25maWdTY2hlbWF0aWNzKGNvbmZpZ1NjaGVtYXRpY3MpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxuICB3aXRoR2xvYmFsQ29uZmlnU2NoZW1hdGljczogKGdsb2JhbENvbmZpZ1NjaGVtYXRpY3MpID0+IHtcbiAgICBpZiAoZ2xvYmFsQ29uZmlnU2NoZW1hdGljc1NldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiR2xvYmFsIGNvbmZpZyBzY2hlbWF0aWNzIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG4gICAgZ2xvYmFsQ29uZmlnU2NoZW1hdGljc1NldCA9IHRydWU7XG4gICAgc2VsZlJlZ2lzdHJhdGlvbkhvc3Quc2V0R2xvYmFsQ29uZmlnU2NoZW1hdGljcyhnbG9iYWxDb25maWdTY2hlbWF0aWNzKTtcbiAgICByZXR1cm4gcGx1Z2luQ29udGV4dDtcbiAgfSxcbiAgd2l0aFRvb2xzUHJvdmlkZXI6ICh0b29sc1Byb3ZpZGVyKSA9PiB7XG4gICAgaWYgKHRvb2xzUHJvdmlkZXJTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRvb2xzIHByb3ZpZGVyIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG4gICAgaWYgKHByZWRpY3Rpb25Mb29wSGFuZGxlclNldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVG9vbHMgcHJvdmlkZXIgY2Fubm90IGJlIHVzZWQgd2l0aCBhIHByZWRpY3Rpb25Mb29wSGFuZGxlclwiKTtcbiAgICB9XG5cbiAgICB0b29sc1Byb3ZpZGVyU2V0ID0gdHJ1ZTtcbiAgICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5zZXRUb29sc1Byb3ZpZGVyKHRvb2xzUHJvdmlkZXIpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxuICB3aXRoR2VuZXJhdG9yOiAoZ2VuZXJhdG9yKSA9PiB7XG4gICAgaWYgKGdlbmVyYXRvclNldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiR2VuZXJhdG9yIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG5cbiAgICBnZW5lcmF0b3JTZXQgPSB0cnVlO1xuICAgIHNlbGZSZWdpc3RyYXRpb25Ib3N0LnNldEdlbmVyYXRvcihnZW5lcmF0b3IpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxufTtcblxuaW1wb3J0KFwiLi8uLi9zcmMvaW5kZXgudHNcIikudGhlbihhc3luYyBtb2R1bGUgPT4ge1xuICByZXR1cm4gYXdhaXQgbW9kdWxlLm1haW4ocGx1Z2luQ29udGV4dCk7XG59KS50aGVuKCgpID0+IHtcbiAgc2VsZlJlZ2lzdHJhdGlvbkhvc3QuaW5pdENvbXBsZXRlZCgpO1xufSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gZXhlY3V0ZSB0aGUgbWFpbiBmdW5jdGlvbiBvZiB0aGUgcGx1Z2luLlwiKTtcbiAgY29uc29sZS5lcnJvcihlcnJvcik7XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7OztBQUFBLElBQUMsWUFFWSxrQkF3Q0E7QUExQ2I7QUFBQTtBQUFBO0FBQUMsaUJBQXVDO0FBRWpDLElBQU0sdUJBQW1CLG1DQUF1QixFQUNwRDtBQUFBLE1BQ0M7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0UsYUFBYTtBQUFBLFFBQ2IsVUFBVTtBQUFBLE1BQ1o7QUFBQSxNQUNBO0FBQUEsSUFDRixFQUNDO0FBQUEsTUFDQztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDRSxhQUFhO0FBQUEsUUFDYixVQUFVO0FBQUEsTUFDWjtBQUFBLE1BQ0E7QUFBQSxJQUNGLEVBQ0M7QUFBQSxNQUNDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNFLGFBQWE7QUFBQSxRQUNiLFVBQVU7QUFBQSxNQUNaO0FBQUEsTUFDQTtBQUFBLElBQ0YsRUFDQztBQUFBLE1BQ0M7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0UsYUFBYTtBQUFBLFFBQ2IsVUFBVTtBQUFBLFFBQ1YsYUFBYTtBQUFBLE1BQ2Y7QUFBQSxNQUNBO0FBQUEsSUFDRixFQUNDLE1BQU07QUFFRixJQUFNLDZCQUF5QixtQ0FBdUIsRUFDMUQ7QUFBQSxNQUNDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNFLGFBQWE7QUFBQSxRQUNiLFVBQVU7QUFBQSxNQUNaO0FBQUEsTUFDQTtBQUFBLElBQ0YsRUFDQyxNQUFNO0FBQUE7QUFBQTs7O0FDekNULGVBQXNCLGNBQWMsS0FBOEI7QUFDaEUsUUFBTSxRQUFnQixDQUFDO0FBR3ZC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QUFPO0FBQUEsRUFDVDtBQUFBLEVBQ0EsNEJBQTRCLENBQUNDLDRCQUEyQjtBQUN0RCxRQUFJLDJCQUEyQjtBQUM3QixZQUFNLElBQUksTUFBTSw2Q0FBNkM7QUFBQSxJQUMvRDtBQUNBLGdDQUE0QjtBQUM1Qix5QkFBcUIsMEJBQTBCQSx1QkFBc0I7QUFDckUsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUNBLG1CQUFtQixDQUFDQyxtQkFBa0I7QUFDcEMsUUFBSSxrQkFBa0I7QUFDcEIsWUFBTSxJQUFJLE1BQU0sbUNBQW1DO0FBQUEsSUFDckQ7QUFDQSxRQUFJLDBCQUEwQjtBQUM1QixZQUFNLElBQUksTUFBTSw0REFBNEQ7QUFBQSxJQUM5RTtBQUVBLHVCQUFtQjtBQUNuQix5QkFBcUIsaUJBQWlCQSxjQUFhO0FBQ25ELFdBQU87QUFBQSxFQUNUO0FBQUEsRUFDQSxlQUFlLENBQUMsY0FBYztBQUM1QixRQUFJLGNBQWM7QUFDaEIsWUFBTSxJQUFJLE1BQU0sOEJBQThCO0FBQUEsSUFDaEQ7QUFFQSxtQkFBZTtBQUNmLHlCQUFxQixhQUFhLFNBQVM7QUFDM0MsV0FBTztBQUFBLEVBQ1Q7QUFDRjtBQUVBLHdEQUE0QixLQUFLLE9BQU1DLFlBQVU7QUFDL0MsU0FBTyxNQUFNQSxRQUFPLEtBQUssYUFBYTtBQUN4QyxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ1osdUJBQXFCLGNBQWM7QUFDckMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxVQUFVO0FBQ2xCLFVBQVEsTUFBTSxvREFBb0Q7QUFDbEUsVUFBUSxNQUFNLEtBQUs7QUFDckIsQ0FBQzsiLAogICJuYW1lcyI6IFsiaW1wb3J0X3NkayIsICJpbXBvcnRfc2RrIiwgImNvbmZpZ1NjaGVtYXRpY3MiLCAiZ2xvYmFsQ29uZmlnU2NoZW1hdGljcyIsICJ0b29sc1Byb3ZpZGVyIiwgIm1vZHVsZSJdCn0K
