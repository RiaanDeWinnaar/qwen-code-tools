# Qwen Coder Tools - LM Studio Plugin

A comprehensive development toolkit plugin for LM Studio, specifically optimized for Qwen models with XML-style tool calling support and autonomous agent capabilities.

![Plugin Status](https://img.shields.io/badge/status-beta-yellow)
![LM Studio](https://img.shields.io/badge/LM%20Studio-1.4.0+-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🚀 Features

### 🛠️ Development Tools
- **File Management**: Create, read, and list files with workspace organization
- **Code Execution**: Run Python and JavaScript code with proper output capture
- **Project Scaffolding**: Generate complete project structures for various frameworks
- **Package Management**: Install dependencies via npm, pip, yarn, and other package managers
- **Git Operations**: Initialize repositories, commit changes, and manage version control
- **Web Search**: Research latest information and documentation with Brave Search API integration

### 🤖 Autonomous Agent Mode
- **Toggle Mode**: Switch between "Edit Mode" (individual tools) and "Agent Mode" (autonomous behavior)
- **Multi-step Execution**: Complete complex development tasks without step-by-step confirmation
- **Intelligent Planning**: Analyze requirements and execute comprehensive development workflows
- **Research-Driven**: Automatically research best practices and implement quality solutions

### ⚡ Qwen Model Optimization
- **XML Tool Calling**: Optimized for Qwen's `<function=name><parameter=value>` format
- **Simple Parameters**: Robust parameter validation with clear error messages
- **Self-Correction**: Designed for model error recovery and retry mechanisms

## 📋 Available Tools

| Tool | Description | Use Case |
|------|-------------|----------|
| `create_file` | Create files with specified content | Code files, documentation, configs |
| `read_file` | Read existing files to understand codebase | Code analysis, debugging |
| `list_files` | Explore directory structures and find files | Project navigation, file discovery |
| `execute_code` | Run Python/JavaScript with output capture | Testing, validation, scripting |
| `git_operation` | Initialize repos, commit, manage version control | Project versioning, collaboration |
| `package_manager` | Install dependencies (npm, pip, yarn, etc.) | Environment setup, dependency management |
| `create_project_structure` | Scaffold complete project templates | Rapid project initialization |
| `web_search` | Research latest information and APIs | Documentation, best practices research |
| `autonomous_agent` | Execute complex tasks autonomously | Complete workflow automation |

## ⚙️ Configuration

### Per-Chat Settings
- **Workspace Folder**: Directory for file operations (default: "qwen_workspace")
- **Max File Size**: File size limit in KB (default: 1024)
- **Enable Web Search**: Allow internet research capabilities (default: false)
- **Brave Search API Key**: Enhanced search with higher rate limits (optional)
- **Agent Mode**: Enable autonomous agent behavior (default: false)

### Global Settings  
- **Default Timeout**: Timeout for long operations in seconds (default: 30)

## 🛠️ Installation

### Quick Start (Workaround)
Due to LM Studio's current plugin installation limitations, use the provided startup scripts:

```bash
# Windows
.\start-plugin.bat

# PowerShell
.\start-plugin.ps1

# Linux/macOS
./start-plugin.sh
```

### Development Setup
```bash
git clone https://github.com/RiaanDeWinnaar/qwen-coder-tools.git
cd qwen-coder-tools
npm install
lms dev  # Starts development server
```

### Auto-Startup Configuration
1. **Windows Startup**: Copy `start-plugin.bat` to `shell:startup`
2. **Desktop Shortcut**: Create shortcut to `start-plugin.bat`
3. **Task Scheduler**: Set up advanced scheduling with LM Studio detection

## 🎯 Usage Examples

### Individual Tool Mode (Default)
```
User: "Create a Python function to calculate fibonacci numbers"
Plugin: Uses create_file tool to generate fib.py with implementation
```

### Autonomous Agent Mode
```
User: "Build a REST API for task management with authentication"
Agent: 
1. 🔍 Researches current REST API best practices
2. 🏗️ Creates project structure with proper organization
3. 📦 Installs required dependencies (Express, JWT, bcrypt, etc.)
4. 💻 Implements authentication middleware
5. 🛣️ Creates CRUD endpoints for tasks
6. 📝 Adds comprehensive documentation
7. 🧪 Creates test cases and validation
8. 📚 Commits changes with meaningful messages
```

### Research-Driven Development
```
User: "Implement OAuth 2.0 authentication using current best practices"
Agent:
1. 🌐 Web searches for latest OAuth 2.0 standards and security practices
2. 📖 Researches secure implementation patterns
3. 🔧 Creates authentication module with proper security measures
4. 🛡️ Implements security middleware and validation
5. 📋 Adds comprehensive documentation and examples
6. ✅ Tests implementation and provides usage guide
```

## 🔍 Web Search Integration

### Brave Search API
- **Free Tier**: 5,000 queries/month (no API key required)
- **With API Key**: Higher rate limits and enhanced features
- **Setup**: Add your Brave API key in plugin configuration

### Fallback Services
- **DuckDuckGo**: Instant answers and web results
- **Wikipedia**: Encyclopedia content for research
- **Automatic Failover**: Seamless switching if primary service fails

## 📁 Project Templates

Supports scaffolding for:
- **Python**: Flask, FastAPI, Django projects
- **JavaScript**: Node.js, Express, React applications  
- **TypeScript**: Modern TS projects with proper configuration
- **Web**: HTML/CSS/JS static sites
- **API**: REST API templates with documentation

## 🤖 Agent vs Edit Modes

### Edit Mode (Traditional)
- ✅ Individual tool usage with explicit calls
- ✅ Step-by-step confirmation for each action
- ✅ Precise, controlled development tasks
- ✅ Suitable for specific, targeted operations

### Agent Mode (Autonomous)
- 🚀 Multi-step task execution without confirmation
- 🧠 Intelligent planning and decision making
- 🔍 Research-driven approach with web search
- 🔄 Complete workflow automation
- 🎯 Ideal for complex, end-to-end development projects

## � Known Issues

### Installation Problem
LM Studio currently lacks a documented method for local plugin installation without Hub authentication. This plugin includes startup scripts as a workaround to maintain persistent functionality through `lms dev` automation.

**Workaround**: Use the provided startup scripts for seamless plugin experience.

## 🔧 Development

### Project Structure
```
qwen-coder-tools/
├── src/
│   ├── index.ts              # Plugin entry point
│   ├── toolsProvider.ts      # Main tools implementation
│   ├── agentProvider.ts      # Autonomous agent functionality
│   └── config.ts             # Configuration schemas
├── startup scripts/
│   ├── start-plugin.bat      # Windows batch script
│   ├── start-plugin.ps1      # PowerShell script
│   └── start-plugin.sh       # Linux/macOS shell script
├── manifest.json             # Plugin metadata
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

### Building
```bash
npm install          # Install dependencies
npx tsc             # Compile TypeScript
lms dev             # Test in development
```

## 🧪 Testing

### Manual Testing
```bash
# Start development server
lms dev

# Test individual tools in LM Studio
# Test autonomous agent mode (enable in settings)
# Verify web search functionality
```

### Validation
- ✅ All 9 tools functional
- ✅ Qwen XML parsing compatibility
- ✅ Agent mode autonomous behavior
- ✅ Web search with fallbacks
- ✅ Error handling and recovery

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🔒 Security

- **Sandboxed Execution**: Code runs in controlled environment
- **Path Validation**: File operations restricted to workspace
- **Timeout Protection**: Long operations automatically terminated
- **API Key Security**: Credentials stored securely in LM Studio
- **Input Validation**: All parameters validated with Zod schemas

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **LM Studio Team**: For the excellent plugin SDK and development platform
- **Qwen Team**: For the powerful language models with tool calling capabilities
- **Community**: For feedback and testing during development

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/RiaanDeWinnaar/qwen-coder-tools/issues)
- **Discussions**: [GitHub Discussions](https://github.com/RiaanDeWinnaar/qwen-coder-tools/discussions)
- **Documentation**: [LM Studio Plugin Docs](https://lmstudio.ai/docs/typescript/plugins)

---

**Created by**: [Riaan De Winnaar](https://github.com/RiaanDeWinnaar)  
**Version**: 2.0  
**Last Updated**: August 3, 2025  
**Compatible with**: LM Studio 1.4.0+, Qwen 2.5+ models
