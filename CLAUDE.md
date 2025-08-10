# Claude Code Project Guidelines

## Project Overview
This is an automated sequential workflow system that uses Claude Code to decompose requirements into sequential tasks and automatically generate stacked pull requests for implementation. Each task builds on the changes from previous tasks, creating a progressive implementation chain.

## Architecture

### Core Components
1. **GitHub Workflows** (`.github/workflows/`)
   - `context-to-sequential-tasks.yml`: Sequential task decomposition and initialization
   - `sequential-task-executor.yml`: Individual task execution with automatic chaining
   - `sequential-task-recovery.yml`: Error recovery and state management
   - `claude-pr.yml`: Interactive PR assistant

2. **Scripts** (`scripts/`)
   - `setup-sequential-tasks.js`: Task decomposition and state initialization
   - `execute-sequential-task.js`: Task execution, PR creation, and chaining logic
   - `sequential-task-recovery.js`: Error recovery and state management utilities

3. **Configuration** (`config/`)
   - `workflow-config.yml`: Sequential execution settings and parameters

4. **State Management**
   - `.github/sequential-tasks-state.json`: Persistent state tracking for task chains
   - Automatic state backup and recovery capabilities
   - Progress tracking and error handling

5. **Sequential Integration Approach**
   - Uses `anthropics/claude-code-action@beta` for task decomposition and implementation
   - State-driven sequential execution with automatic task chaining via issue comments
   - Creates stacked PRs where each task builds on previous task's branch
   - **Claude Code Action Compatible**: Uses issue comment triggers instead of repository_dispatch
   - Automatic task coordination through structured comment triggers: `[SEQUENTIAL-TASK-TRIGGER]`
   - Comprehensive error recovery and resume capabilities

## Development Guidelines

### Code Style
- **YAML**: Use 2-space indentation
- **JavaScript**: Use modern ES6+ syntax in GitHub Actions scripts
- **Markdown**: Use clear headers and formatting
- **Comments**: Add clear comments to complex workflow logic

### Error Handling
- Always include try-catch blocks for external API calls
- Provide meaningful error messages with workflow feedback
- Use `core.setFailed()` to properly fail workflows
- Comment on issues when failures occur
- Implement graceful fallbacks when possible

### GitHub Integration
- Use GitHub tokens securely (never hardcode)
- **CRITICAL**: Use `WORKFLOW_TRIGGER_TOKEN` (Fine-Grained PAT) for authenticated operations
- Regular GitHub operations use default `GITHUB_TOKEN`
- **IMPORTANT**: Sequential task coordination uses issue comment triggers, not repository_dispatch
- **Claude Code Compatibility**: Never use repository_dispatch with Claude Code Actions
- Respect rate limits with appropriate delays
- Handle GitHub API exceptions gracefully
- Validate repository access before operations
- See `WORKFLOW_SETUP.md` for PAT configuration instructions

### Claude Code Integration
- Use `custom_instructions` parameter instead of `trigger_phrase` for Claude Code Actions
- Include comprehensive task context and sequential information in custom instructions
- Ensure Claude reads `current-task-context.json` for full sequential context
- Use structured prompts for consistent results with explicit implementation goals
- **Critical**: Instruct Claude to implement working code, not just task descriptions
- Request JSON output when parsing is needed for task decomposition
- Include relevant context and previous task information in prompts
- Set appropriate timeout limits for complex implementation tasks

## Implementation Standards

### Task Decomposition
- Tasks should be atomic and independently implementable
- Include clear success criteria for each task
- Estimate complexity accurately (low/medium/high)
- Identify dependencies between tasks
- Provide implementation notes when helpful

### Issue Creation
- Use descriptive titles (max 200 chars)
- Include all relevant context in body
- Apply appropriate labels automatically
- Link to parent issues when applicable
- Add success criteria as checkboxes

