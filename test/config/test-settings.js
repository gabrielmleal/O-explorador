// E2E Test settings and configuration

const testSettings = {
  // Default timeouts (in milliseconds)
  timeouts: {
    workflowExecution: 900000,      // 15 minutes per workflow
    taskExecution: 1200000,        // 20 minutes per task
    stateUpdate: 60000,            // 1 minute for state updates
    branchCreation: 120000,        // 2 minutes for branch creation
    prCreation: 180000,            // 3 minutes for PR creation
    clauseCodeExecution: 1800000,  // 30 minutes for Claude Code
    overallTest: 2700000           // 45 minutes for full test
  },

  // Polling intervals (in milliseconds)
  intervals: {
    workflowCheck: 10000,          // Check workflows every 10 seconds
    stateCheck: 15000,             // Check state every 15 seconds
    branchCheck: 5000,             // Check branches every 5 seconds
    prCheck: 10000,                // Check PRs every 10 seconds
    generalPolling: 5000           // General polling interval
  },

  // Retry settings
  retries: {
    maxAttempts: 5,                // Maximum retry attempts
    backoffMultiplier: 2,          // Exponential backoff multiplier
    initialDelay: 1000,            // Initial retry delay (1 second)
    maxDelay: 30000               // Maximum retry delay (30 seconds)
  },

  // GitHub API settings
  github: {
    perPage: 100,                  // Results per API call
    maxCommentsToSearch: 100,      // Max comments to search through
    maxWorkflowRuns: 50,           // Max workflow runs to check
    rateLimitBuffer: 100           // Buffer for rate limit (requests)
  },

  // Validation settings
  validation: {
    strictMode: true,              // Enable strict validation
    allowPartialSuccess: false,    // Allow partial success in tests
    validateBranchAncestry: true,  // Check branch parent-child relationships
    validatePRStacking: true,      // Validate PR stacking is correct
    validateClaudeAttribution: true, // Check for Claude Code attribution
    requireAllLabels: true         // Require all expected labels
  },

  // Test artifact settings
  artifacts: {
    saveLogs: true,                // Save detailed logs
    saveState: true,               // Save state snapshots
    saveWorkflowRuns: true,        // Save workflow run details
    saveValidationResults: true,   // Save validation results
    logLevel: 'debug',             // Logging level: debug, info, warn, error
    maxLogSize: 10485760          // Max log file size (10MB)
  },

  // Cleanup settings
  cleanup: {
    closeTestIssues: true,         // Close test issues after completion
    deleteTestBranches: false,     // Keep test branches for inspection
    closePRs: false,               // Keep PRs open for review
    addCleanupComments: true,      // Add cleanup completion comments
    retentionDays: 7              // Keep test artifacts for 7 days
  },

  // Expected patterns and formats
  patterns: {
    sequentialBranch: /^sequential\/task-\d+$/,
    taskTrigger: /\[SEQUENTIAL-TASK-TRIGGER\]\s+task_index=(\d+)\s+previous_branch=([^\s]+)\s+parent_issue=(\d+)/,
    stateComment: /<!-- SEQUENTIAL_TASKS_STATE:(.*?):END_STATE -->/s,
    claudeAttribution: /Generated with \[Claude Code\]|Co-Authored-By: Claude/
  },

  // Expected labels
  labels: {
    required: ['sequential-context', 'e2e-test'],
    task: ['sequential-task'],
    optional: ['test-scenario', 'automated-test']
  },

  // Test result thresholds
  thresholds: {
    minWorkflowSuccessRate: 1.0,   // 100% workflow success required
    maxAllowedErrors: 0,           // No errors allowed
    minTaskCompletionRate: 1.0,    // 100% task completion required
    maxExecutionTime: 45           // Max execution time in minutes
  }
};

// Environment-specific overrides
const environmentOverrides = {
  development: {
    timeouts: {
      clauseCodeExecution: 3600000,  // 60 minutes in dev
      overallTest: 3600000          // 60 minutes total in dev
    },
    validation: {
      strictMode: false,
      allowPartialSuccess: true
    },
    cleanup: {
      closeTestIssues: false,       // Keep issues open in dev
      addCleanupComments: false
    }
  },

  testing: {
    artifacts: {
      logLevel: 'info'
    },
    cleanup: {
      retentionDays: 3
    }
  },

  production: {
    validation: {
      strictMode: true,
      requireAllLabels: true
    },
    thresholds: {
      maxAllowedErrors: 0
    },
    artifacts: {
      logLevel: 'warn'
    }
  }
};

// Merge settings with environment overrides
function getSettings(environment = 'production') {
  const overrides = environmentOverrides[environment] || {};
  
  // Deep merge settings with overrides
  return deepMerge(testSettings, overrides);
}

// Deep merge utility function
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

// Validate settings configuration
function validateSettings(settings) {
  const validation = {
    valid: true,
    warnings: [],
    errors: []
  };

  // Validate timeout values
  if (settings.timeouts.overallTest < settings.timeouts.clauseCodeExecution) {
    validation.errors.push('Overall test timeout is less than Claude Code execution timeout');
    validation.valid = false;
  }

  if (settings.timeouts.taskExecution < settings.timeouts.workflowExecution) {
    validation.warnings.push('Task execution timeout is less than workflow execution timeout');
  }

  // Validate intervals
  if (settings.intervals.workflowCheck > 30000) {
    validation.warnings.push('Workflow check interval is quite long (>30s)');
  }

  // Validate retry settings
  if (settings.retries.maxAttempts > 10) {
    validation.warnings.push('Very high retry attempt count (>10)');
  }

  if (settings.retries.maxDelay < settings.retries.initialDelay) {
    validation.errors.push('Max retry delay is less than initial delay');
    validation.valid = false;
  }

  return validation;
}

// Get timeout for specific operation
function getTimeout(operation, settings = null) {
  const config = settings || getSettings();
  
  const timeoutMap = {
    'workflow': config.timeouts.workflowExecution,
    'task': config.timeouts.taskExecution,
    'state': config.timeouts.stateUpdate,
    'branch': config.timeouts.branchCreation,
    'pr': config.timeouts.prCreation,
    'claude': config.timeouts.clauseCodeExecution,
    'test': config.timeouts.overallTest
  };

  return timeoutMap[operation] || config.timeouts.generalPolling;
}

// Get polling interval for specific operation
function getInterval(operation, settings = null) {
  const config = settings || getSettings();
  
  const intervalMap = {
    'workflow': config.intervals.workflowCheck,
    'state': config.intervals.stateCheck,
    'branch': config.intervals.branchCheck,
    'pr': config.intervals.prCheck,
    'general': config.intervals.generalPolling
  };

  return intervalMap[operation] || config.intervals.generalPolling;
}

// Export configuration
module.exports = {
  testSettings,
  environmentOverrides,
  getSettings,
  validateSettings,
  getTimeout,
  getInterval,
  deepMerge
};