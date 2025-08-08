const { execSync } = require('child_process');

module.exports = async ({ github, context, core }) => {
  // Extract task data from comment
  const commentBody = context.payload.comment.body;
  console.log('Comment body:', commentBody);
  
  // Parse task JSON from comment
  const taskMatch = commentBody.match(/🤖 TASK-(\d+): ({[\s\S]*})/);
  if (!taskMatch) {
    throw new Error('Could not parse task data from comment');
  }
  
  const taskId = taskMatch[1];
  let taskData;
  
  try {
    taskData = JSON.parse(taskMatch[2]);
  } catch (error) {
    throw new Error(`Failed to parse task JSON: ${error.message}`);
  }
  
  console.log('Parsed task data:', taskData);
  
  // Update task status to in-progress
  taskData.status = 'in-progress';
  const updatedComment = `🤖 TASK-${taskId}: ${JSON.stringify(taskData, null, 2)}`;
  
  await github.rest.issues.updateComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    comment_id: context.payload.comment.id,
    body: updatedComment
  });
  
  console.log('Task status updated to in-progress');
  
  // Return task data for next steps
  return { taskData, taskId };
};