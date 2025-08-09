module.exports = async ({ github, context }) => {
  // Extract task data from comment body
  const commentBody = context.payload.comment.body;
  const commentId = context.payload.comment.id;
  console.log('Comment body:', commentBody);
  
  // Parse task data from comment using regex to extract JSON
  const taskMatch = commentBody.match(/🤖 TASK-(\d+): ({[\s\S]*?})\s*(?:\n|$)/);
  if (!taskMatch) {
    throw new Error('Could not find task data in comment body');
  }
  
  const taskId = taskMatch[1];
  let taskData;
  try {
    taskData = JSON.parse(taskMatch[2]);
  } catch (error) {
    throw new Error(`Failed to parse task data JSON: ${error.message}`);
  }
  
  console.log('Parsed task data:', taskData);
  
  // Update task status to in-progress
  taskData.status = 'in-progress';
  const updatedComment = `🤖 TASK-${taskId}: ${JSON.stringify(taskData, null, 2)}

@claude Please implement this task.`;
  
  await github.rest.issues.updateComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    comment_id: commentId,
    body: updatedComment
  });
  
  console.log('Task status updated to in-progress');
  
  // Return task data for next steps
  return { taskData, taskId, commentId };
};