module.exports = async ({ github, context }) => {
  // Extract task data from repository dispatch payload
  const clientPayload = context.payload.client_payload;
  console.log('Client payload:', clientPayload);
  
  if (!clientPayload || !clientPayload.task_data || !clientPayload.task_id) {
    throw new Error('Missing required task data in repository dispatch payload');
  }
  
  const taskData = clientPayload.task_data;
  const taskId = clientPayload.task_id;
  const commentId = clientPayload.comment_id;
  
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