import { createConfigSchematics } from "@lmstudio/sdk";

export const configSchematics = createConfigSchematics()
  .field(
    "workspaceFolder",
    "string",
    {
      displayName: "Workspace Folder",
      subtitle: "The folder where files will be created and managed.",
    },
    "qwen_workspace"
  )
  .field(
    "maxFileSize",
    "numeric",
    {
      displayName: "Max File Size (KB)",
      subtitle: "Maximum size for files that can be read or created.",
    },
    1024
  )
  .field(
    "enableWebSearch",
    "boolean",
    {
      displayName: "Enable Web Search",
      subtitle: "Allow the model to search the web for information.",
    },
    false
  )
  .field(
    "braveApiKey",
    "string",
    {
      displayName: "Brave Search API Key",
      subtitle: "API key for Brave Search (optional - improves search quality and rate limits)",
      placeholder: "Enter your Brave API key here...",
    },
    ""
  )
  .build();

export const globalConfigSchematics = createConfigSchematics()
  .field(
    "defaultTimeout",
    "numeric",
    {
      displayName: "Default Timeout (seconds)",
      subtitle: "Default timeout for long-running operations.",
    },
    30
  )
  .build();
