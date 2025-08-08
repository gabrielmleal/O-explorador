const fs = require('fs');
const settings = require('./workflow-settings');

module.exports = async ({ github, context }) => {
  // Check if tasks.json exists
  if (!fs.existsSync('tasks.json')) {
    console.log('❌ tasks.json not found - Claude Code may have failed to generate the file');
    
    const parentIssue = process.env.PARENT_ISSUE_NUMBER;
    if (parentIssue) {
      await github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: parseInt(parentIssue),
        body: settings.messages.noTasksFile
      });
    }
    
    throw new Error('tasks.json file was not created by Claude Code');
  }

  // Read and parse tasks with error handling
  let tasksData;
  try {
    const fileContent = fs.readFileSync('tasks.json', 'utf8');
    tasksData = JSON.parse(fileContent);
  } catch (error) {
    console.log('❌ Failed to parse tasks.json:', error.message);
    
    const parentIssue = process.env.PARENT_ISSUE_NUMBER;
    if (parentIssue) {
      await github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: parseInt(parentIssue),
        body: settings.messages.invalidJson(error.message)
      });
    }
    
    throw new Error('Invalid tasks.json file');
  }

  // Validate JSON structure
  if (!tasksData || typeof tasksData !== 'object') {
    throw new Error('tasks.json does not contain a valid object');
  }

  if (!Array.isArray(tasksData.tasks)) {
    throw new Error('tasks.json missing tasks array');
  }

  const tasks = tasksData.tasks;
  const parentIssue = tasksData.parent_issue;

  // Validate individual tasks
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (!task.title || typeof task.title !== 'string') {
      throw new Error(`Task ${i + 1} has invalid title`);
    }
    if (!task.body || typeof task.body !== 'string') {
      throw new Error(`Task ${i + 1} has invalid body`);
    }
  }

  if (tasks.length === 0) {
    console.log('⚠️ No tasks found to create');
    return [];
  }

  console.log(`Creating ${tasks.length} issues...`);
  const createdIssues = [];

  // Create issues for each task
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    
    // Add parent reference if applicable
    let issueBody = task.body;
    if (parentIssue) {
      issueBody += `\n\n---\n*Part of #${parentIssue}*`;
    }
    
    // MANDATORY: Add @claude mention to trigger automation
    issueBody += `\n\n@claude Please implement this task.`;
    
    try {
      const { data: issue } = await github.rest.issues.create({
        owner: context.repo.owner,
        repo: context.repo.repo,
        title: task.title,
        body: issueBody,
        labels: settings.issueLabels
      });
      
      createdIssues.push(issue.number);
      console.log(`✅ Created issue #${issue.number}: ${task.title}`);
      
    } catch (error) {
      console.log(`❌ Failed to create issue: ${task.title}`);
      console.log(error.message);
    }
  }

  // Save created issues for summary
  fs.writeFileSync('created_issues.json', JSON.stringify(createdIssues, null, 2));

  // Post summary comment on parent issue if applicable
  if (parentIssue && createdIssues.length > 0) {
    let comment = settings.messages.taskComplete(createdIssues.length);
    
    createdIssues.forEach((issueNum, idx) => {
      const taskTitle = tasks[idx]?.title || `Task ${idx + 1}`;
      comment += `- [ ] #${issueNum}: ${taskTitle}\n`;
    });
    
    comment += settings.messages.taskFooter;
    
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: parentIssue,
      body: comment
    });
  }

  console.log(`✅ Successfully created ${createdIssues.length} issues`);
  return createdIssues;
};