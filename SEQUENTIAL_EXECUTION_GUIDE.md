# Sequential Task Execution Guide

## Overview

This is a sophisticated sequential task execution system where each task builds on the changes from previous tasks, creating a chain of stacked PRs for progressive implementation.

## Architecture

### Sequential Flow
1. **Context Analysis**: Decompose requirements into sequential tasks
2. **Task Preparation**: Set up state management and task chain
3. **Sequential Execution**: Execute tasks one by one, each building on previous changes
4. **Progressive PRs**: Create stacked PRs that show incremental changes
5. **Automatic Chaining**: Automatically trigger next task when current completes

### Key Components

#### Workflows
- `context-to-sequential-tasks.yml`: Initial setup and task decomposition
- `sequential-task-executor.yml`: Individual task execution with chaining
- `sequential-task-recovery.yml`: Manual recovery and management operations

#### Scripts
- `setup-sequential-tasks.js`: Task decomposition and state initialization
- `execute-sequential-task.js`: Task execution and PR creation with chaining
- `sequential-task-recovery.js`: Error handling and recovery utilities

#### State Management
- `.github/sequential-tasks-state.json`: Persistent state tracking all tasks and progress

## How to Use

### 1. Start Sequential Execution

**Option A: Manual Workflow Trigger**
1. Go to Actions → "Context to Sequential Tasks"
2. Click "Run workflow"
3. Provide your context/requirements
4. Optionally set max tasks (default: 10)

**Option B: Issue-based Trigger**
1. Create a new issue
2. Add the `sequential-context` label
3. Write your requirements in the issue body
4. The workflow will automatically trigger

### 2. Monitor Progress

The system will:
- Create a progress comment on the parent issue
- Execute tasks sequentially, one at a time
- Create PRs that stack on top of each other
- Automatically trigger the next task when current completes
- Provide progress updates throughout execution

### 3. Review Stacked PRs

Each task creates a PR with:
- **Base Branch**: Previous task's branch (or main for first task)
- **Changes**: Only the current task's specific changes
- **Context**: Information about previous tasks and sequential context
- **Labels**: `sequential-task`, `claude-generated`, `needs-review`

### PR Stack Example:
```
main
├── PR #1: sequential/task-1 → main (Task 1 changes)
    ├── PR #2: sequential/task-2 → sequential/task-1 (Task 2 changes)
        └── PR #3: sequential/task-3 → sequential/task-2 (Task 3 changes)
```

## Testing the Complete Flow

### Test Scenario 1: Simple Feature Implementation

**Context:**
```
Create a simple user authentication system with:
1. User registration endpoint
2. Login endpoint with JWT tokens
3. Protected route middleware
4. Basic user profile management
```

**Expected Results:**
- 4 sequential tasks created
- Each task builds on the previous implementation
- Task 1: User registration endpoint
- Task 2: Login endpoint (uses registration model)
- Task 3: JWT middleware (uses login tokens)
- Task 4: Profile management (uses authentication)

### Test Scenario 2: Frontend + Backend Integration

**Context:**
```
Build a todo application with:
1. Express.js API backend with CRUD operations
2. React frontend with todo list component
3. API integration between frontend and backend
4. Add basic styling and responsive design
```

**Expected Results:**
- Sequential implementation where frontend tasks use the API from backend tasks
- Proper integration between components
- Each PR shows incremental progress

### Test Scenario 3: Error Recovery Testing

1. **Start a sequential execution**
2. **Manually interrupt** (cancel workflow or introduce error)
3. **Use recovery workflow**:
   - Go to Actions → "Sequential Task Recovery"
   - Choose "status" to see current state
   - Choose "recover" to resume from failed task
   - Choose "reset" to start fresh (with backup)

## Recovery Operations

### Check Status
```bash
# Via workflow
Actions → Sequential Task Recovery → Run workflow → Select "status"
```

