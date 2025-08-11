const fs = require('fs');

function validateTasksJson(filePath = 'tasks.json') {
  if (!fs.existsSync(filePath)) {
    throw new Error('tasks.json file was not created by Claude Code');
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const tasksData = JSON.parse(fileContent);

  if (!tasksData || typeof tasksData !== 'object') {
    throw new Error('tasks.json does not contain a valid object');
  }

  if (!Array.isArray(tasksData.tasks)) {
    throw new Error('tasks.json missing tasks array');
  }

  tasksData.tasks.forEach((task, i) => {
    if (!task.title || typeof task.title !== 'string') {
      throw new Error(`Task ${i + 1} has invalid title`);
    }
    if (!task.body || typeof task.body !== 'string') {
      throw new Error(`Task ${i + 1} has invalid body`);
    }
  });

  return tasksData;
}

function validateTaskIndex(taskIndex, totalTasks) {
  if (taskIndex < 0 || taskIndex >= totalTasks) {
    throw new Error(`Invalid task index: ${taskIndex}. Must be between 0 and ${totalTasks - 1}`);
  }
}

function validateParentIssue(parentIssue) {
  if (!parentIssue || isNaN(parseInt(parentIssue))) {
    throw new Error('Parent issue number required and must be valid');
  }
  return parseInt(parentIssue);
}

function validateBranchName(branchName) {
  if (!branchName || typeof branchName !== 'string' || branchName.trim() === '') {
    throw new Error('Branch name is required and must be a non-empty string');
  }
}

module.exports = {
  validateTasksJson,
  validateTaskIndex,
  validateParentIssue,
  validateBranchName
};