const fs = require('fs');
const { validateTaskIndex, validateParentIssue } = require('../utils/validation');
const { findStateComment, updateStateComment, updateTaskStatus } = require('../lib/state');
const { createTaskBranch, hasChanges, commitAndPushChanges, handleClaudeBranchMerge } = require('../lib/git');
const { createTaskPR, waitForBranchAvailability } = require('../lib/github');
const { createTaskTrigger, createCompletionComment } = require('../utils/comments');
const { getWorkflowToken } = require('../lib/auth');
const { TASK_STATUS, EXECUTION_STATUS } = require('../utils/constants');

async function executeSequentialTask({ github, context, core }) {
  const taskIndex = context.payload.client_payload?.task_index ?? 0;
  const parentIssue = validateParentIssue(context.payload.client_payload?.parent_issue);
  const previousBranch = context.payload.client_payload?.previous_branch ?? 'main';
  
  // Load state
  const stateResult = await findStateComment(github, context.repo.owner, context.repo.repo, parentIssue);
  if (!stateResult) {
    throw new Error('Sequential tasks state not found in issue comments');
  }
  
  const { state: sequentialState, comment_id: stateCommentId } = stateResult;
  
  // Check if all tasks completed
  if (taskIndex >= sequentialState.tasks.length) {
    sequentialState.status = EXECUTION_STATUS.COMPLETED;
    sequentialState.updated_at = new Date().toISOString();
    await updateStateComment(github, context.repo.owner, context.repo.repo, parentIssue, sequentialState, stateCommentId);
    
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: parentIssue,
      body: createCompletionComment(sequentialState.tasks.length, sequentialState.tasks)
    });
    
    return { status: 'all_completed', tasksCompleted: sequentialState.tasks.length };
  }

  const currentTask = sequentialState.tasks[taskIndex];
  console.log(`🎯 Executing sequential task ${taskIndex + 1} of ${sequentialState.tasks.length}: ${currentTask.title}`);

  // Update task status to in-progress
  updateTaskStatus(sequentialState, taskIndex, TASK_STATUS.IN_PROGRESS);
  sequentialState.current_task_index = taskIndex;
  sequentialState.status = EXECUTION_STATUS.IN_PROGRESS;
  await updateStateComment(github, context.repo.owner, context.repo.repo, parentIssue, sequentialState, stateCommentId);

  // Create task branch
  const taskBranch = currentTask.branch;
  console.log(`🌿 Creating task branch: ${taskBranch}`);
  await createTaskBranch(taskBranch, previousBranch);
  
  // Wait for branch availability
  await waitForBranchAvailability(github, context.repo.owner, context.repo.repo, taskBranch);
  
  // Create task context file for Claude
  const taskContext = createTaskContext(currentTask, taskIndex, sequentialState, taskBranch, previousBranch, parentIssue);
  fs.writeFileSync('current-task-context.json', JSON.stringify(taskContext, null, 2));
  
  console.log(`✅ Task execution environment prepared for Claude Code Action`);
  
  return {
    taskData: currentTask,
    taskIndex,
    totalTasks: sequentialState.tasks.length,
    previousBranch,
    currentBranch: taskBranch,
    parentIssue,
    sequentialContext: sequentialState.context,
    previousTasks: sequentialState.tasks.slice(0, taskIndex),
    stateCommentId
  };
}

