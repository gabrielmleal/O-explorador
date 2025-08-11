const { findStateComment, updateStateComment, createStateComment } = require('../lib/state');
const { createComment } = require('../lib/github');
const { createTaskTrigger } = require('../utils/comments');
const { TASK_STATUS, EXECUTION_STATUS } = require('../utils/constants');

async function getSequentialStatus(github, owner, repo, parentIssue) {
  if (!parentIssue) {
    return { status: 'no_parent_issue', message: 'Parent issue number required' };
  }
  
  try {
    const stateResult = await findStateComment(github, owner, repo, parentIssue);
    if (!stateResult) {
      return { status: 'no_sequential_execution', message: 'No sequential tasks state found in issue comments' };
    }
    
    const sequentialState = stateResult.state;
    const taskStatusCounts = sequentialState.tasks.reduce((counts, task) => {
      counts[task.status] = (counts[task.status] || 0) + 1;
      return counts;
    }, {});
    
    return {
      overall_status: sequentialState.status,
      total_tasks: sequentialState.tasks.length,
      current_task_index: sequentialState.current_task_index,
      completed_tasks: taskStatusCounts.completed || 0,
      failed_tasks: taskStatusCounts.failed || 0,
      pending_tasks: taskStatusCounts.pending || 0,
      in_progress_tasks: taskStatusCounts['in-progress'] || 0,
      no_changes_tasks: taskStatusCounts['no-changes'] || 0,
      started_at: sequentialState.started_at,
      updated_at: sequentialState.updated_at,
      parent_issue: sequentialState.parent_issue,
      tasks: sequentialState.tasks.map((task, index) => ({
        index,
        id: task.id,
        title: task.title,
        status: task.status,
        branch: task.branch,
        pr_number: task.pr_number,
        error_message: task.error_message
      }))
    };
  } catch (error) {
    return { 
      status: 'error', 
      message: `Failed to load sequential state: ${error.message}` 
    };
  }
}

async function recoverSequentialExecution({ github, context, core, resumeFromTaskIndex = null, parentIssue }) {
  if (!parentIssue) {
    throw new Error('Parent issue number required for recovery');
  }
  
  // Load existing state
  const stateResult = await findStateComment(github, context.repo.owner, context.repo.repo, parentIssue);
  if (!stateResult) {
    throw new Error('Sequential tasks state not found for recovery');
  }
  
  const { state: sequentialState, comment_id: stateCommentId } = stateResult;
  
  // Determine which task to resume from
  let resumeTaskIndex;
  if (resumeFromTaskIndex !== null) {
    resumeTaskIndex = resumeFromTaskIndex;
  } else {
    resumeTaskIndex = sequentialState.tasks.findIndex(task => 
      task.status === TASK_STATUS.FAILED || 
      task.status === TASK_STATUS.PENDING || 
      task.status === TASK_STATUS.IN_PROGRESS
    );
    
    if (resumeTaskIndex === -1) {
      return { status: 'no_recovery_needed', completedTasks: sequentialState.tasks.length };
    }
  }
  
  // Validate resume task index
  if (resumeTaskIndex < 0 || resumeTaskIndex >= sequentialState.tasks.length) {
    throw new Error(`Invalid resume task index: ${resumeTaskIndex}. Must be between 0 and ${sequentialState.tasks.length - 1}`);
  }
  
  const resumeTask = sequentialState.tasks[resumeTaskIndex];
  
  // Determine the previous branch
  let previousBranch = 'main';
  if (resumeTaskIndex > 0) {
    for (let i = resumeTaskIndex - 1; i >= 0; i--) {
      const prevTask = sequentialState.tasks[i];
      if (prevTask.status === TASK_STATUS.COMPLETED) {
        previousBranch = prevTask.branch;
        break;
      }
    }
  }
  
  // Reset the task status if it was failed
  if (resumeTask.status === TASK_STATUS.FAILED) {
    resumeTask.status = TASK_STATUS.PENDING;
    resumeTask.error_message = null;
  }
  
  // Update state for recovery
  sequentialState.current_task_index = resumeTaskIndex;
  sequentialState.status = EXECUTION_STATUS.IN_PROGRESS;
  sequentialState.updated_at = new Date().toISOString();
  
  // Update state comment
  await updateStateComment(github, context.repo.owner, context.repo.repo, parentIssue, sequentialState, stateCommentId);
  
  // Trigger task execution
  const triggerComment = createTaskTrigger(resumeTaskIndex, previousBranch, parentIssue, resumeTask.title)
    .replace('⚡ **Sequential Task', '🔄 **Sequential Task Recovery')
    .replace('@claude Automatically triggering', '@claude Manually resuming sequential execution due to recovery operation.\n\n**Resuming Task');
  
  await createComment(github, context.repo.owner, context.repo.repo, parentIssue, triggerComment);
  
  // Create recovery comment
  await createComment(github, context.repo.owner, context.repo.repo, parentIssue, 
    `## 🔄 Sequential Execution Recovery

**Recovery Status**: Successfully resumed sequential execution

**Resuming From**: Task ${resumeTaskIndex + 1} - ${resumeTask.title}
**Previous Branch**: ${previousBranch}
**Trigger Source**: Manual recovery

### Recovery Details:

${sequentialState.tasks.map((task, i) => {
  const icon = task.status === TASK_STATUS.COMPLETED ? '✅' : 
               task.status === TASK_STATUS.FAILED ? '❌' : 
               task.status === TASK_STATUS.IN_PROGRESS ? '🔄' :
               i === resumeTaskIndex ? '🎯' : '⏳';
  const status = i === resumeTaskIndex ? 'RESUMING' : task.status.toUpperCase();
  return `- ${icon} **Task ${i + 1}**: ${task.title} (${status})`;
}).join('\n')}

---
*Sequential execution will continue from the resumed task automatically...*`);
  
  return { 
    status: 'recovery_triggered', 
    resumeTaskIndex, 
    previousBranch, 
    taskTitle: resumeTask.title 
  };
}

