const { createStateCommentBody, findStateComment } = require('./setup-sequential-tasks');

/**
 * Sequential Task Recovery Utilities
 * Provides functions for handling errors and recovering from failed sequential executions
 * Updated to use issue-based state management
 */

/**
 * Reconstruct sequential execution state from existing PRs and issue history
 * Useful when state comments are missing or corrupted
 */
async function reconstructStateFromPRs(github, owner, repo, parentIssue) {
  console.log('🔍 Attempting to reconstruct state from existing PRs and issues...');
  
  try {
    // Get all PRs with sequential-task label
    const { data: prs } = await github.rest.pulls.list({
      owner,
      repo,
      state: 'all',
      sort: 'created',
      direction: 'asc'
    });
    
    const sequentialPRs = prs.filter(pr => 
      pr.labels.some(label => label.name === 'sequential-task') ||
      pr.title.includes('[Sequential]')
    );
    
    if (sequentialPRs.length === 0) {
      throw new Error('No sequential task PRs found for reconstruction');
    }
    
    console.log(`📋 Found ${sequentialPRs.length} sequential PRs to analyze`);
    
    // Extract task information from PRs
    const reconstructedTasks = [];
    for (const pr of sequentialPRs) {
      const taskMatch = pr.title.match(/Task (\d+)(?::|\\s-\\s)(.+)$/);
      if (taskMatch) {
        const taskIndex = parseInt(taskMatch[1]) - 1;
        const taskTitle = taskMatch[2].replace(/^\\[Sequential\\]\\s*/, '');
        
        reconstructedTasks[taskIndex] = {
          id: taskIndex + 1,
          title: taskTitle,
          body: pr.body || 'Reconstructed from PR',
          status: pr.state === 'closed' && pr.merged_at ? 'completed' : 'pending',
          branch: pr.head.ref,
          pr_number: pr.number,
          created_at: pr.created_at,
          completed_at: pr.merged_at,
          error_message: null
        };
      }
    }
    
    // Fill in any gaps
    const maxTaskIndex = Math.max(...reconstructedTasks.map((_, i) => i).filter(i => reconstructedTasks[i]));
    for (let i = 0; i <= maxTaskIndex; i++) {
      if (!reconstructedTasks[i]) {
        reconstructedTasks[i] = {
          id: i + 1,
          title: `Task ${i + 1} (Reconstructed)`,
          body: 'Task details not available from reconstruction',
          status: 'pending',
          branch: `sequential/task-${i + 1}`,
          pr_number: null,
          created_at: new Date().toISOString(),
          completed_at: null,
          error_message: null
        };
      }
    }
    
    // Determine current task index
    const currentTaskIndex = reconstructedTasks.findIndex(task => 
      task.status === 'pending' || task.status === 'failed' || task.status === 'in-progress'
    );
    
    const reconstructedState = {
      context: 'Reconstructed from existing PRs and issues',
      parent_issue: parentIssue,
      tasks: reconstructedTasks.filter(task => task), // Remove empty slots
      current_task_index: currentTaskIndex >= 0 ? currentTaskIndex : 0,
      previous_branch: currentTaskIndex > 0 ? reconstructedTasks[currentTaskIndex - 1]?.branch || 'main' : 'main',
      status: currentTaskIndex >= 0 ? 'in-progress' : 'completed',
      started_at: reconstructedTasks[0]?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      workflow_run_id: 'reconstructed'
    };
    
    console.log(`✅ State reconstruction complete: ${reconstructedState.tasks.length} tasks found`);
    return reconstructedState;
    
  } catch (error) {
    console.log('❌ State reconstruction failed:', error.message);
    throw error;
  }
}

/**
 * Recover from a failed sequential execution
 * Can resume from any task index
 */