### PR Generation
- Create feature branches with descriptive names
- Write clear commit messages
- Include issue references in PR body
- Add implementation details in PR description
- Request review from appropriate team members

## Testing Requirements

### Workflow Testing
- Test workflow triggers with various inputs
- Validate JSON structure validation logic
- Test error handling paths and user feedback
- Verify Claude Code action file creation

### Integration Tests
- Test full context-to-tasks-to-PR flow
- Validate end-to-end automation
- Test with various context input types
- Verify GitHub integration and permissions

### Manual Testing
- Test with real GitHub repositories
- Validate Claude Code responses and file generation
- Check workflow failure scenarios
- Verify parent issue linking and progress comments

## Security Considerations

### API Keys
- Store in GitHub Secrets
- Never log or expose keys
- Rotate keys regularly
- Use minimal required permissions

### Input Validation
- Sanitize user inputs
- Validate JSON structures
- Check file paths
- Limit input sizes

### Repository Access
- Verify repository permissions
- Use minimal required scopes
- Audit access logs
- Implement branch protection

## Performance Optimization

### API Usage
- Batch operations when possible
- Cache responses appropriately
- Implement exponential backoff
- Monitor usage metrics

### Workflow Efficiency
- Parallelize independent tasks
- Use artifacts for data passing
- Minimize workflow runs
- Optimize Claude prompts

## Documentation

### Code Documentation
- Add docstrings to all functions
- Include usage examples
- Document parameters and returns
- Explain complex logic

### User Documentation
- Provide clear setup instructions
- Include configuration examples
- Document common use cases
- Add troubleshooting guide

## Monitoring and Logging

### Workflow Monitoring
- Track success/failure rates
- Monitor execution times
- Log API usage
- Alert on failures

### Debug Information
- Log key decision points
- Include context in errors
- Save artifacts for debugging
- Provide verbose mode option

## Best Practices

### Task Management
1. Break down complex requirements systematically
2. Prioritize tasks based on dependencies
3. Group related tasks together
4. Plan sequential task dependencies and execution order

### Issue Management
1. Use consistent labeling scheme
2. Link related issues
3. Track progress with milestones
4. Close completed issues automatically

### PR Management
1. Keep PRs focused and small
2. Include comprehensive descriptions
3. Link to related issues
4. Respond to review feedback promptly

### Claude Code Action Integration
1. **Authentication**: Use OAuth token authentication (`claude_code_oauth_token`)
2. **Tool Security**: Always specify `allowed_tools` and `disallowed_tools` for security
3. **Timeouts**: Set appropriate timeouts based on task complexity (15-30 minutes)
4. **Custom Instructions**: Provide clear, specific prompts with relevant context
5. **Version**: Use `anthropics/claude-code-action@beta` for latest features

#### Valid Configuration Parameters
- `claude_code_oauth_token`: OAuth authentication token (required)
- `timeout_minutes`: Execution timeout (default: 30)
- `custom_instructions`: Task-specific instructions for Claude
- `allowed_tools`: Whitelist of tools Claude can use
- `disallowed_tools`: Blacklist of dangerous tools Claude cannot use

## Common Patterns

### Workflow Triggers
```yaml
on:
  workflow_dispatch:  # Manual trigger
  issues:            # Issue events  
    types: [opened, labeled]
  issue_comment:     # Sequential task coordination
    types: [created]
```

### Sequential Task Comment Triggers
Sequential tasks are coordinated via issue comments with this format:
```
[SEQUENTIAL-TASK-TRIGGER] task_index=1 previous_branch=sequential/task-1 parent_issue=123

⚡ Sequential Task 2 Starting

Task 1 completed successfully. Automatically triggering next task in sequence.

**Next Task (2)**: [Task Title]

*This is an automated trigger comment - the sequential workflow will now execute the next task.*
```

