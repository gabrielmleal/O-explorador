const fs = require('fs');
const { execSync } = require('child_process');

// Import state management utilities
const { createStateCommentBody, findStateComment } = require('./setup-sequential-tasks');

// Helper function to update state in issue comments
async function updateStateComment(github, owner, repo, issueNumber, newState, commentId = null) {
  const stateCommentBody = createStateCommentBody(newState);
  
  if (commentId) {
    // Update existing comment
    await github.rest.issues.updateComment({
      owner,
      repo,
      comment_id: commentId,
      body: stateCommentBody
    });
  } else {
    // Create new comment
    const { data: comment } = await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: stateCommentBody
    });
    return comment.id;
  }
}

module.exports = async ({ github, context, core }) => {
  // Get task index and parent issue from payload
  const taskIndex = context.payload.client_payload?.task_index ?? 0;
  const parentIssue = context.payload.client_payload?.parent_issue;
  const previousBranch = context.payload.client_payload?.previous_branch ?? 'main';
  
  if (!parentIssue) {
    console.log('❌ Parent issue not provided in dispatch payload');
    core.setFailed('Parent issue required for state management');
    return;
  }

  // Load sequential tasks state from issue comments
  let sequentialState;
  let stateCommentId;
  try {
    console.log(`🔍 Loading sequential tasks state from issue #${parentIssue}`);
    console.log(`📊 Repository: ${context.repo.owner}/${context.repo.repo}`);
    console.log(`📨 Event: ${context.eventName}`);
    
    const stateResult = await findStateComment(github, context.repo.owner, context.repo.repo, parentIssue);
    
    if (!stateResult) {
      const errorMsg = `Sequential tasks state not found in issue comments for issue #${parentIssue}. Sequential execution may not be initialized properly.`;
      console.log('❌', errorMsg);
      
      // Try to post error comment on parent issue for debugging
      try {
        await github.rest.issues.createComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: parentIssue,
          body: `## ❌ Sequential Task Execution Error

**Error**: ${errorMsg}

**Debugging Information**:
- Repository: \`${context.repo.owner}/${context.repo.repo}\`
- Event: \`${context.eventName}\`
- Task Index: \`${taskIndex}\`
- Previous Branch: \`${previousBranch}\`

*This error occurred during sequential task preparation. Please check the workflow logs for more details.*`
        });
      } catch (commentError) {
        console.log('⚠️ Could not post error comment:', commentError.message);
      }
      
      throw new Error(errorMsg);
    }
    
    sequentialState = stateResult.state;
    stateCommentId = stateResult.comment_id;
    
    console.log(`✅ Loaded state with ${sequentialState.tasks.length} tasks`);
    console.log(`📋 Current execution status: ${sequentialState.status}`);
    console.log(`🔢 State comment ID: ${stateCommentId}`);
    
  } catch (error) {
    console.log('❌ Failed to load sequential tasks state:', error.message);
    console.log('🔍 Error details:', error);
    core.setFailed(`State management error: ${error.message}`);
    return;
  }

  
  console.log(`🎯 Executing sequential task ${taskIndex + 1} of ${sequentialState.tasks.length}`);
  console.log(`📂 Previous branch: ${previousBranch}`);

  // Validate task index
  if (taskIndex >= sequentialState.tasks.length) {
    console.log('🎉 All sequential tasks completed successfully!');
    
    // Update final state
    sequentialState.status = 'completed';
    sequentialState.updated_at = new Date().toISOString();
    
    try {
      await updateStateComment(github, context.repo.owner, context.repo.repo, parentIssue, sequentialState, stateCommentId);
    } catch (error) {
      console.log('Failed to update final state:', error.message);
    }
    
    // Create completion comment on parent issue
    if (sequentialState.parent_issue) {
      try {
        await github.rest.issues.createComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: sequentialState.parent_issue,
          body: `## 🎉 Sequential Task Execution Complete!

All ${sequentialState.tasks.length} tasks have been successfully implemented:

${sequentialState.tasks.map((task, i) => `- ✅ **Task ${i + 1}**: ${task.title} (PR #${task.pr_number || 'N/A'})`).join('\n')}

${'---'}

**Final Results:**
- 🔗 **${sequentialState.tasks.length} stacked PRs** created with progressive changes
- ⚡ **Sequential execution** completed successfully
- 📝 Each PR contains only its specific task changes
- 🏗️ Changes build progressively from task to task

*All PRs are ready for review and merging.*`
        });
      } catch (error) {
        console.log('Failed to create completion comment:', error.message);
      }
    }
    
    return { status: 'all_completed', tasksCompleted: sequentialState.tasks.length };
  }

  const currentTask = sequentialState.tasks[taskIndex];
  if (!currentTask) {
    throw new Error(`Task at index ${taskIndex} not found in sequential state`);
  }

  console.log(`📋 Current Task: ${currentTask.title}`);

  // Update task and overall status to in-progress
  currentTask.status = 'in-progress';
  sequentialState.current_task_index = taskIndex;
  sequentialState.status = 'in-progress';
  sequentialState.updated_at = new Date().toISOString();
  
  try {
    await updateStateComment(github, context.repo.owner, context.repo.repo, parentIssue, sequentialState, stateCommentId);
    console.log('✅ Updated task status to in-progress');
  } catch (error) {
    console.log('⚠️ Failed to update task status:', error.message);
  }

  // Configure git
  execSync('git config user.name "Claude Sequential Bot"');
  execSync('git config user.email "claude-sequential@anthropic.com"');

  // Checkout from the previous branch (this is critical for sequential execution)
  console.log(`🔄 Checking out from branch: ${previousBranch}`);
  try {
    // Fetch latest changes first
    execSync('git fetch origin');
    
    // Checkout the previous branch if it's not main
    if (previousBranch !== 'main') {
      try {
        // First check if branch exists remotely
        const remoteBranchExists = execSync(`git ls-remote --heads origin ${previousBranch}`, { encoding: 'utf8' }).trim();
        
        if (remoteBranchExists) {
          execSync(`git checkout -b temp-prev origin/${previousBranch}`, { stdio: 'pipe' });
          execSync(`git checkout ${previousBranch}`, { stdio: 'pipe' });
          console.log(`✅ Checked out existing branch: ${previousBranch}`);
        } else {
          console.log(`⚠️ Branch ${previousBranch} doesn't exist remotely, using main as base`);
          execSync('git checkout main');
        }
      } catch (error) {
        // If branch doesn't exist remotely, create it locally
        console.log(`⚠️ Branch ${previousBranch} doesn't exist remotely, using main as base`);
        execSync('git checkout main');
      }
    } else {
      execSync('git checkout main');
    }
  } catch (error) {
    console.log('⚠️ Warning: Could not checkout previous branch, using main:', error.message);
    execSync('git checkout main');
  }

  // Create new branch for current task
  const taskBranch = currentTask.branch;
  console.log(`🌿 Creating task branch: ${taskBranch}`);
  
  try {
    console.log(`🔧 Git configuration check`);
    console.log(`   - Current directory: ${process.cwd()}`);
    
    // Verify git repo
    try {
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
      console.log(`   - Git repo status: OK`);
    } catch (gitError) {
      throw new Error(`Not in a git repository: ${gitError.message}`);
    }
    
    // Delete branch if it already exists locally
    try {
      const localBranches = execSync('git branch --list', { encoding: 'utf8' });
      if (localBranches.includes(taskBranch)) {
        execSync(`git branch -D ${taskBranch}`);
        console.log(`🗑️ Deleted existing local branch: ${taskBranch}`);
      }
    } catch (e) {
      console.log(`ℹ️ No local branch to delete: ${taskBranch}`);
    }
    
    // Delete remote branch if it exists
    try {
      const remoteBranches = execSync('git branch -r', { encoding: 'utf8' });
      if (remoteBranches.includes(`origin/${taskBranch}`)) {
        execSync(`git push origin --delete ${taskBranch}`, { stdio: 'pipe' });
        console.log(`🗑️ Deleted existing remote branch: ${taskBranch}`);
      }
    } catch (e) {
      console.log(`ℹ️ No remote branch to delete: ${taskBranch}`);
    }
    
    // Create and checkout new branch
    console.log(`🌿 Creating new branch from current HEAD`);
    execSync(`git checkout -b ${taskBranch}`);
    console.log(`✅ Created and checked out new branch: ${taskBranch}`);
    
    // Verify branch creation
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    if (currentBranch !== taskBranch) {
      throw new Error(`Branch creation verification failed. Expected: ${taskBranch}, Actual: ${currentBranch}`);
    }
    
    // Create task execution context for Claude Code action BEFORE pushing
    const taskContext = {
      taskData: currentTask,
      taskIndex: taskIndex,
      totalTasks: sequentialState.tasks.length,
      previousBranch: previousBranch,
      currentBranch: taskBranch,
      parentIssue: sequentialState.parent_issue,
      sequentialContext: sequentialState.context,
      previousTasks: sequentialState.tasks.slice(0, taskIndex),
      stateCommentId: stateCommentId // Include state comment ID for updates
    };

    // Save task context for Claude Code action to use
    console.log(`📋 Creating task context file for Claude Code Action`);
    fs.writeFileSync('current-task-context.json', JSON.stringify(taskContext, null, 2));
    
    // Commit the context file to the branch before pushing
    console.log(`💾 Committing task context to branch`);
    execSync('git add current-task-context.json');
    execSync(`git commit -m "Add sequential task context for Task ${taskIndex + 1}: ${currentTask.title}

This context file contains all the information needed for Claude Code Action to understand and complete this sequential task.

Task ${taskIndex + 1}/${sequentialState.tasks.length}: ${currentTask.title}
Previous branch: ${previousBranch}
Parent issue: #${sequentialState.parent_issue || 'N/A'}"`);
    
    console.log(`✅ Task context committed to branch: ${taskBranch}`);

    // Push branch to remote immediately to ensure Claude Code Action can access it
    console.log(`🚀 Pushing branch with context to remote origin...`);
    execSync(`git push -u origin ${taskBranch}`, { stdio: ['pipe', 'pipe', 'pipe'] });
    console.log(`✅ Successfully pushed branch to remote: ${taskBranch}`);
    
    // Double-check remote branch exists
    try {
      const remoteBranchCheck = execSync(`git ls-remote --heads origin ${taskBranch}`, { encoding: 'utf8' });
      if (!remoteBranchCheck.trim()) {
        throw new Error(`Remote branch verification failed for ${taskBranch}`);
      }
      console.log(`🔍 Remote branch verification: ✅ ${taskBranch} exists on origin`);
    } catch (verifyError) {
      console.log(`⚠️ Remote branch verification warning: ${verifyError.message}`);
    }
    
  } catch (error) {
    console.log(`❌ Branch creation/push failed:`, error.message);
    console.log(`🔍 Current git status:`);
    try {
      const gitStatus = execSync('git status', { encoding: 'utf8' });
      console.log(gitStatus);
    } catch (statusError) {
      console.log(`Could not get git status: ${statusError.message}`);
    }
    
    throw new Error(`Failed to create and push task branch ${taskBranch}: ${error.message}`);
  }

  console.log('✅ Task execution environment prepared');
  console.log(`📝 Task: ${currentTask.title}`);
  console.log(`🌿 Branch: ${taskBranch}`);
  console.log(`📂 Base: ${previousBranch}`);
  console.log(`🔗 State comment ID: ${stateCommentId}`);
  console.log(`📄 Context file: current-task-context.json committed and pushed`);
  
  // Return the already-created taskContext
  return {
    taskData: currentTask,
    taskIndex: taskIndex,
    totalTasks: sequentialState.tasks.length,
    previousBranch: previousBranch,
    currentBranch: taskBranch,
    parentIssue: sequentialState.parent_issue,
    sequentialContext: sequentialState.context,
    previousTasks: sequentialState.tasks.slice(0, taskIndex),
    stateCommentId: stateCommentId
  };
};

