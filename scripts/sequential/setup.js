const fs = require('fs');
const { validateTasksJson, validateParentIssue } = require('../utils/validation');
const { createInitialState, createStateComment } = require('../lib/state');
const { createComment } = require('../lib/github');
const { createProgressComment, createTaskTrigger } = require('../utils/comments');

async function setupSequentialTasks({ github, context, core }) {
  try {
    // Validate tasks.json exists and is valid
    const tasksData = validateTasksJson();
    const tasks = tasksData.tasks;
    
    if (tasks.length === 0) {
      throw new Error('No tasks found to create');
    }

    // Get parent issue
    const parentIssue = validateParentIssue(
      process.env.PARENT_ISSUE_NUMBER || 
      tasksData.parent_issue || 
      context.payload.issue?.number
    );

    const contextData = context.payload.inputs?.context || 
                       context.payload.issue?.body || 
                       'No context provided';

    // Create sequential state
    const sequentialState = createInitialState(tasks, parentIssue, contextData, context.runId);

    // Create progress comment
    await createComment(github, context.repo.owner, context.repo.repo, parentIssue, 
      createProgressComment(tasks));

    // Create state comment
    await createStateComment(github, context.repo.owner, context.repo.repo, 
      parentIssue, sequentialState);

    // Trigger first task
    await createComment(github, context.repo.owner, context.repo.repo, parentIssue,
      createTaskTrigger(0, 'main', parentIssue, tasks[0]?.title));

    console.log(`✅ Sequential execution setup complete: ${tasks.length} tasks prepared`);
    
    return {
      tasksCount: tasks.length,
      stateStorage: 'issue-comments',
      parentIssue: parentIssue,
      firstTaskTriggered: true
    };
    
  } catch (error) {
    console.log('❌ Sequential setup failed:', error.message);
    
    const parentIssue = process.env.PARENT_ISSUE_NUMBER || context.payload.issue?.number;
    if (parentIssue) {
      try {
        await createComment(github, context.repo.owner, context.repo.repo, parseInt(parentIssue), 
          `❌ **Sequential Task Setup Failed**

Error: ${error.message}

Please check the context input and try again. Make sure:
- Context is clear and well-defined
- Claude Code OAuth token is properly configured
- Repository has necessary permissions for sequential execution

You can retry by re-running this workflow or creating a new issue with the \`sequential-context\` label.`);
      } catch (commentError) {
        console.log('Failed to create error comment:', commentError.message);
      }
    }
    
    throw error;
  }
}

module.exports = setupSequentialTasks;