async function resetSequentialExecution({ github, context, parentIssue, confirmReset = false }) {
  if (!confirmReset) {
    throw new Error('Reset not confirmed. Pass confirmReset: true to proceed with reset.');
  }
  
  if (!parentIssue) {
    throw new Error('Parent issue number required for reset');
  }
  
  // Find and load current state for backup
  const stateResult = await findStateComment(github, context.repo.owner, context.repo.repo, parentIssue);
  if (!stateResult) {
    return { status: 'no_state_to_reset' };
  }
  
  const sequentialState = stateResult.state;
  const stateCommentId = stateResult.comment_id;
  
  // Create backup comment
  const backupTimestamp = new Date().toISOString();
  await createComment(github, context.repo.owner, context.repo.repo, parentIssue,
    `## 🗄️ Sequential State Backup (${backupTimestamp})

\`\`\`json
${JSON.stringify(sequentialState, null, 2)}
\`\`\`

**Backup Details:**
- Original state comment ID: ${stateCommentId}
- Tasks backed up: ${sequentialState.tasks.length}
- Status at backup: ${sequentialState.status}
- Reset timestamp: ${backupTimestamp}

*This backup was created before resetting sequential execution.*`);
  
  // Delete the state comment
  await github.rest.issues.deleteComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    comment_id: stateCommentId
  });
  
  // Create reset comment
  await createComment(github, context.repo.owner, context.repo.repo, parentIssue,
    `## 🗑️ Sequential Execution Reset

**Reset Status**: Sequential execution state has been completely reset

**Previous State**:
- Total tasks: ${sequentialState.tasks.length}
- Completed tasks: ${sequentialState.tasks.filter(t => t.status === TASK_STATUS.COMPLETED).length}
- Status: ${sequentialState.status}

**Backup**: State backed up in previous comment

---
*You can now start a new sequential execution by providing new context.*`);
  
  return { 
    status: 'reset_complete', 
    backupCreated: true,
    totalTasks: sequentialState.tasks.length 
  };
}

module.exports = {
  getSequentialStatus,
  recoverSequentialExecution,
  resetSequentialExecution
};