// Post-implementation function to handle PR creation and next task triggering
module.exports.handleTaskCompletion = async ({ github, context, core, taskContext }) => {
  const workflowToken = process.env.WORKFLOW_TRIGGER_TOKEN;
  
  // Load current state from issue comments
  let sequentialState;
  let stateCommentId;
  try {
    if (!taskContext.parentIssue) {
      throw new Error('Parent issue not found in task context');
    }
    
    console.log(`🔍 Loading current sequential tasks state from issue #${taskContext.parentIssue}`);
    const stateResult = await findStateComment(github, context.repo.owner, context.repo.repo, taskContext.parentIssue);
    
    if (!stateResult) {
      throw new Error('Sequential tasks state not found in issue comments');
    }
    
    sequentialState = stateResult.state;
    stateCommentId = stateResult.comment_id;
    
    console.log(`✅ Loaded state for completion handling`);
  } catch (error) {
    throw new Error(`Failed to load sequential state: ${error.message}`);
  }

  const { taskIndex, currentBranch, previousBranch, taskData } = taskContext;
  
  // Check if any files were modified
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  if (!status.trim()) {
    console.log('⚠️ No changes made for this task');
    
    // Update task status
    sequentialState.tasks[taskIndex].status = 'no-changes';
    sequentialState.tasks[taskIndex].completed_at = new Date().toISOString();
    sequentialState.updated_at = new Date().toISOString();
    
    try {
      await updateStateComment(github, context.repo.owner, context.repo.repo, taskContext.parentIssue, sequentialState, stateCommentId);
    } catch (error) {
      console.log('Failed to update no-changes state:', error.message);
    }
    
    // Still trigger next task
    const nextTaskIndex = taskIndex + 1;
    if (nextTaskIndex < sequentialState.tasks.length) {
      await triggerNextTask(github, context, nextTaskIndex, currentBranch, workflowToken, taskContext.parentIssue);
    }
    
    return { status: 'no-changes', prNumber: null };
  }

  // Commit changes
  execSync('git add -A');
  execSync(`git commit -m "Sequential Task ${taskIndex + 1}: ${taskData.title}

${taskData.body}

This task builds on previous changes from:
${taskContext.previousTasks.map(t => `- Task ${t.id}: ${t.title}`).join('\n') || '- Starting from main branch'}

🤖 Generated with Claude Code Sequential Executor
Co-authored-by: Claude <claude@anthropic.com>"`);

  // Configure git credentials for push operation
  const workflowToken = process.env.WORKFLOW_TRIGGER_TOKEN || process.env.GITHUB_TOKEN;
  if (workflowToken) {
    console.log('🔐 Configuring git credentials for push...');
    // Configure git to use token for HTTPS authentication
    execSync(`git config credential.helper store`);
    execSync(`git config credential.https://github.com.username ${workflowToken}`);
    // Alternative approach: configure the remote URL with token
    const remoteUrl = `https://${workflowToken}@github.com/${context.repo.owner}/${context.repo.repo}.git`;
    execSync(`git remote set-url origin "${remoteUrl}"`);
  } else {
    console.log('⚠️ No authentication token found in environment');
  }

  // Push the task branch
  console.log(`🚀 Pushing branch: ${currentBranch}`);
  execSync(`git push origin ${currentBranch}`);

  // Create PR to previous branch (or main for first task)
  const baseBranch = previousBranch;
  console.log(`📝 Creating PR from ${currentBranch} to ${baseBranch}`);
  
  try {
    const { data: pr } = await github.rest.pulls.create({
      owner: context.repo.owner,
      repo: context.repo.repo,
      title: `[Sequential] Task ${taskIndex + 1}: ${taskData.title}`,
      head: currentBranch,
      base: baseBranch,
      body: `## Sequential Task ${taskIndex + 1} of ${sequentialState.tasks.length}

**Task**: ${taskData.title}

**Description**: ${taskData.body}

### Sequential Context

This PR is part of a sequential task execution chain:

${taskContext.previousTasks.length > 0 ? `**Previous Tasks Completed:**
${taskContext.previousTasks.map(t => `- ✅ Task ${t.id}: ${t.title}`).join('\n')}

**This PR builds on:** Changes from Task ${taskIndex} (${previousBranch})` : '**First Task:** This is the first task in the sequence, building from main branch'}

${taskIndex + 1 < sequentialState.tasks.length ? `**Next Task:** Task ${taskIndex + 2} will automatically trigger after this PR is created` : '🎉 **Final Task:** This is the last task in the sequence!'}

### Original Context

${sequentialState.context}

### Testing

- [ ] Code has been tested locally
- [ ] All tests pass  
- [ ] No linting errors
- [ ] Changes are compatible with previous sequential tasks

${'---'}
*This PR was automatically generated by Claude Code Sequential Executor for Task ${taskIndex + 1}*
${sequentialState.parent_issue ? `\nRelated to: #${sequentialState.parent_issue}` : ''}`
    });

    console.log(`✅ Created PR #${pr.number}: ${taskData.title}`);

    // Update task status
    sequentialState.tasks[taskIndex].status = 'completed';
    sequentialState.tasks[taskIndex].pr_number = pr.number;
    sequentialState.tasks[taskIndex].completed_at = new Date().toISOString();
    sequentialState.updated_at = new Date().toISOString();
    
    // Add PR labels
    await github.rest.issues.addLabels({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: pr.number,
      labels: ['claude-generated', 'sequential-task', `task-${taskIndex + 1}`, 'needs-review']
    });

    // Trigger next task if there are more tasks
    const nextTaskIndex = taskIndex + 1;
    if (nextTaskIndex < sequentialState.tasks.length) {
      // Save state before triggering next task
      try {
        await updateStateComment(github, context.repo.owner, context.repo.repo, taskContext.parentIssue, sequentialState, stateCommentId);
      } catch (error) {
        console.log('Failed to update completed state:', error.message);
      }
      
      await triggerNextTask(github, context, nextTaskIndex, currentBranch, workflowToken, taskContext.parentIssue);
      
      console.log(`🚀 Triggered next sequential task: ${nextTaskIndex + 1}`);
    } else {
      // All tasks completed
      sequentialState.status = 'completed';
      try {
        await updateStateComment(github, context.repo.owner, context.repo.repo, taskContext.parentIssue, sequentialState, stateCommentId);
      } catch (error) {
        console.log('Failed to update final completed state:', error.message);
      }
      
      console.log('🎉 All sequential tasks completed!');
    }

    return { status: 'completed', prNumber: pr.number };
    
  } catch (error) {
    // Update task status to failed
    sequentialState.tasks[taskIndex].status = 'failed';
    sequentialState.tasks[taskIndex].error_message = error.message;
    sequentialState.tasks[taskIndex].completed_at = new Date().toISOString();
    sequentialState.status = 'failed';
    sequentialState.updated_at = new Date().toISOString();
    
    try {
      await updateStateComment(github, context.repo.owner, context.repo.repo, taskContext.parentIssue, sequentialState, stateCommentId);
    } catch (stateError) {
      console.log('Failed to update failed state:', stateError.message);
    }
    
    throw error;
  }
};

// Helper function to trigger next task
async function triggerNextTask(github, context, nextTaskIndex, previousBranch, workflowToken, parentIssue) {
  if (!workflowToken) {
    throw new Error('WORKFLOW_TRIGGER_TOKEN required to trigger next task');
  }

  try {
    await github.rest.repos.createDispatchEvent({
      owner: context.repo.owner,
      repo: context.repo.repo,
      event_type: 'execute-sequential-task',
      client_payload: {
        task_index: nextTaskIndex,
        previous_branch: previousBranch,
        parent_issue: parentIssue,
        trigger_source: 'sequential_task_completion'
      }
    });
  } catch (error) {
    throw new Error(`Failed to trigger next task: ${error.message}`);
  }
}