function getWorkflowToken() {
  return process.env.WORKFLOW_TRIGGER_TOKEN;
}

function getClaudeToken() {
  return process.env.CLAUDE_CODE_OAUTH_TOKEN;
}

function validateTokens() {
  const workflowToken = getWorkflowToken();
  const claudeToken = getClaudeToken();
  
  if (!workflowToken && !process.env.GITHUB_TOKEN) {
    throw new Error('WORKFLOW_TRIGGER_TOKEN or GITHUB_TOKEN is required');
  }
  
  if (!claudeToken) {
    throw new Error('CLAUDE_CODE_OAUTH_TOKEN is required');
  }
  
  return {
    workflowToken: workflowToken || process.env.GITHUB_TOKEN,
    claudeToken
  };
}

module.exports = {
  getWorkflowToken,
  getClaudeToken,
  validateTokens
};