async function recoverSequentialExecution({ github, context, core, resumeFromTaskIndex = null, parentIssue = null }) {
  if (!parentIssue) {
    throw new Error('Parent issue number required for recovery');
  }
  
  try {
    // First try to load existing state from issue comments
    let sequentialState;
    let stateCommentId;
    
    console.log(`🔍 Looking for sequential state in issue #${parentIssue}`);
    const stateResult = await findStateComment(github, context.repo.owner, context.repo.repo, parentIssue);
    
    if (stateResult) {
      sequentialState = stateResult.state;
      stateCommentId = stateResult.comment_id;
      console.log('✅ Found existing state comment');
    } else {
      console.log('⚠️ No state comment found, attempting reconstruction from PRs...');
      sequentialState = await reconstructStateFromPRs(github, context.repo.owner, context.repo.repo, parentIssue);
      
      // Create new state comment with reconstructed state
      const stateCommentBody = createStateCommentBody(sequentialState);
      const { data: comment } = await github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: parentIssue,
        body: stateCommentBody
      });
      stateCommentId = comment.id;
      console.log('✅ Created new state comment with reconstructed data');
    }
    
    console.log('📊 Current Sequential State:');
    console.log(`   - Status: ${sequentialState.status}`);
    console.log(`   - Total tasks: ${sequentialState.tasks.length}`);
    console.log(`   - Current task index: ${sequentialState.current_task_index}`);
    
    // Determine which task to resume from
    let resumeTaskIndex;
    if (resumeFromTaskIndex !== null) {
      resumeTaskIndex = resumeFromTaskIndex;
    } else {
      // Find the first failed or pending task
      resumeTaskIndex = sequentialState.tasks.findIndex(task => 
        task.status === 'failed' || task.status === 'pending' || task.status === 'in-progress'
      );
      
      if (resumeTaskIndex === -1) {
        console.log('✅ All tasks are already completed. No recovery needed.');
        return { status: 'no_recovery_needed', completedTasks: sequentialState.tasks.length };
      }
    }
    
    // Validate resume task index
    if (resumeTaskIndex < 0 || resumeTaskIndex >= sequentialState.tasks.length) {
      throw new Error(`Invalid resume task index: ${resumeTaskIndex}. Must be between 0 and ${sequentialState.tasks.length - 1}`);
    }
    
    const resumeTask = sequentialState.tasks[resumeTaskIndex];
    console.log(`🔄 Resuming from Task ${resumeTaskIndex + 1}: ${resumeTask.title}`);
    
    // Determine the previous branch
    let previousBranch = 'main';
    if (resumeTaskIndex > 0) {
      // Find the last completed task before this one
      for (let i = resumeTaskIndex - 1; i >= 0; i--) {
        const prevTask = sequentialState.tasks[i];
        if (prevTask.status === 'completed') {
          previousBranch = prevTask.branch;
          break;
        }
      }
    }
    
    // Reset the task status if it was failed
    if (resumeTask.status === 'failed') {
      resumeTask.status = 'pending';
      resumeTask.error_message = null;
    }
    
    // Update state for recovery
    sequentialState.current_task_index = resumeTaskIndex;
    sequentialState.status = 'in-progress';
    sequentialState.updated_at = new Date().toISOString();
    
    // Update state comment
    try {
      const stateCommentBody = createStateCommentBody(sequentialState);
      await github.rest.issues.updateComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        comment_id: stateCommentId,
        body: stateCommentBody
      });
      console.log('✅ Updated state comment with recovery information');
    } catch (updateError) {
      console.log('⚠️ Warning: Failed to update state comment:', updateError.message);
    }
    
    console.log(`✅ Recovery state prepared:`);
    console.log(`   - Resuming from task: ${resumeTaskIndex + 1}`);
    console.log(`   - Previous branch: ${previousBranch}`);
    console.log(`   - Task status reset: ${resumeTask.title}`);
    
    // Trigger task execution using recovery comment
    try {
      const triggerComment = `[SEQUENTIAL-TASK-TRIGGER] task_index=${resumeTaskIndex} previous_branch=${previousBranch} parent_issue=${parentIssue}

🔄 **Sequential Task Recovery Started**

@claude Manually resuming sequential execution from Task ${resumeTaskIndex + 1} due to recovery operation.

**Resuming Task (${resumeTaskIndex + 1})**: ${resumeTask.title}

*This is an automated recovery trigger comment - the sequential workflow will now execute the specified task.*`;

      await github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: parentIssue,
        body: triggerComment
      });
      
      console.log(`🚀 Triggered recovery execution for Task ${resumeTaskIndex + 1} via comment`);
    } catch (error) {
      console.log('⚠️ Failed to trigger recovery execution:', error.message);
      return { 
        status: 'recovery_prepared', 
        resumeTaskIndex, 
        previousBranch, 
        manualTriggerRequired: true,
        error: error.message
      };
    }
    
    // Create recovery comment if parent issue exists
    if (sequentialState.parent_issue) {
      await github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: sequentialState.parent_issue,
        body: `## 🔄 Sequential Execution Recovery

**Recovery Status**: Successfully resumed sequential execution

**Resuming From**: Task ${resumeTaskIndex + 1} - ${resumeTask.title}
**Previous Branch**: ${previousBranch}
**Trigger Source**: Manual recovery

### Recovery Details:

${sequentialState.tasks.map((task, i) => {
  const icon = task.status === 'completed' ? '✅' : 
               task.status === 'failed' ? '❌' : 
               task.status === 'in-progress' ? '🔄' :
               i === resumeTaskIndex ? '🎯' : '⏳';
  const status = i === resumeTaskIndex ? 'RESUMING' : task.status.toUpperCase();
  return `- ${icon} **Task ${i + 1}**: ${task.title} (${status})`;
}).join('\\n')}

---
*Sequential execution will continue from the resumed task automatically...*`
      });
    }
    
    return { 
      status: 'recovery_triggered', 
      resumeTaskIndex, 
      previousBranch, 
      taskTitle: resumeTask.title 
    };
    
  } catch (error) {
    console.log('❌ Recovery failed:', error.message);
    throw error;
  }
}

