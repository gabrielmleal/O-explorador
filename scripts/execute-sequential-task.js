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

  // Create new branch for current task
  const taskBranch = currentTask.branch;
  console.log(`🌿 Creating task branch: ${taskBranch}`);

  // Prepare sequential branch with accumulated changes from previous tasks
  console.log(`🔧 Preparing sequential branch building from: ${previousBranch}`);
  try {
    // Fetch latest changes first
    execSync('git fetch origin');
    
    // Delete existing local branch if it exists
    try {
      execSync(`git branch -D ${taskBranch}`, { stdio: 'pipe' });
      console.log(`🗑️ Deleted existing local branch: ${taskBranch}`);
    } catch (e) {
      // Branch doesn't exist locally, that's fine
    }
    
    // FIXED: Start from the previous task's branch to accumulate changes sequentially
    if (previousBranch !== 'main') {
      console.log(`🔧 SEQUENTIAL ACCUMULATION: Starting from previous task branch: ${previousBranch}`);
      
      // Check if previous branch exists remotely
      try {
        const remoteBranchCheck = execSync(`git ls-remote --heads origin ${previousBranch}`, { encoding: 'utf8' }).trim();
        
        if (remoteBranchCheck) {
          console.log(`📥 Checking out previous task branch: ${previousBranch}`);
          
          // Checkout previous branch (with all accumulated changes)
          execSync(`git checkout -b temp-${taskBranch} origin/${previousBranch}`);
          
          // Create our new task branch from the previous task's branch
          execSync(`git checkout -b ${taskBranch}`);
          console.log(`✅ Created ${taskBranch} from ${previousBranch} (with all previous task changes)`);
          
          // Clean up temp branch
          execSync(`git branch -D temp-${taskBranch}`, { stdio: 'pipe' });
          
          // Verify we have the accumulated changes
          const comparison = execSync(`git rev-list --count main..HEAD`, { encoding: 'utf8' }).trim();
          const commitsAhead = parseInt(comparison);
          console.log(`📊 Sequential branch has ${commitsAhead} commits ahead of main (accumulated from previous tasks)`);
          
        } else {
          console.log(`⚠️ Previous branch ${previousBranch} doesn't exist remotely - falling back to main`);
          // Fallback to main for first task or if previous branch missing
          execSync('git checkout main');
          execSync('git pull origin main');
          execSync(`git checkout -b ${taskBranch}`);
          console.log(`✅ Created ${taskBranch} from main (fallback)`);
        }
        
      } catch (error) {
        console.log(`⚠️ Could not checkout previous branch ${previousBranch}: ${error.message}`);
        console.log(`🔄 Falling back to main branch`);
        // Fallback to main
        execSync('git checkout main');
        execSync('git pull origin main');
        execSync(`git checkout -b ${taskBranch}`);
        console.log(`✅ Created ${taskBranch} from main (error fallback)`);
      }
      
    } else {
      console.log(`ℹ️ First task - starting from main branch`);
      // First task starts from main
      execSync('git checkout main');
      execSync('git pull origin main');
      execSync(`git checkout -b ${taskBranch}`);
      console.log(`✅ Created first task branch: ${taskBranch} from main`);
    }
    
  } catch (error) {
    console.log('❌ Critical error during sequential branch setup:', error.message);
    console.log('⚠️ Emergency fallback to main branch');
    execSync('git checkout main || git checkout -b main');
    execSync(`git checkout -b ${taskBranch} || echo "Branch creation failed"`);
  }
  
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
    
    // Check if we're currently on the target branch
    const currentBranchName = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    console.log(`📍 Currently on branch: ${currentBranchName}`);
    
    // If we're already on the target branch, just continue with it
    if (currentBranchName === taskBranch) {
      console.log(`✅ Already on target branch ${taskBranch} - continuing with existing branch`);
    } else {
      // Delete existing local branch if it exists (but we're not on it)
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
    }
    
    // Verify branch creation
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    if (currentBranch !== taskBranch) {
      throw new Error(`Branch creation verification failed. Expected: ${taskBranch}, Actual: ${currentBranch}`);
    }
    
    console.log(`📋 Preparing task execution context for Claude Code Action`);
    
    // Create simplified task context (keeping minimal info for completion handler)
    const taskContext = {
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
    
    // CRITICAL FIX: Create detailed context file for Claude
    console.log(`📝 Creating comprehensive task context file for Claude...`);
    
    // Analyze what files were changed in previous tasks to provide context
    let previousImplementations = [];
    let modifiedFiles = [];
    
    if (taskIndex > 0) {
      console.log(`🔍 Analyzing previous task implementations for context...`);
      
      // Get list of files that were modified from main to current branch
      try {
        const filesList = execSync('git diff --name-only main..HEAD', { encoding: 'utf8' }).trim();
        if (filesList) {
          modifiedFiles = filesList.split('\n').filter(f => f.trim());
          console.log(`📁 Files modified in previous tasks: ${modifiedFiles.length} files`);
        }
      } catch (error) {
        console.log(`⚠️ Could not analyze file changes: ${error.message}`);
      }
      
      // Create implementation summaries for previous tasks
      sequentialState.tasks.slice(0, taskIndex).forEach((task, idx) => {
        previousImplementations.push({
          taskNumber: idx + 1,
          title: task.title,
          description: task.body,
          status: task.status,
          branch: task.branch,
          completedAt: task.completed_at
        });
      });
    }
    
    // Create comprehensive context for Claude
    const claudeContext = {
      // Current task information
      currentTask: {
        taskNumber: taskIndex + 1,
        title: currentTask.title,
        description: currentTask.body,
        branch: taskBranch,
        previousBranch: previousBranch
      },
      
      // Sequential execution context
      sequentialExecution: {
        totalTasks: sequentialState.tasks.length,
        currentTaskIndex: taskIndex,
        originalContext: sequentialState.context,
        isFirstTask: taskIndex === 0,
        isLastTask: taskIndex === sequentialState.tasks.length - 1
      },
      
      // Previous task implementations (CRITICAL for avoiding re-implementation)
      previousImplementations: previousImplementations,
      
      // Files that have been modified by previous tasks
      modifiedFiles: modifiedFiles,
      
      // Implementation strategy for current task
      implementationStrategy: {
        buildOnPrevious: taskIndex > 0,
        implementOnlyCurrentTask: true,
        avoidReDevelopment: taskIndex > 0,
        scopeBoundary: `Implement only the functionality described in "${currentTask.title}" - do NOT re-implement features from previous tasks`
      },
      
      // Metadata for completion tracking
      metadata: {
        parentIssue: sequentialState.parent_issue,
        stateCommentId: stateCommentId,
        createdAt: new Date().toISOString(),
        taskBranch: taskBranch,
        baseBranch: previousBranch
      }
    };
    
    // Write context file for Claude
    const contextFile = 'current-task-context.json';
    fs.writeFileSync(contextFile, JSON.stringify(claudeContext, null, 2));
    
    console.log(`✅ Context file created: ${contextFile}`);
    console.log(`📋 Context summary:`);
    console.log(`   - Current task: ${currentTask.title}`);
    console.log(`   - Previous tasks: ${previousImplementations.length}`);
    console.log(`   - Modified files from previous: ${modifiedFiles.length}`);
    console.log(`   - Implementation strategy: ${taskIndex > 0 ? 'Build incrementally' : 'Start from scratch'}`);
    console.log(`   - Claude will now have full context about previous implementations`);
    
    // Also stage the context file so it's available to Claude
    execSync(`git add ${contextFile}`);
    console.log(`📝 Context file staged for Claude Code Action access`);

    // Push branch to remote immediately to ensure Claude Code Action can access it
    console.log(`🚀 Pushing branch to remote origin...`);
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
  console.log(`📋 Task ready for Claude Code Action execution`);
  
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
  const workflowToken = process.env.WORKFLOW_TRIGGER_TOKEN || process.env.GITHUB_TOKEN;
  
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

  // Update task context with complete data from sequential state
  const { taskIndex, currentBranch, previousBranch } = taskContext;
  const currentTask = sequentialState.tasks[taskIndex];
  
  if (!currentTask) {
    throw new Error(`Task at index ${taskIndex} not found in sequential state`);
  }
  
  // Update task context with complete task data from state
  taskContext.taskData = currentTask;
  taskContext.previousTasks = sequentialState.tasks.slice(0, taskIndex);
  taskContext.sequentialContext = sequentialState.context;
  
  console.log(`📋 Task context updated with complete data from state`);
  console.log(`   - Task: ${currentTask.title}`);
  console.log(`   - Previous tasks: ${taskContext.previousTasks.length}`);
  
  const taskData = taskContext.taskData;
  
  // Detect if Claude created its own branch and use it directly
  let actualBranch = currentBranch;
  
  try {
    // Check if Claude created a branch with pattern claude/issue-{parentIssue}-*
    const claudeBranchPattern = `claude/issue-${taskContext.parentIssue}-`;
    console.log(`🔍 Checking for Claude-created branch with pattern: ${claudeBranchPattern}*`);
    
    // Get all remote branches
    const remoteBranches = execSync('git branch -r', { encoding: 'utf8' });
    const claudeBranches = remoteBranches.split('\n')
      .map(branch => branch.trim().replace('origin/', ''))
      .filter(branch => branch.startsWith(claudeBranchPattern))
      .sort()
      .reverse(); // Most recent first
    
    console.log(`🔍 Found Claude branches: ${JSON.stringify(claudeBranches)}`);
    
    if (claudeBranches.length > 0) {
      // Use Claude's branch directly for PR
      const claudeBranch = claudeBranches[0];
      console.log(`✅ Claude created its own branch: ${claudeBranch}`);
      console.log(`🎯 Using Claude's branch directly for PR (no merging needed)`);
      
      // Verify Claude's branch has changes
      try {
        const comparison = execSync(`git rev-list --count main..origin/${claudeBranch}`, { encoding: 'utf8' }).trim();
        const commitsAhead = parseInt(comparison);
        
        if (commitsAhead > 0) {
          console.log(`📊 Claude's branch has ${commitsAhead} commits ahead of main`);
          
          // For sequential continuity, merge Claude's changes back to sequential branch
          console.log(`🔀 Merging Claude's changes to sequential branch for next task continuity`);
          try {
            // Switch to sequential branch and merge Claude's changes
            execSync(`git checkout ${currentBranch}`);
            execSync(`git merge origin/${claudeBranch} --no-edit -m "Merge Claude's implementation from ${claudeBranch}"`);
            
            console.log(`✅ Merged Claude's changes into sequential branch: ${currentBranch}`);
            actualBranch = currentBranch; // Use sequential branch with all changes
            
            // Verify final state
            const finalComparison = execSync(`git rev-list --count main..HEAD`, { encoding: 'utf8' }).trim();
            const finalCommits = parseInt(finalComparison);
            console.log(`📊 Sequential branch now has ${finalCommits} commits ahead of main`);
            
          } catch (mergeError) {
            console.log(`❌ Failed to merge Claude's changes back: ${mergeError.message}`);
            console.log(`🔄 Using Claude's branch directly: ${claudeBranch}`);
            actualBranch = claudeBranch;
          }
        } else {
          console.log(`⚠️ Claude's branch has no commits ahead of main, using sequential branch`);
        }
      } catch (comparisonError) {
        console.log(`⚠️ Could not compare branches, using Claude's branch anyway: ${claudeBranch}`);
        actualBranch = claudeBranch;
      }
    } else {
      console.log(`✅ No Claude-specific branch found - Claude worked on sequential branch: ${currentBranch}`);
    }
    
  } catch (error) {
    console.log(`⚠️ Branch detection failed: ${error.message}`);
    console.log(`🔄 Using sequential branch: ${currentBranch}`);
  }
  
  // Update context with actual branch being used
  if (actualBranch !== currentBranch) {
    taskContext.currentBranch = actualBranch;
    console.log(`📝 Using branch: ${actualBranch} (Claude's branch)`);
  } else {
    console.log(`📝 Using branch: ${actualBranch} (sequential branch)`);
  }
  
  // Check if we're using Claude's branch (which already has changes) or need to check working directory
  if (actualBranch !== currentBranch) {
    // Using Claude's branch - changes are already committed and pushed by Claude
    console.log(`✅ Using Claude's branch with changes already committed and pushed`);
  } else {
    // Using sequential branch - check if any files were modified
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
        const nextTaskTitle = sequentialState.tasks[nextTaskIndex]?.title;
        await triggerNextTask(github, context, nextTaskIndex, actualBranch, workflowToken, taskContext.parentIssue, nextTaskTitle);
      }
      
      return { status: 'no-changes', prNumber: null };
    }

    // Commit and push changes on sequential branch
    console.log('💾 Committing changes to sequential branch...');
    
    // Commit changes
    execSync('git add -A');
    execSync(`git commit -m "Sequential Task ${taskIndex + 1}: ${taskData.title}

${taskData.body}

This task builds on previous changes from:
${taskContext.previousTasks.map(t => `- Task ${t.id}: ${t.title}`).join('\n') || '- Starting from main branch'}

🤖 Generated with Claude Code Sequential Executor
Co-authored-by: Claude <claude@anthropic.com>"`);

    // Configure git authentication for push operation
    if (workflowToken) {
      console.log('🔐 Configuring git authentication with workflow token');
      
      // Configure git remote URL with token for authentication
      const repoUrl = `https://x-access-token:${workflowToken}@github.com/${context.repo.owner}/${context.repo.repo}.git`;
      console.log(`🔧 Setting git remote URL with token authentication`);
      execSync(`git remote set-url origin ${repoUrl}`);
      
      // Configure git credential helper
      execSync('git config --local credential.helper ""');
      execSync('git config --local http.https://github.com/.extraheader ""');
      
    } else {
      console.log('⚠️ No authentication token found in environment - attempting push without explicit authentication');
    }

    // Push the task branch
    console.log(`🚀 Pushing branch: ${actualBranch}`);
    execSync(`git push origin ${actualBranch}`);
    
    // Clean up git remote URL after push for security
    if (workflowToken) {
      console.log('🧹 Cleaning up git remote URL after push');
      const cleanRepoUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}.git`;
      execSync(`git remote set-url origin ${cleanRepoUrl}`);
    }
  }

  // At this point, actualBranch has the changes (either Claude's branch or committed sequential branch)
  console.log(`✅ Branch ${actualBranch} ready for PR creation`);

  // Create PR to previous branch (or main for first task)
  const baseBranch = previousBranch;
  console.log(`📝 Creating PR from ${actualBranch} to ${baseBranch}`);
  
  try {
    const { data: pr } = await github.rest.pulls.create({
      owner: context.repo.owner,
      repo: context.repo.repo,
      title: `[Sequential] Task ${taskIndex + 1}: ${taskData.title}`,
      head: actualBranch,
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
    
    // ENHANCED: Analyze and track what was actually implemented
    console.log('📊 Analyzing implementation changes for state tracking...');
    try {
      // Get list of files that were modified in this task
      const changedFiles = execSync(`git diff --name-only ${previousBranch}..HEAD`, { encoding: 'utf8' }).trim();
      const modifiedFiles = changedFiles ? changedFiles.split('\n').filter(f => f.trim()) : [];
      
      // Get detailed diff stats
      const diffStats = execSync(`git diff --stat ${previousBranch}..HEAD`, { encoding: 'utf8' }).trim();
      const diffSummary = execSync(`git diff --numstat ${previousBranch}..HEAD`, { encoding: 'utf8' }).trim();
      
      // Count code changes
      let linesAdded = 0, linesRemoved = 0;
      if (diffSummary) {
        diffSummary.split('\n').forEach(line => {
          const [added, removed] = line.split('\t');
          if (!isNaN(added) && !isNaN(removed)) {
            linesAdded += parseInt(added);
            linesRemoved += parseInt(removed);
          }
        });
      }
      
      // Update implementation tracking in state
      sequentialState.tasks[taskIndex].implementation = {
        filesCreated: modifiedFiles.filter(f => {
          // Check if file was newly created by seeing if it exists in previous branch
          try {
            execSync(`git show ${previousBranch}:${f}`, { stdio: 'pipe' });
            return false; // File existed, so it was modified not created
          } catch (e) {
            return true; // File didn't exist, so it was created
          }
        }),
        filesModified: modifiedFiles.filter(f => {
          // Check if file was modified (existed in previous branch)
          try {
            execSync(`git show ${previousBranch}:${f}`, { stdio: 'pipe' });
            return true; // File existed, so it was modified
          } catch (e) {
            return false; // File didn't exist, so it was created not modified
          }
        }),
        functionalityImplemented: [taskData.title], // Basic functionality list
        dependencies: taskIndex > 0 ? [`task-${taskIndex}`] : [],
        implementationSummary: `Implemented "${taskData.title}": ${modifiedFiles.length} files changed, +${linesAdded}/-${linesRemoved} lines`,
        codeChangesCount: { added: linesAdded, removed: linesRemoved, files: modifiedFiles.length },
        testsCovered: modifiedFiles.filter(f => f.includes('test') || f.includes('spec')),
        integrationPoints: modifiedFiles // Files that integrate with other parts
      };
      
      console.log(`📊 Implementation tracking updated:`);
      console.log(`   - Files modified: ${modifiedFiles.length}`);
      console.log(`   - Code changes: +${linesAdded}/-${linesRemoved} lines`);
      console.log(`   - Implementation summary: ${sequentialState.tasks[taskIndex].implementation.implementationSummary}`);
      
    } catch (analysisError) {
      console.log('⚠️ Could not analyze implementation changes:', analysisError.message);
      // Set basic implementation tracking even if analysis fails
      sequentialState.tasks[taskIndex].implementation = {
        filesCreated: [],
        filesModified: [],
        functionalityImplemented: [taskData.title],
        dependencies: taskIndex > 0 ? [`task-${taskIndex}`] : [],
        implementationSummary: `Completed "${taskData.title}" (analysis failed)`,
        codeChangesCount: null,
        testsCovered: [],
        integrationPoints: []
      };
    }
    
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
      
      const nextTaskTitle = sequentialState.tasks[nextTaskIndex]?.title;
      await triggerNextTask(github, context, nextTaskIndex, actualBranch, workflowToken, taskContext.parentIssue, nextTaskTitle);
      
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

// Helper function to trigger next task using issue comment
async function triggerNextTask(github, context, nextTaskIndex, previousBranch, workflowToken, parentIssue, taskTitle) {
  try {
    console.log(`🚀 Triggering next task: ${nextTaskIndex + 1}`);
    console.log(`   - Previous branch: ${previousBranch}`);
    console.log(`   - Parent issue: ${parentIssue}`);
    console.log(`   - Task title: ${taskTitle}`);
    
    // Create a sequential task trigger comment
    const triggerComment = `[SEQUENTIAL-TASK-TRIGGER] task_index=${nextTaskIndex} previous_branch=${previousBranch} parent_issue=${parentIssue}

⚡ **Sequential Task ${nextTaskIndex + 1} Starting**

@claude Task ${nextTaskIndex} completed successfully. Automatically triggering next task in sequence.

**Next Task (${nextTaskIndex + 1})**: ${taskTitle || 'Task title not available'}

*This is an automated trigger comment - the sequential workflow will now execute the next task.*`;

    console.log(`📝 Creating trigger comment for task ${nextTaskIndex + 1}...`);
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: parentIssue,
      body: triggerComment
    });
    
    console.log(`✅ Successfully triggered next task ${nextTaskIndex + 1} via comment`);
    console.log(`🔍 The sequential-task-executor workflow should now pick up this trigger`);
  } catch (error) {
    console.log(`❌ Failed to trigger next task ${nextTaskIndex + 1}:`, error.message);
    throw new Error(`Failed to trigger next task: ${error.message}`);
  }
}