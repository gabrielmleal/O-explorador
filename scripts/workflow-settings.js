// Workflow configuration settings
module.exports = {
  // Issue creation settings
  issueLabels: ['auto-implement'],
  
  // Task validation settings
  maxTaskTitleLength: 200,
  maxTaskBodyLength: 10000,
  
  // Messages
  messages: {
    noTasksFile: '❌ **Task decomposition failed** - Claude Code was unable to generate the tasks.json file. Please check the context input and try again.',
    invalidJson: (error) => `❌ **Task decomposition failed** - tasks.json file is invalid: ${error}`,
    taskComplete: (count) => `## 🤖 Task Decomposition Complete\n\nCreated ${count} implementation tasks:\n\n`,
    taskFooter: '\n---\n*Each task will automatically trigger Claude to create a PR.*'
  }
};