### Recover from Failure
```bash
# Via workflow
Actions → Sequential Task Recovery → Run workflow → Select "recover"
# Optionally specify task index to resume from
```

### Complete Reset
```bash
# Via workflow  
Actions → Sequential Task Recovery → Run workflow → Select "reset"
# Type "RESET" in confirm field
```

### Manual State Management
```bash
# Check state file directly
cat .github/sequential-tasks-state.json

# View task progress
jq '.tasks[] | {id, title, status, pr_number}' .github/sequential-tasks-state.json
```

## Configuration

### Sequential Settings in `config/workflow-config.yml`:

```yaml
task_decomposition:
  enable_sequential_execution: true
  sequential_execution_mode: true
  sequential_settings:
    branch_prefix: "sequential"
    auto_trigger_next_task: true
    max_chain_length: 20

triggers:
  sequential_context:
    enabled: true
    label: "sequential-context"

pr_creation:
  sequential_pr_settings:
    enable_stacked_prs: true
    base_branch_strategy: "previous_task"
```

## Troubleshooting

### Common Issues

#### 1. Workflow Not Triggering
- Check `WORKFLOW_TRIGGER_TOKEN` secret is configured
- Verify issue has `sequential-context` label
- Check workflow permissions

#### 2. Task Execution Stuck
- Use recovery workflow with "status" action
- Check workflow logs for errors
- Use "recover" action to resume

#### 3. PR Creation Failed
- Check repository permissions
- Verify branch exists and is accessible
- Check for merge conflicts

#### 4. State File Issues
- State file should be in `.github/sequential-tasks-state.json`
- Use recovery workflow to check/reset state
- Check file permissions and git status

### Debug Commands

```bash
# Check current branch
git branch --show-current

# Check recent commits
git log --oneline -10

# Check workflow status
gh run list --workflow=sequential-task-executor.yml

# Check PRs
gh pr list --label=sequential-task

# Check state file
cat .github/sequential-tasks-state.json | jq '.'
```

## Best Practices

### For Context Input
- Be specific about requirements
- Consider task dependencies and logical ordering
- Break down complex features into implementable steps
- Provide clear success criteria

### For Code Review
- Review PRs in sequence (Task 1 first, then Task 2, etc.)
- Each PR should be independently reviewable
- Later PRs build on approved changes from earlier PRs
- Consider the cumulative effect of all changes

### For Project Management
- Use issues to track overall progress
- Monitor the sequential state file for detailed status
- Use recovery workflows for error handling
- Keep sequential chains reasonably sized (≤ 10 tasks)

## Advanced Usage

### Custom Recovery Scripts
The recovery utilities can be used programmatically:

```javascript
const recovery = require('./scripts/sequential-task-recovery.js');

// Get status
const status = recovery.getSequentialStatus();

// Recover from specific task
await recovery.recoverSequentialExecution({
  github, context, core,
  resumeFromTaskIndex: 2 // Resume from task 3
});

// Reset everything
await recovery.resetSequentialExecution({
  github, context,
  confirmReset: true
});
```

### State File Schema
```json
{
  "context": "Original context input",
  "parent_issue": 123,
  "tasks": [{
    "id": 1,
    "title": "Task title",
    "body": "Task description", 
    "status": "completed",
    "branch": "sequential/task-1",
    "pr_number": 456,
    "created_at": "2025-01-09T12:00:00Z",
    "completed_at": "2025-01-09T12:30:00Z",
    "error_message": null
  }],
  "current_task_index": 0,
  "previous_branch": "main",
  "status": "in-progress",
  "started_at": "2025-01-09T12:00:00Z",
  "updated_at": "2025-01-09T12:30:00Z"
}
```

## Support

For issues or questions:
1. Check this guide for common solutions
2. Review workflow logs in GitHub Actions
3. Use the recovery workflows for diagnostics
4. Check the state file for current execution status
5. Create an issue with detailed error information if needed