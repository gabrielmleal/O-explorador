const fs = require('fs');

module.exports = async ({ github, context, core }) => {
  // Check if tasks.json exists
  if (!fs.existsSync('tasks.json')) {
    console.log('❌ tasks.json not found - Claude Code may have failed to generate the file');
    
    const parentIssue = process.env.PARENT_ISSUE_NUMBER || context.payload.issue?.number;
    if (parentIssue) {
      await github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: parseInt(parentIssue),
        body: '❌ **Task decomposition failed** - Claude Code was unable to generate the tasks.json file. Please check the context input and try again.'
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
    
    const parentIssue = process.env.PARENT_ISSUE_NUMBER || context.payload.issue?.number;
    if (parentIssue) {
      await github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: parseInt(parentIssue),
        body: `❌ **Task decomposition failed** - tasks.json file is invalid: ${error.message}`
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
  const parentIssue = process.env.PARENT_ISSUE_NUMBER || tasksData.parent_issue || context.payload.issue?.number;

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

  console.log(`Creating ${tasks.length} task comments...`);
  const createdTasks = [];

  // Create task progress tracking comment first
  const progressComment = await github.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: parseInt(parentIssue),
    body: `## 🤖 Task Decomposition Complete

Created ${tasks.length} implementation tasks:

${tasks.map((task, i) => `- [ ] **Task ${i + 1}**: ${task.title}`).join('\n')}

${'---'}
*Each task will automatically trigger Claude to create a PR when the task comment is created.*`
  });

  // Create individual task comments
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const taskData = {
      id: i + 1,
      title: task.title,
      body: task.body,
      status: 'pending',
      parent_issue: parseInt(parentIssue)
    };
    
    try {
      const comment = await github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: parseInt(parentIssue),
        body: `🤖 TASK-${i + 1}: ${JSON.stringify(taskData, null, 2)}

@claude Please implement this task.`
      });
      
      // Trigger task implementation workflow via repository dispatch
      await github.rest.repos.createDispatchEvent({
        owner: context.repo.owner,
        repo: context.repo.repo,
        event_type: 'implement-task',
        client_payload: {
          task_id: i + 1,
          task_data: taskData,
          comment_id: comment.data.id,
          issue_number: parseInt(parentIssue)
        }
      });
      
      createdTasks.push(taskData.id);
      console.log(`✅ Created task comment ${i + 1}: ${task.title}`);
      
    } catch (error) {
      console.log(`❌ Failed to create task comment: ${task.title}`);
      console.log(error.message);
    }
  }

  // Save created tasks info for artifacts
  fs.writeFileSync('created_tasks.json', JSON.stringify(createdTasks, null, 2));

  console.log(`✅ Successfully created ${createdTasks.length} task comments`);
  return createdTasks;
};