### Claude Code Action Usage
```yaml
- name: Implement sequential task
  uses: anthropics/claude-code-action@beta
  with:
    claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
    timeout_minutes: 30
    custom_instructions: |
      You are implementing Task ${{ steps.prepare-task.outputs.task_number }} of ${{ steps.prepare-task.outputs.total_tasks }} in a SEQUENTIAL task execution system.
      
      **CRITICAL**: Read `current-task-context.json` which contains:
      - `taskData`: Full task details (title, description, requirements)
      - `sequentialContext`: The original project context and requirements
      - `previousTasks`: All completed tasks and their implementations
      
      **YOUR GOAL**: Implement working code for this task, not just task descriptions.
    allowed_tools: "Read,Write,Edit,MultiEdit,Glob,Grep,Bash(git *),Bash(npm *),Bash(yarn *),Bash(node *)"
    disallowed_tools: "Bash(rm *),Bash(sudo *),Bash(curl *),Bash(wget *),Bash(dd *)"
```

### Error Recovery
```javascript
try {
  const tasksData = JSON.parse(fs.readFileSync('tasks.json', 'utf8'));
  // Process tasks...
} catch (error) {
  console.log('❌ Failed to parse tasks.json:', error.message);
  await github.rest.issues.createComment({
    body: `❌ **Task decomposition failed** - ${error.message}`
  });
  core.setFailed('Invalid tasks.json file');
}
```

## Version Control

### Branching Strategy
- Main branch for stable code
- Feature branches for new functionality
- Fix branches for bug fixes
- Use descriptive branch names

### Commit Standards
- Use conventional commit format
- Reference issues in commits
- Keep commits atomic
- Write descriptive messages

## Maintenance

### Regular Updates
- Update dependencies monthly
- Review and update documentation
- Refactor complex code
- Optimize performance bottlenecks

### Monitoring
- Check workflow success rates
- Monitor API usage and costs
- Review error logs
- Track user feedback

## Support

### Getting Help
- Check documentation first
- Search existing issues
- Provide detailed error reports
- Include reproduction steps

### Contributing
- Follow coding standards
- Write tests for new features
- Update documentation
- Submit focused PRs

### Critical Implementation Guidelines
- **OAuth Authentication**: Always use `claude_code_oauth_token` for authentication
- **Tool Security**: Specify both `allowed_tools` and `disallowed_tools` for security
- **Version Consistency**: Use `anthropics/claude-code-action@beta` across all workflows
- **Sequential coordination**: Use issue comment triggers in format: `[SEQUENTIAL-TASK-TRIGGER] task_index=N ...`
- **Context Delivery**: Ensure Claude receives implementation context via `current-task-context.json` for sequential tasks

## Current System State

### Active Workflows
1. **context-to-sequential-tasks.yml**: Decomposes requirements into sequential tasks
2. **sequential-task-executor.yml**: Executes individual tasks with issue comment coordination
3. **claude-task-implementation.yml**: Handles standalone Claude requests
4. **claude-pr.yml**: Interactive PR assistant (excludes sequential task PRs)
5. **sequential-task-recovery.yml**: Recovery and debugging operations

### Coordination Method
- **Primary**: Issue comment triggers with `[SEQUENTIAL-TASK-TRIGGER]` format
- **State Storage**: Issue comments with embedded JSON state
- **Task Context**: `current-task-context.json` file committed to each task branch
- **PR Strategy**: Stacked PRs building progressively from task to task

### Key Files
- `scripts/setup-sequential-tasks.js`: Initial task setup and first trigger
- `scripts/execute-sequential-task.js`: Task execution and next task triggering
- `scripts/sequential-task-recovery.js`: Recovery operations with comment triggers
### GitHub CLI Usage
- Run gh commands with clean environment: `bash -c 'unset GITHUB_TOKEN GITHUB_USER; gh auth status'`

### Testing Guidelines
- ONLY CHANGE TESTS if you're absolutely sure the problem is in the test and not in the workflow
- Validate workflow changes with real sequential execution before considering them complete