async function handleTaskCompletion({ github, context, core, taskContext }) {
  const { taskIndex, currentBranch, previousBranch, parentIssue, stateCommentId } = taskContext;
  const workflowToken = getWorkflowToken();
  
  // Load current state
  const stateResult = await findStateComment(github, context.repo.owner, context.repo.repo, parentIssue);
  if (!stateResult) {
    throw new Error('Sequential tasks state not found for completion handling');
  }
  
  const sequentialState = stateResult.state;
  const currentTask = sequentialState.tasks[taskIndex];
  
  // Handle Claude branch merge if needed
  const actualBranch = handleClaudeBranchMerge(parentIssue, currentBranch, taskIndex);
  
  // Check for changes and commit if needed
  if (!hasChanges()) {
    updateTaskStatus(sequentialState, taskIndex, TASK_STATUS.NO_CHANGES);
    await updateStateComment(github, context.repo.owner, context.repo.repo, parentIssue, sequentialState, stateCommentId);
    
    // Trigger next task
    const nextTaskIndex = taskIndex + 1;
    if (nextTaskIndex < sequentialState.tasks.length) {
      await triggerNextTask(github, context, nextTaskIndex, actualBranch, parentIssue, sequentialState.tasks[nextTaskIndex]?.title);
    }
    
    return { status: 'no-changes', prNumber: null };
  }

  // Commit and push changes
  const changesCommitted = commitAndPushChanges(
    taskIndex, 
    currentTask, 
    sequentialState.tasks.slice(0, taskIndex), 
    actualBranch, 
    workflowToken, 
    context
  );
  
  if (!changesCommitted) {
    return { status: 'no-changes', prNumber: null };
  }

  // Create PR
  const baseBranch = previousBranch;
  const pr = await createTaskPR(
    github, 
    context, 
    taskIndex, 
    sequentialState.tasks.length, 
    currentTask, 
    sequentialState.tasks.slice(0, taskIndex), 
    sequentialState.context, 
    parentIssue, 
    actualBranch, 
    baseBranch
  );

  console.log(`✅ Created PR #${pr.number}: ${currentTask.title}`);

  // Update task status
  updateTaskStatus(sequentialState, taskIndex, TASK_STATUS.COMPLETED, pr.number);
  await updateStateComment(github, context.repo.owner, context.repo.repo, parentIssue, sequentialState, stateCommentId);

  // Trigger next task
  const nextTaskIndex = taskIndex + 1;
  if (nextTaskIndex < sequentialState.tasks.length) {
    await triggerNextTask(github, context, nextTaskIndex, actualBranch, parentIssue, sequentialState.tasks[nextTaskIndex]?.title);
  } else {
    sequentialState.status = EXECUTION_STATUS.COMPLETED;
    await updateStateComment(github, context.repo.owner, context.repo.repo, parentIssue, sequentialState, stateCommentId);
  }

  return { status: 'completed', prNumber: pr.number };
}

async function triggerNextTask(github, context, nextTaskIndex, previousBranch, parentIssue, taskTitle) {
  const triggerComment = createTaskTrigger(nextTaskIndex, previousBranch, parentIssue, taskTitle);
  await github.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: parentIssue,
    body: triggerComment
  });
  
  console.log(`✅ Successfully triggered next task ${nextTaskIndex + 1} via comment`);
}

function createTaskContext(currentTask, taskIndex, sequentialState, taskBranch, previousBranch, parentIssue) {
  return {
    currentTask: {
      taskNumber: taskIndex + 1,
      title: currentTask.title,
      description: currentTask.body,
      branch: taskBranch,
      previousBranch: previousBranch
    },
    sequentialExecution: {
      totalTasks: sequentialState.tasks.length,
      currentTaskIndex: taskIndex,
      originalContext: sequentialState.context,
      isFirstTask: taskIndex === 0,
      isLastTask: taskIndex === sequentialState.tasks.length - 1
    },
    previousImplementations: sequentialState.tasks.slice(0, taskIndex).map((task, idx) => ({
      taskNumber: idx + 1,
      title: task.title,
      description: task.body,
      status: task.status,
      branch: task.branch,
      completedAt: task.completed_at
    })),
    metadata: {
      parentIssue: parentIssue,
      createdAt: new Date().toISOString(),
      taskBranch: taskBranch,
      baseBranch: previousBranch
    }
  };
}

module.exports = {
  executeSequentialTask,
  handleTaskCompletion
};