/**
 * Get detailed status of sequential execution from issue comments
 */
async function getSequentialStatus({ github, owner, repo, parentIssue }) {
  if (!parentIssue) {
    return { status: 'no_parent_issue', message: 'Parent issue number required' };
  }
  
  try {
    console.log(`🔍 Loading sequential status from issue #${parentIssue}`);
    const stateResult = await findStateComment(github, owner, repo, parentIssue);
    
    if (!stateResult) {
      return { status: 'no_sequential_execution', message: 'No sequential tasks state found in issue comments' };
    }
    
    const sequentialState = stateResult.state;
    
    const taskStatusCounts = sequentialState.tasks.reduce((counts, task) => {
      counts[task.status] = (counts[task.status] || 0) + 1;
      return counts;
    }, {});
    
    const status = {
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
    
    return status;
  } catch (error) {
    return { 
      status: 'error', 
      message: `Failed to load sequential state: ${error.message}` 
    };
  }
}

/**
 * Reset sequential execution completely by removing state comment
 */
async function resetSequentialExecution({ github, context, parentIssue, confirmReset = false }) {
  if (!confirmReset) {
    throw new Error('Reset not confirmed. Pass confirmReset: true to proceed with reset.');
  }
  
  if (!parentIssue) {
    throw new Error('Parent issue number required for reset');
  }
  
  try {
    // Find and load current state for backup
    console.log(`🔍 Looking for sequential state in issue #${parentIssue}`);
    const stateResult = await findStateComment(github, context.repo.owner, context.repo.repo, parentIssue);
    
    if (!stateResult) {
      console.log('ℹ️ No sequential state to reset');
      return { status: 'no_state_to_reset' };
    }
    
    const sequentialState = stateResult.state;
    const stateCommentId = stateResult.comment_id;
    
    // Create backup comment with the current state
    const backupTimestamp = new Date().toISOString();
    const backupCommentBody = `## 🗄️ Sequential State Backup (${backupTimestamp})

\\`\\`\\`json
${JSON.stringify(sequentialState, null, 2)}
\\`\\`\\`

**Backup Details:**
- Original state comment ID: ${stateCommentId}
- Tasks backed up: ${sequentialState.tasks.length}
- Status at backup: ${sequentialState.status}
- Reset timestamp: ${backupTimestamp}

*This backup was created before resetting sequential execution.*`;
    
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: parentIssue,
      body: backupCommentBody
    });
    
    // Delete the state comment
    await github.rest.issues.deleteComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      comment_id: stateCommentId
    });
    
    console.log('🗑️ Sequential execution state reset');
    console.log(`📁 Backup saved in issue comment`);
    
    // Create reset comment if parent issue exists
    if (sequentialState.parent_issue) {
      await github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: sequentialState.parent_issue,
        body: `## 🗑️ Sequential Execution Reset

**Reset Status**: Sequential execution state has been completely reset

**Previous State**:
- Total tasks: ${sequentialState.tasks.length}
- Completed tasks: ${sequentialState.tasks.filter(t => t.status === 'completed').length}
- Status: ${sequentialState.status}

**Backup**: State backed up in previous comment

---
*You can now start a new sequential execution by providing new context.*`
      });
    }
    
    return { 
      status: 'reset_complete', 
      backupCreated: true,
      totalTasks: sequentialState.tasks.length 
    };
    
  } catch (error) {
    console.log('❌ Reset failed:', error.message);
    throw error;
  }
}

module.exports = {
  recoverSequentialExecution,
  getSequentialStatus,
  resetSequentialExecution,
  reconstructStateFromPRs
};