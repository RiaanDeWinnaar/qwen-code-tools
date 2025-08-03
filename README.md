# Qwen Coder Tools - LM Studio Plugin

A comprehensive development toolkit plugin for LM Studio, specifically optimized for Qwen models and compatible with XML-style tool calling.

## 🚀 Features

### Development Tools
- **File Management**: Create, read, and list files with workspace organization
- **Code Execution**: Run Python and JavaScript code with proper output capture
- **Project Scaffolding**: Generate complete project structures for various frameworks
- **Package Management**: Install dependencies via npm, pip, yarn, and other package managers
- **Git Operations**: Initialize repositories, commit changes, and manage version control
- **Web Search**: Research latest information and documentation with Brave Search API

### Autonomous Agent Mode 🤖
- **Toggle Mode**: Switch between "Edit Mode" (individual tools) and "Agent Mode" (autonomous behavior)
- **Multi-step Execution**: Complete complex development tasks without step-by-step confirmation
- **Intelligent Planning**: Analyze requirements and execute comprehensive development workflows
- **Best Practices**: Research current standards and implement quality solutions

## 📋 Available Tools

1. **create_file** - Create files with specified content
2. **read_file** - Read existing files to understand codebase  
3. **list_files** - Explore directory structures and find files
4. **execute_code** - Run Python/JavaScript with output capture
5. **git_operation** - Initialize repos, commit changes, manage version control
6. **package_manager** - Install dependencies (npm, pip, yarn, etc.)
7. **create_project_structure** - Scaffold complete project templates
8. **web_search** - Research latest information and APIs (when enabled)
9. **autonomous_agent** - Execute complex tasks autonomously (when Agent Mode enabled)

## ⚙️ Configuration

### Per-Chat Settings
- **Workspace Folder**: Directory for file operations (default: "qwen_workspace")
- **Max File Size**: File size limit in KB (default: 1024)
- **Enable Web Search**: Allow internet research capabilities (default: false)
- **Brave Search API Key**: Enhanced search with higher rate limits (optional)
- **Agent Mode**: Enable autonomous agent behavior (default: false)

### Global Settings  
- **Default Timeout**: Timeout for long operations in seconds (default: 30)

## 🤖 Agent Mode vs Edit Mode

### Edit Mode (Default)
- Individual tool usage with explicit calls
- Step-by-step confirmation for each action
- Traditional tool-based interaction
- Suitable for precise, controlled development tasks

### Agent Mode (Advanced)
- Autonomous multi-step task execution
- Intelligent planning and decision making
- Research-driven approach with web search
- Complete workflow automation
- Ideal for complex development projects

## 🛠️ Installation

### For Development
```bash
cd qwen-coder-tools
npm install
lms dev  # Development mode with hot reload
```

### For Production
```bash
lms push  # Install permanently in LM Studio
```

## 🎯 Qwen Model Compatibility

This plugin is specifically optimized for Qwen models:
- ✅ **XML-style tool calling**: `<function=tool_name><parameter=name>value</parameter></function>`
- ✅ **Simple parameter types**: string, number, boolean (no complex objects)
- ✅ **Robust error handling**: Clear error messages for model self-correction
- ✅ **Parameter validation**: Zod schemas with detailed descriptions

## 🔍 Web Search Integration

### Brave Search API (Recommended)
- **Free Tier**: 5,000 queries/month (no API key required)
- **With API Key**: Higher rate limits and enhanced features
- **Setup**: Add your Brave API key in plugin configuration

### Fallback Services
- **DuckDuckGo**: Instant answers and web results
- **Wikipedia**: Encyclopedia content for research
- **Automatic Failover**: Seamless switching if primary service fails

## 📁 Project Structure Templates

### Supported Project Types
- **Python**: Flask, FastAPI, Django projects with proper structure
- **JavaScript**: Node.js, Express, React applications  
- **TypeScript**: Modern TS projects with proper configuration
- **Web**: HTML/CSS/JS static sites
- **API**: REST API templates with documentation

## 🔄 Version Control Integration

### Git Operations
- Initialize repositories with proper .gitignore
- Commit changes with meaningful messages
- Track development progress automatically
- Integrate with development workflows

## 📖 Usage Examples

### Basic File Operations
```
Model: "Create a Python script that calculates fibonacci numbers"
Plugin: Uses create_file to generate fib.py with implementation
```

### Complex Project Creation  
```
Model: "Build a REST API for task management"
Agent Mode: 
1. Research current best practices
2. Create project structure  
3. Install dependencies
4. Implement endpoints
5. Add documentation
6. Test functionality
7. Commit to git
```

### Research-Driven Development
```
Model: "Implement OAuth authentication using current best practices"
Agent Mode:
1. Web search for latest OAuth standards
2. Research secure implementation patterns
3. Create authentication module
4. Add security middleware
5. Test and document
```

## 🚀 Best Practices

### For Individual Tools
- Use clear, specific file names and paths
- Provide detailed content for file creation
- Test code after creation with execute_code
- Commit meaningful changes with git_operation

### For Agent Mode
- Provide clear, comprehensive task descriptions
- Specify scope and constraints when needed
- Let the agent research and plan autonomously
- Review final outputs and documentation

## 🔒 Security

- **Sandboxed Execution**: Code runs in controlled environment
- **Path Validation**: File operations restricted to workspace
- **Timeout Protection**: Long operations automatically terminated
- **API Key Security**: Credentials stored securely in LM Studio

## 📝 Contributing

This plugin follows LM Studio Plugin SDK patterns:
- TypeScript with ES2021 target
- Zod validation for parameters
- Proper error handling and user feedback
- Status updates for long operations

## 📄 License

Compatible with LM Studio Plugin ecosystem. Designed for community sharing via LM Studio Hub.

---

**Plugin Name**: lmstudio/qwen-coder-tools  
**Version**: 1.0.0  
**Compatibility**: LM Studio Plugin SDK 1.4.0+  
**Optimized For**: Qwen 2.5 models with XML tool calling
