const { PR_LABELS, TIMEOUTS } = require('../utils/constants');
const { createPRBody } = require('../utils/comments');

async function createTaskPR(github, context, taskIndex, totalTasks, taskData, previousTasks, originalContext, parentIssue, actualBranch, baseBranch) {
  const { data: pr } = await github.rest.pulls.create({
    owner: context.repo.owner,
    repo: context.repo.repo,
    title: `[Sequential] Task ${taskIndex + 1}: ${taskData.title}`,
    head: actualBranch,
    base: baseBranch,
    body: createPRBody(taskIndex, totalTasks, taskData, previousTasks, originalContext, parentIssue)
  });

  await github.rest.issues.addLabels({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: pr.number,
    labels: [...PR_LABELS, `task-${taskIndex + 1}`]
  });

  return pr;
}

async function createComment(github, owner, repo, issueNumber, body) {
  const { data: comment } = await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body
  });
  return comment;
}

async function waitForBranchAvailability(github, owner, repo, branchName, maxRetries = 15) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      await github.rest.repos.getBranch({
        owner,
        repo,
        branch: branchName
      });
      return true;
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        throw new Error(`Branch ${branchName} not available after ${maxRetries * 3} seconds`);
      }
      await new Promise(resolve => setTimeout(resolve, TIMEOUTS.API_RETRY));
    }
  }
  return false;
}

async function handleApiError(error, operation, maxRetries = 3) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await operation();
    } catch (apiError) {
      retries++;
      if (retries >= maxRetries) {
        throw new Error(`${error.message} after ${maxRetries} retries: ${apiError.message}`);
      }
      await new Promise(resolve => setTimeout(resolve, TIMEOUTS.API_RETRY));
    }
  }
}

module.exports = {
  createTaskPR,
  createComment,
  waitForBranchAvailability,
  handleApiError
};