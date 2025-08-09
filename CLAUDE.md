# Claude Code Project Guidelines

## Project Overview
This is an automated sequential workflow system that uses Claude Code to decompose requirements into sequential tasks and automatically generate stacked pull requests for implementation. Each task builds on the changes from previous tasks, creating a progressive implementation chain.

## Architecture

### Core Components
1. **GitHub Workflows** (`.github/workflows/`)
   - `context-to-sequential-tasks.yml`: Sequential task decomposition and initialization
   - `sequential-task-executor.yml`: Individual task execution with automatic chaining
   - `sequential-task-recovery.yml`: Error recovery and state management
   - `context-to-tasks.yml`: Legacy parallel orchestrator (deprecated)
   - `issue-to-pr.yml`: Legacy PR creation (deprecated)
   - `claude-pr.yml`: Interactive PR assistant

2. **Configuration** (`config/`)
   - `workflow-config.yml`: Workflow settings and parameters

3. **Sequential Integration Approach**
   - Uses `anthropics/claude-code-action@beta` for task decomposition and implementation
   - Implements state-driven sequential execution with `.github/sequential-tasks-state.json`
   - Creates stacked PRs where each task builds on previous task's branch
   - Automatic task chaining via `repository_dispatch` events
   - Comprehensive error recovery and state management systems

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
- **CRITICAL**: Use `WORKFLOW_TRIGGER_TOKEN` (Fine-Grained PAT) for workflow dispatch events to avoid GitHub's workflow triggering restrictions
- Regular GitHub operations use default `GITHUB_TOKEN`
- Respect rate limits with appropriate delays
- Handle GitHub API exceptions gracefully
- Validate repository access before operations
- See `WORKFLOW_SETUP.md` for PAT configuration instructions

### Claude Code Integration
- Use structured prompts for consistent results
- Request JSON output when parsing is needed
- Include relevant context in prompts
- Set appropriate turn limits for complex tasks

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

### Claude Integration
1. Provide clear, specific prompts
2. Include relevant context
3. Set appropriate complexity expectations
4. Validate Claude's outputs

## Common Patterns

### Workflow Triggers
```yaml
on:
  workflow_dispatch:  # Manual trigger
  issues:            # Issue events
    types: [opened, labeled]
  issue_comment:     # PR comments
    types: [created]
```

### Claude Code Action Usage
```yaml
- name: Analyze context with Claude Code
  uses: anthropics/claude-code-action@beta
  with:
    claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
    custom_instructions: |
      CONTEXT TO ANALYZE: ${{ github.event.inputs.context }}
      INSTRUCTIONS:
      1. Read CLAUDE.md and understand the project structure
      2. Write a JSON file called 'tasks.json' with structured output
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