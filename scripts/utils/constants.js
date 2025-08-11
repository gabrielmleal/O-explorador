// Sequential Workflow Constants
module.exports = {
  // State management
  STATE_COMMENT_PREFIX: '<!-- SEQUENTIAL_TASKS_STATE:',
  STATE_COMMENT_SUFFIX: ':END_STATE -->',
  
  // Branch patterns
  BRANCH_PREFIX: 'sequential',
  CLAUDE_BRANCH_PATTERN: 'claude/issue-',
  
  // Task statuses
  TASK_STATUS: {
    PENDING: 'pending',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed',
    FAILED: 'failed',
    NO_CHANGES: 'no-changes'
  },
  
  // Sequential execution statuses
  EXECUTION_STATUS: {
    PENDING: 'pending',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed',
    FAILED: 'failed'
  },
  
  // Trigger patterns
  TRIGGERS: {
    SEQUENTIAL_TASK: '[SEQUENTIAL-TASK-TRIGGER]',
    CLAUDE_MENTION: '@claude'
  },
  
  // PR labels
  PR_LABELS: ['claude-generated', 'sequential-task', 'needs-review'],
  
  // Timeouts (in milliseconds)
  TIMEOUTS: {
    BRANCH_AVAILABILITY: 45000,
    API_RETRY: 3000,
    TASK_COMPLETION: 30000
  },
  
  // Temporary files to clean up
  TEMP_FILES: [
    'current-task-context.json',
    'output.txt',
    'task-output.txt',
    'claude-output.txt',
    'tasks.json',
    '.claude-context'
  ]
};