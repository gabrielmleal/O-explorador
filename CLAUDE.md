# Claude Code Project Guidelines

## Project Overview
This is an automated workflow system that uses Claude Code to decompose requirements into tasks, create GitHub issues, and automatically generate pull requests for implementation.

## Architecture

### Core Components
1. **GitHub Workflows** (`.github/workflows/`)
   - `context-to-tasks.yml`: Main orchestrator for task decomposition
   - `issue-to-pr.yml`: Automatic PR creation from issues
   - `claude-pr.yml`: Interactive PR assistant

2. **Python Scripts** (`scripts/`)
   - `task-decomposer.py`: Uses Claude SDK to break down requirements
   - `issue-creator.py`: Creates GitHub issues from task list

3. **Configuration** (`config/`)
   - `workflow-config.yml`: Workflow settings and parameters

## Development Guidelines

### Code Style
- **Python**: Follow PEP 8 guidelines
- **YAML**: Use 2-space indentation
- **Markdown**: Use clear headers and formatting
- **Comments**: Add docstrings to all functions and classes

### Error Handling
- Always include try-catch blocks for external API calls
- Provide meaningful error messages
- Log errors to stderr for debugging
- Implement graceful fallbacks when possible

### GitHub Integration
- Use GitHub tokens securely (never hardcode)
- Respect rate limits with appropriate delays
- Handle GitHub API exceptions gracefully
- Validate repository access before operations

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

### Unit Tests
- Test all core functions in Python scripts
- Mock external API calls
- Validate input/output formats
- Test error handling paths

### Integration Tests
- Test workflow triggers
- Validate end-to-end flow
- Test with various input types
- Verify GitHub integration

### Manual Testing
- Test with real GitHub repositories
- Validate Claude responses
- Check rate limiting behavior
- Verify error recovery

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
4. Identify parallel execution opportunities

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

### Claude Prompting
```python
prompt = f"""
Context: {project_context}
Task: {specific_task}
Requirements: {requirements}
Output: JSON structure with specific fields
"""
```

### Error Recovery
```python
try:
    result = api_call()
except Exception as e:
    log_error(e)
    return fallback_result()
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