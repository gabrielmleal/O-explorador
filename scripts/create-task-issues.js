const fs = require('fs');

module.exports = async ({ github, context, core }) => {
  // Set up GitHub client with workflow token for issues
  const workflowToken = process.env.WORKFLOW_TRIGGER_TOKEN;
  
  // Helper function to create issues with fallback
  const createIssue = async (issueData) => {
    try {
      return await github.rest.issues.create(issueData);
    } catch (error) {
      if (error.message.includes('Resource not accessible by personal access token')) {
        console.log('⚠️ PAT token lacks permissions for issues. This means:');
        console.log('   - Issues will be created with github-actions bot instead of your account');
        console.log('   - Workflow triggering may not work properly');
        console.log('   - Please check PAT permissions: issues:write, metadata:read, contents:read');
        
        // Log the specific error for debugging
        console.log(`PAT Error: ${error.message}`);
        throw error;
      }
      throw error;
    }
  };

  // Check if tasks.json exists
  if (!fs.existsSync('tasks.json')) {
    console.log('❌ tasks.json not found - Claude Code may have failed to generate the file');
    
    const parentIssue = process.env.PARENT_ISSUE_NUMBER || context.payload.issue?.number;
    if (parentIssue) {
      try {
        await github.rest.issues.createComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: parseInt(parentIssue),
          body: '❌ **Task decomposition failed** - Claude Code was unable to generate the tasks.json file. Please check the context input and try again.'
        });
      } catch (commentError) {
        console.log('Failed to create error comment, continuing with error:', commentError.message);
      }
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
      try {
        await github.rest.issues.createComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: parseInt(parentIssue),
          body: `❌ **Task decomposition failed** - tasks.json file is invalid: ${error.message}`
        });
      } catch (commentError) {
        console.log('Failed to create error comment, continuing with error:', commentError.message);
      }
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

  console.log(`Creating ${tasks.length} task issues...`);
  const createdTasks = [];

  // Create task progress tracking comment on parent issue if exists
  if (parentIssue) {
    try {
      await github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: parseInt(parentIssue),
        body: `## 🤖 Task Decomposition Complete

Created ${tasks.length} implementation task issues:

${tasks.map((task, i) => `- [ ] **Task ${i + 1}**: ${task.title}`).join('\n')}

${'---'}
*Each task issue will automatically trigger the implementation workflow to create a PR.*`
      });
    } catch (error) {
      console.log('Failed to create progress comment on parent issue:', error.message);
    }
  }

  // Create individual task issues
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const taskData = {
      id: i + 1,
      title: task.title,
      body: task.body,
      status: 'pending',
      parent_issue: parentIssue ? parseInt(parentIssue) : null
    };
    
    try {
      const issueBody = `## Task Description

${task.body}

## Task Data

\`\`\`json
${JSON.stringify(taskData, null, 2)}
\`\`\`

---

@claude Please implement this task.`;

      const issue = await createIssue({
        owner: context.repo.owner,
        repo: context.repo.repo,
        title: task.title,
        body: issueBody,
        labels: ['claude-task']
      });
      
      console.log(`✅ Task issue created - workflow will be triggered automatically`);
      console.log(`   Issue #${issue.data.number}: ${task.title}`);
      console.log(`   Contains @claude trigger for automatic implementation`);
      
      createdTasks.push({
        ...taskData,
        issue_number: issue.data.number,
        issue_url: issue.data.html_url
      });
      
    } catch (error) {
      console.log(`❌ Failed to create task issue: ${task.title}`);
      console.log(error.message);
    }
  }

  // Save created tasks info for artifacts
  fs.writeFileSync('created_tasks.json', JSON.stringify(createdTasks, null, 2));

  console.log(`✅ Successfully created ${createdTasks.length} task issues`);
  return createdTasks;
};