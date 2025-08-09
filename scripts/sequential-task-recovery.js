const fs = require('fs');
const path = require('path');

/**
 * Sequential Task Recovery Utilities
 * Provides functions for handling errors and recovering from failed sequential executions
 */

/**
 * Recover from a failed sequential execution
 * Can resume from any task index
 */
async function recoverSequentialExecution({ github, context, core, resumeFromTaskIndex = null }) {
  const stateFilePath = '.github/sequential-tasks-state.json';
  
  try {
    // Load current state
    if (!fs.existsSync(stateFilePath)) {
      throw new Error('Sequential tasks state file not found. Cannot recover without state.');
    }
    
    const sequentialState = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
    
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
    
    // Save updated state
    fs.writeFileSync(stateFilePath, JSON.stringify(sequentialState, null, 2));
    
    console.log(`✅ Recovery state prepared:`);
    console.log(`   - Resuming from task: ${resumeTaskIndex + 1}`);
    console.log(`   - Previous branch: ${previousBranch}`);
    console.log(`   - Task status reset: ${resumeTask.title}`);
    
    // Commit recovery state
    try {
      const { execSync } = require('child_process');
      execSync('git config user.name "Claude Recovery Bot"');
      execSync('git config user.email "claude-recovery@anthropic.com"');
      execSync(`git add "${stateFilePath}"`);
      execSync(`git commit -m "Recover sequential execution from Task ${resumeTaskIndex + 1}

- Resuming from: ${resumeTask.title}
- Previous branch: ${previousBranch}
- Recovery initiated manually

🔄 Sequential Recovery"`);
      execSync('git push origin HEAD');
      
      console.log('📝 Recovery state committed to repository');
    } catch (commitError) {
      console.log('⚠️ Warning: Failed to commit recovery state:', commitError.message);
    }
    
    // Trigger task execution
    const workflowToken = process.env.WORKFLOW_TRIGGER_TOKEN;
    if (workflowToken) {
      await github.rest.repos.createDispatchEvent({
        owner: context.repo.owner,
        repo: context.repo.repo,
        event_type: 'execute-sequential-task',
        client_payload: {
          task_index: resumeTaskIndex,
          previous_branch: previousBranch,
          trigger_source: 'manual_recovery'
        }
      });
      
      console.log(`🚀 Triggered recovery execution for Task ${resumeTaskIndex + 1}`);
    } else {
      console.log('⚠️ WORKFLOW_TRIGGER_TOKEN not available - manual trigger required');
      return { 
        status: 'recovery_prepared', 
        resumeTaskIndex, 
        previousBranch, 
        manualTriggerRequired: true 
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
}).join('\n')}

${'---'}
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
 * Get detailed status of sequential execution
 */
function getSequentialStatus() {
  const stateFilePath = '.github/sequential-tasks-state.json';
  
  if (!fs.existsSync(stateFilePath)) {
    return { status: 'no_sequential_execution', message: 'No sequential tasks state found' };
  }
  
  try {
    const sequentialState = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
    
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
      message: `Failed to parse sequential state: ${error.message}` 
    };
  }
}

/**
 * Reset sequential execution completely
 */
async function resetSequentialExecution({ github, context, confirmReset = false }) {
  if (!confirmReset) {
    throw new Error('Reset not confirmed. Pass confirmReset: true to proceed with reset.');
  }
  
  const stateFilePath = '.github/sequential-tasks-state.json';
  
  if (!fs.existsSync(stateFilePath)) {
    console.log('ℹ️ No sequential state to reset');
    return { status: 'no_state_to_reset' };
  }
  
  try {
    // Load current state for backup
    const sequentialState = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
    
    // Create backup
    const backupFileName = `sequential-tasks-state-backup-${Date.now()}.json`;
    fs.writeFileSync(backupFileName, JSON.stringify(sequentialState, null, 2));
    
    // Remove state file
    fs.unlinkSync(stateFilePath);
    
    console.log('🗑️ Sequential execution state reset');
    console.log(`📁 Backup saved as: ${backupFileName}`);
    
    // Commit reset
    try {
      const { execSync } = require('child_process');
      execSync('git config user.name "Claude Reset Bot"');
      execSync('git config user.email "claude-reset@anthropic.com"');
      execSync(`git add "${stateFilePath}" "${backupFileName}"`);
      execSync(`git commit -m "Reset sequential execution state

- State file removed
- Backup created: ${backupFileName}
- Ready for new sequential execution

🗑️ Sequential Reset"`);
      execSync('git push origin HEAD');
      
      console.log('📝 Reset committed to repository');
    } catch (commitError) {
      console.log('⚠️ Warning: Failed to commit reset:', commitError.message);
    }
    
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

**Backup**: State backed up as \`${backupFileName}\`

${'---'}
*You can now start a new sequential execution by providing new context.*`
      });
    }
    
    return { 
      status: 'reset_complete', 
      backupFile: backupFileName,
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
  resetSequentialExecution
};