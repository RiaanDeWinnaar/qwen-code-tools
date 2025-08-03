import { text, tool, Tool, ToolsProviderController } from "@lmstudio/sdk";
import { z } from "zod";
import { existsSync, statSync } from "fs";
import { readFile, writeFile, mkdir, readdir } from "fs/promises";
import { join, extname, basename } from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { configSchematics } from "./config";
import { createAgentTool } from "./agentProvider";

const execAsync = promisify(exec);

export async function toolsProvider(ctl: ToolsProviderController) {
  const tools: Tool[] = [];
  
  // Get configuration
  const config = ctl.getPluginConfig(configSchematics);

  // File Management Tools
  const createFileTool = tool({
    name: "create_file",
    description: text`
      Create a new file with specified content. Useful for creating code files, documentation, or any text-based files.
    `,
    parameters: { 
      file_name: z.string().describe("Name of the file to create"),
      content: z.string().describe("Content to write to the file")
      // Removed overwrite parameter to avoid Qwen parsing issues
    },
    implementation: async ({ file_name, content }, { status, warn }) => {
      const workspaceFolder = config.get("workspaceFolder") as string;
      const folderPath = join(ctl.getWorkingDirectory(), workspaceFolder);
      
      await mkdir(folderPath, { recursive: true });
      const filePath = join(folderPath, file_name);
      
      // Always allow overwrite for simplicity with Qwen
      const maxSize = (config.get("maxFileSize") as number) * 1024;
      if (content.length > maxSize) {
        warn(`File content is larger than ${config.get("maxFileSize")}KB`);
      }
      
      status(`Creating file: ${file_name}`);
      await writeFile(filePath, content, "utf-8");
      return `File ${file_name} created successfully in ${workspaceFolder}/`;
    },
  });

  const readFileTool = tool({
    name: "read_file",
    description: text`
      Read the content of an existing file. Useful for examining code, configuration files, or any text-based content.
    `,
    parameters: { 
      file_name: z.string().describe("Name of the file to read")
    },
    implementation: async ({ file_name }, { status }) => {
      const workspaceFolder = config.get("workspaceFolder") as string;
      const filePath = join(ctl.getWorkingDirectory(), workspaceFolder, file_name);
      
      if (!existsSync(filePath)) {
        return `Error: File ${file_name} does not exist in ${workspaceFolder}/`;
      }
      
      const stats = statSync(filePath);
      const maxSize = (config.get("maxFileSize") as number) * 1024;
      
      if (stats.size > maxSize) {
        return `Error: File ${file_name} is too large (${Math.round(stats.size/1024)}KB > ${config.get("maxFileSize")}KB)`;
      }
      
      status(`Reading file: ${file_name}`);
      const content = await readFile(filePath, "utf-8");
      return content;
    },
  });

  const listFilesTool = tool({
    name: "list_files",
    description: text`
      List files in the workspace directory. Useful for exploring project structure.
    `,
    parameters: { 
      // Removed optional path parameter to simplify for Qwen
    },
    implementation: async ({ }, { status }) => {
      const workspaceFolder = config.get("workspaceFolder") as string;
      const basePath = join(ctl.getWorkingDirectory(), workspaceFolder);
      
      if (!existsSync(basePath)) {
        await mkdir(basePath, { recursive: true });
        return "Workspace directory created. No files yet.";
      }
      
      status(`Listing files in: ${workspaceFolder}`);
      const files = await readdir(basePath, { withFileTypes: true });
      
      const fileList = files.map(file => {
        const type = file.isDirectory() ? "DIR" : "FILE";
        const ext = file.isFile() ? extname(file.name) : "";
        return `${type}: ${file.name}${ext ? ` (${ext})` : ""}`;
      });
      
      return fileList.length > 0 ? fileList.join("\n") : "Directory is empty";
    },
  });

  // Code Execution Tools
  const executeCodeTool = tool({
    name: "execute_code",
    description: text`
      Execute code in various languages (Python, JavaScript, etc.). Useful for testing code snippets or running scripts.
    `,
    parameters: {
      language: z.enum(["python", "javascript", "bash", "node"]).describe("Programming language to execute"),
      code: z.string().describe("Code to execute")
      // Removed save_output parameter to simplify for Qwen
    },
    implementation: async ({ language, code }, { status, warn, signal }) => {
      const workspaceFolder = config.get("workspaceFolder") as string;
      const folderPath = join(ctl.getWorkingDirectory(), workspaceFolder);
      await mkdir(folderPath, { recursive: true });
      
      const fileExt = language === "python" ? "py" : language === "javascript" || language === "node" ? "js" : "sh";
      const tempFile = join(folderPath, `temp_${Date.now()}.${fileExt}`);
      
      await writeFile(tempFile, code, "utf-8");
      
      let command: string;
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
          timeout: 30000  // Use fixed 30 second timeout
        });
        
        const output = `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`;
        return output;
      } catch (error: any) {
        return `Execution error: ${error.message}`;
      }
    },
  });

  // Git Operations Tool
  const gitOperationTool = tool({
    name: "git_operation",
    description: "Perform basic Git operations in the workspace. Useful for version control of code projects.",
    parameters: {
      operation: z.enum(["init", "status", "add", "commit", "log"]).describe("Git operation to perform"),
      files: z.string().optional().describe("Files to add (for 'add' operation)"),
      message: z.string().optional().describe("Commit message (for 'commit' operation)")
    },
    implementation: async ({ operation, files, message }, { status, signal }) => {
      const workspaceFolder = config.get("workspaceFolder") as string;
      const folderPath = join(ctl.getWorkingDirectory(), workspaceFolder);
      
      let command: string;
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
          timeout: 10000 
        });
        return stdout ? stdout : stderr;
      } catch (error: any) {
        return `Git error: ${error.message}`;
      }
    },
  });

  // Web Search Tool (conditionally added based on config)
  const webSearchEnabled = config.get("enableWebSearch") as boolean;
  if (webSearchEnabled) {
    const webSearchTool = tool({
      name: "web_search",
      description: text`
        Search the web for current information, news, and real-time data. Uses multiple search engines for comprehensive results.
      `,
      parameters: {
        query: z.string().describe("Search query to find information about")
      },
      implementation: async ({ query }, { status, warn, signal }) => {
        status(`Searching the web for: ${query}`);
        
        try {
          // Get Brave API key from config
          const braveApiKey = config.get("braveApiKey") as string;
          
          // Try Brave Search API first (free tier: 5000 queries/month, or higher limits with API key)
          try {
            const braveUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=3`;
            const braveHeaders: HeadersInit = {
              'Accept': 'application/json',
              'Accept-Encoding': 'gzip',
              'User-Agent': 'LMStudio-QwenTools/1.0'
            };
            
            // Add API key if available
            if (braveApiKey && braveApiKey.trim()) {
              braveHeaders['X-Subscription-Token'] = braveApiKey.trim();
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
                const formattedResults = results.map((result: any, index: number) => 
                  `${index + 1}. **${result.title}**\n   ${result.description}\n   Source: ${result.url}`
                ).join('\n\n');
                
                return `Web search results for "${query}" (via Brave Search):\n\n${formattedResults}`;
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
                const results = ddgData.RelatedTopics.slice(0, 3).map((topic: any, index: number) => {
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
          } catch (ddgError) {
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
                const results = searchData.query.search.slice(0, 3).map((result: any, index: number) => 
                  `${index + 1}. ${result.title}\n   ${result.snippet.replace(/<[^>]*>/g, '')}\n   https://en.wikipedia.org/wiki/${encodeURIComponent(result.title.replace(/ /g, '_'))}`
                ).join('\n\n');
                
                return `Search results for "${query}" (Wikipedia search):\n\n${results}`;
              }
            }
          } catch (wikiError) {
            warn("All search services unavailable");
          }
          
          return `No search results found for "${query}". All search services appear to be unavailable. Please try:\n- Checking your internet connection\n- Using more specific search terms\n- Trying again later`;
          
        } catch (error: any) {
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
  const packageManagerTool = tool({
    name: "package_manager",
    description: text`
      Install packages using npm, pip, or other package managers. Useful for setting up project dependencies.
    `,
    parameters: {
      manager: z.enum(["npm", "pip", "yarn", "pnpm"]).describe("Package manager to use"),
      action: z.enum(["install", "uninstall", "list", "init"]).describe("Action to perform"),
      package_name: z.string().optional().describe("Package name (not needed for list/init)")
    },
    implementation: async ({ manager, action, package_name }, { status, warn, signal }) => {
      const workspaceFolder = config.get("workspaceFolder") as string;
      const folderPath = join(ctl.getWorkingDirectory(), workspaceFolder);
      
      let command: string;
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
          timeout: 60000  // 60 seconds for package operations
        });
        return `${manager} ${action} completed:\n\nSTDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`;
      } catch (error: any) {
        return `Package manager error: ${error.message}`;
      }
    },
  });

  // Project Structure Tool
  const projectStructureTool = tool({
    name: "create_project_structure",
    description: text`
      Create a complete project structure with common files and folders. Useful for initializing new projects.
    `,
    parameters: {
      project_type: z.enum(["python", "javascript", "typescript", "react", "vue", "express"]).describe("Type of project to create"),
      project_name: z.string().describe("Name of the project")
    },
    implementation: async ({ project_type, project_name }, { status }) => {
      const workspaceFolder = config.get("workspaceFolder") as string;
      const folderPath = join(ctl.getWorkingDirectory(), workspaceFolder);
      const projectPath = join(folderPath, project_name);
      
      await mkdir(projectPath, { recursive: true });
      
      status(`Creating ${project_type} project structure for ${project_name}`);
      
      try {
        switch (project_type) {
          case "python":
            await mkdir(join(projectPath, "src"), { recursive: true });
            await mkdir(join(projectPath, "tests"), { recursive: true });
            await writeFile(join(projectPath, "main.py"), "# Main application file\n\ndef main():\n    print('Hello, World!')\n\nif __name__ == '__main__':\n    main()\n", "utf-8");
            await writeFile(join(projectPath, "requirements.txt"), "# Add your Python dependencies here\n", "utf-8");
            await writeFile(join(projectPath, "README.md"), `# ${project_name}\n\nA Python project.\n\n## Installation\n\n\`\`\`bash\npip install -r requirements.txt\n\`\`\`\n\n## Usage\n\n\`\`\`bash\npython main.py\n\`\`\`\n`, "utf-8");
            break;
            
          case "javascript":
          case "typescript":
            await mkdir(join(projectPath, "src"), { recursive: true });
            const ext = project_type === "typescript" ? "ts" : "js";
            await writeFile(join(projectPath, `src/index.${ext}`), "// Main application file\nconsole.log('Hello, World!');\n", "utf-8");
            await writeFile(join(projectPath, "package.json"), JSON.stringify({
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
              await writeFile(join(projectPath, "tsconfig.json"), JSON.stringify({
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
        
        await writeFile(join(projectPath, ".gitignore"), "node_modules/\n*.log\n.env\ndist/\n__pycache__/\n*.pyc\n", "utf-8");
        
        return `Successfully created ${project_type} project structure for "${project_name}" with:\n- Source directory\n- Main entry file\n- Package/dependency file\n- README.md\n- .gitignore`;
        
      } catch (error: any) {
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
  const agentTool = createAgentTool(ctl);
  if (agentTool) {
    tools.push(agentTool);
  }

  return tools;
}
