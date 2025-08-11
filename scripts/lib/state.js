const { STATE_COMMENT_PREFIX, STATE_COMMENT_SUFFIX } = require('../utils/constants');
const { createStateComment: createStateCommentBody } = require('../utils/comments');

async function findStateComment(github, owner, repo, issueNumber) {
  try {
    const { data: comments } = await github.rest.issues.listComments({
      owner,
      repo,
      issue_number: issueNumber,
      per_page: 100
    });
    
    for (const comment of comments) {
      if (comment.body.includes(STATE_COMMENT_PREFIX)) {
        const startIndex = comment.body.indexOf(STATE_COMMENT_PREFIX) + STATE_COMMENT_PREFIX.length;
        const endIndex = comment.body.indexOf(STATE_COMMENT_SUFFIX);
        if (endIndex > startIndex) {
          const stateJson = comment.body.substring(startIndex, endIndex).trim();
          return {
            comment_id: comment.id,
            state: JSON.parse(stateJson)
          };
        }
      }
    }
    return null;
  } catch (error) {
    throw new Error(`Failed to load sequential state: ${error.message}`);
  }
}

async function createStateComment(github, owner, repo, issueNumber, state) {
  const commentBody = createStateCommentBody(state);
  const { data: comment } = await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: commentBody
  });
  return comment.id;
}

async function updateStateComment(github, owner, repo, issueNumber, newState, commentId) {
  const commentBody = createStateCommentBody(newState);
  await github.rest.issues.updateComment({
    owner,
    repo,
    comment_id: commentId,
    body: commentBody
  });
}

function createInitialState(tasks, parentIssue, context, runId) {
  return {
    context: context || 'No context provided',
    parent_issue: parentIssue ? parseInt(parentIssue) : null,
    tasks: tasks.map((task, index) => ({
      id: index + 1,
      title: task.title,
      body: task.body,
      status: 'pending',
      branch: `sequential/issue-${parentIssue || 'unknown'}/task-${index + 1}`,
      pr_number: null,
      created_at: new Date().toISOString(),
      completed_at: null,
      error_message: null
    })),
    current_task_index: 0,
    previous_branch: 'main',
    status: 'pending',
    started_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    workflow_run_id: runId
  };
}

function updateTaskStatus(state, taskIndex, status, prNumber = null, errorMessage = null) {
  if (state.tasks[taskIndex]) {
    state.tasks[taskIndex].status = status;
    state.tasks[taskIndex].completed_at = new Date().toISOString();
    if (prNumber) state.tasks[taskIndex].pr_number = prNumber;
    if (errorMessage) state.tasks[taskIndex].error_message = errorMessage;
  }
  state.updated_at = new Date().toISOString();
}

module.exports = {
  findStateComment,
  createStateComment,
  updateStateComment,
  createInitialState,
  updateTaskStatus
};