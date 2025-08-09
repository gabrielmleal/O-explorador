module.exports = async ({ github, context }) => {
  // Extract task data from issue body
  const issueBody = context.payload.issue.body;
  const issueNumber = context.payload.issue.number;
  console.log('Issue body:', issueBody);
  
  // Parse task data from issue body using regex to extract JSON
  const taskMatch = issueBody.match(/```json\s*({\s*[\s\S]*?})\s*```/);
  if (!taskMatch) {
    throw new Error('Could not find task data JSON in issue body');
  }
  
  let taskData;
  try {
    taskData = JSON.parse(taskMatch[1]);
  } catch (error) {
    throw new Error(`Failed to parse task data JSON: ${error.message}`);
  }
  
  console.log('Parsed task data:', taskData);
  
  // Update task status to in-progress
  taskData.status = 'in-progress';
  
  // Create updated issue body with new status
  const updatedIssueBody = issueBody.replace(
    /```json\s*({\s*[\s\S]*?})\s*```/,
    `\`\`\`json\n${JSON.stringify(taskData, null, 2)}\n\`\`\``
  );
  
  // Update the issue body with new status
  await github.rest.issues.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issueNumber,
    body: updatedIssueBody
  });
  
  console.log('Task status updated to in-progress');
  
  // Return task data for next steps
  return { 
    taskData, 
    taskId: taskData.id.toString(), 
    issueNumber: issueNumber 
  };
};