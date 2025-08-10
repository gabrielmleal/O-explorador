# E2E Sequential Workflow Tests

This directory contains comprehensive end-to-end tests for the sequential workflow system. The tests validate the entire workflow from issue creation through task completion and PR generation.

## 📁 Directory Structure

```
test/
├── README.md                           # This file
├── e2e-test-runner.js                 # Main test orchestrator
├── config/
│   ├── test-scenarios.js              # Test scenario definitions
│   └── test-settings.js               # Test configuration and settings
├── validators/
│   ├── workflow-validator.js          # GitHub Actions workflow validation
│   ├── issue-validator.js             # Issue state and comment validation
│   ├── pr-validator.js                # Pull request validation
│   ├── branch-validator.js            # Git branch validation
│   └── state-validator.js             # Sequential state management validation
├── logs/                              # Test execution logs (created during runs)
└── artifacts/                         # Test artifacts and debugging data
```

## 🚀 Running E2E Tests

### Via GitHub Actions (Recommended)

1. Navigate to the "Actions" tab in your GitHub repository
2. Find the "E2E Sequential Workflow Test" workflow
3. Click "Run workflow"
4. Select test parameters:
   - **Test Scenario**: Choose from available scenarios
   - **Cleanup**: Whether to clean up test artifacts after completion
   - **Timeout**: Test timeout in minutes

### Available Test Scenarios

| Scenario | Description | Tasks | Timeout |
|----------|-------------|-------|---------|
| `basic-3-tasks` | Standard 3-task web application | 3 | 30 min |
| `single-task` | Simple single-task test | 1 | 15 min |
| `error-recovery` | Error handling and recovery | 2-3 | 25 min |
| `max-tasks` | Comprehensive 5-task application | 5 | 45 min |

### Manual Execution (Development)

```bash
# Ensure you have the required environment variables
export WORKFLOW_TRIGGER_TOKEN="your_fine_grained_pat"
export CLAUDE_CODE_OAUTH_TOKEN="your_claude_code_token"

# Run specific scenario
TEST_SCENARIO="basic-3-tasks" node test/e2e-test-runner.js
```

## 🔍 What the Tests Validate

### 1. **Issue Creation & Context Analysis**
- ✅ Test issue created with correct labels
- ✅ `context-to-sequential-tasks.yml` workflow triggered
- ✅ Claude Code generates valid `tasks.json`
- ✅ Task count matches expectations

### 2. **Sequential State Management**
- ✅ State comment created in issue with correct format
- ✅ Progress tracking comments posted
- ✅ State updates throughout execution
- ✅ Final state shows completion

### 3. **Task Execution Chain**
- ✅ Each `sequential-task-executor.yml` workflow triggered
- ✅ Comment-based task coordination working
- ✅ Tasks execute in correct order
- ✅ Claude Code implements actual working code

### 4. **Branch Management**
- ✅ Sequential branches created (`sequential/task-1`, `sequential/task-2`, etc.)
- ✅ Proper branch stacking (each task builds on previous)
- ✅ Branch ancestry relationships correct
- ✅ No dangling or orphaned branches

### 5. **Pull Request Generation**
- ✅ PRs created for each task
- ✅ Correct base branch relationships (stacked PRs)
- ✅ Proper PR labeling (`sequential-task`, `task-N`)
- ✅ PRs contain actual code changes
- ✅ Claude Code attribution in commits

### 6. **Workflow Integration**
- ✅ All workflows execute successfully
- ✅ No workflow failures or timeouts
- ✅ Proper workflow event handling
- ✅ Comment triggers work correctly

## 📊 Test Results

After execution, the test provides detailed results including:

- **Test Issue**: Link to the created test issue
- **Tasks Created/Completed**: Count of tasks processed
- **PRs Created**: Number of pull requests generated
- **Workflows Executed**: Count of successful workflow runs
- **Validation Results**: Detailed validation outcomes
- **Execution Time**: Total test duration

## 🔧 Configuration

### Test Settings (`test/config/test-settings.js`)

Configure timeouts, intervals, validation rules, and behavior:

```javascript
const settings = getSettings('production'); // or 'development', 'testing'
```

Key configurable aspects:
- **Timeouts**: Workflow, task, and overall execution timeouts
- **Validation**: Strictness levels and validation rules
- **Cleanup**: Artifact cleanup behavior
- **Artifacts**: Logging and data retention settings

### Test Scenarios (`test/config/test-scenarios.js`)

Add new test scenarios by extending the `testScenarios` object:

```javascript
'my-scenario': {
  name: 'My Custom Test',
  description: 'Tests custom functionality',
  expectedTaskCount: 2,
  timeout: 20,
  context: {
    title: '[SEQUENTIAL] My Test Title',
    body: 'Project context for sequential implementation...'
  }
}
```

## 🐛 Debugging Failed Tests

### 1. **Check Test Logs**
- Logs are saved to `test/logs/` directory
- Look for specific error messages and validation failures

### 2. **Examine Test Issue**
- The test creates a real GitHub issue
- Review comments for state progression and error messages
- Check if workflow triggers were successful

### 3. **Review Workflow Runs**
- Go to GitHub Actions and examine workflow execution
- Look for failed steps or timeout issues
- Check Claude Code action outputs

### 4. **Validate Individual Components**
- Use individual validator functions to test specific aspects
- Check branch creation, PR generation, state management separately

### 5. **Common Issues**
- **Token Permissions**: Ensure `WORKFLOW_TRIGGER_TOKEN` has sufficient permissions
- **Claude Code Quota**: Check if Claude Code usage limits were exceeded
- **Timeout Issues**: Increase timeouts for complex scenarios
- **State Synchronization**: Race conditions in state updates

## 🔒 Security Considerations

- Tests use real GitHub APIs and create actual issues/PRs/branches
- Ensure test tokens have minimal required permissions
- Test artifacts may contain sensitive information
- Use cleanup settings to remove test data after execution

## 🚀 Extending the Tests

### Adding New Validators

1. Create validator in `test/validators/`
2. Implement validation logic
3. Add to test runner imports
4. Use in appropriate test phases

### Adding New Scenarios

1. Add scenario to `test/config/test-scenarios.js`
2. Include expected task count and timeout
3. Provide realistic project context
4. Test scenario before production use

### Customizing Validation Rules

1. Modify settings in `test/config/test-settings.js`
2. Adjust validation strictness levels
3. Configure timeout and retry behavior
4. Set cleanup and artifact preferences

## 📈 Monitoring Test Health

### Regular Test Execution

- Run tests on every major workflow change
- Execute monthly to catch integration drift
- Use different scenarios to test various use cases

### Performance Monitoring

- Track test execution times
- Monitor workflow success rates
- Watch for Claude Code timeout issues
- Observe GitHub API usage patterns

## 💡 Best Practices

1. **Run tests in order of complexity**: Start with `single-task`, then `basic-3-tasks`
2. **Use cleanup**: Enable cleanup for regular testing
3. **Monitor quotas**: Watch Claude Code and GitHub API usage
4. **Review artifacts**: Check logs and validation results for insights
5. **Test edge cases**: Use `error-recovery` scenario regularly