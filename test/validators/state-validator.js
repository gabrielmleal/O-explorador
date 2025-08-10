// Sequential tasks state validator for E2E testing

class StateValidator {
  constructor() {
    this.STATE_COMMENT_PREFIX = '<!-- SEQUENTIAL_TASKS_STATE:';
    this.STATE_COMMENT_SUFFIX = ':END_STATE -->';
  }

  async findStateInIssueComments(github, owner, repo, issueNumber) {
    try {
      console.log(`🔍 Looking for sequential state in issue #${issueNumber} comments...`);

      const { data: comments } = await github.rest.issues.listComments({
        owner,
        repo,
        issue_number: issueNumber,
        per_page: 100
      });

      console.log(`📝 Searching through ${comments.length} comments for state data...`);

      // Find the most recent state comment
      let latestState = null;
      let latestStateComment = null;

      for (const comment of comments.reverse()) { // Start from most recent
        if (comment.body.includes(this.STATE_COMMENT_PREFIX)) {
          try {
            const startIndex = comment.body.indexOf(this.STATE_COMMENT_PREFIX) + this.STATE_COMMENT_PREFIX.length;
            const endIndex = comment.body.indexOf(this.STATE_COMMENT_SUFFIX);
            
            if (endIndex > startIndex) {
              const stateJson = comment.body.substring(startIndex, endIndex).trim();
              const state = JSON.parse(stateJson);
              
              latestState = state;
              latestStateComment = {
                id: comment.id,
                created_at: comment.created_at,
                updated_at: comment.updated_at
              };
              
              console.log(`✅ Found state comment (ID: ${comment.id}) with ${state.tasks?.length || 0} tasks`);
              break; // Take the most recent one
            }
          } catch (parseError) {
            console.log(`⚠️ Failed to parse state from comment ${comment.id}:`, parseError.message);
          }
        }
      }

      if (latestState) {
        return {
          ...latestState,
          _comment: latestStateComment
        };
      }

      console.log('❌ No valid sequential state found in issue comments');
      return null;

    } catch (error) {
      console.log(`⚠️ Error finding state in issue #${issueNumber}:`, error.message);
      return null;
    }
  }

  async validateStateStructure(state) {
    console.log('🔍 Validating sequential state structure...');

    const validation = {
      valid: true,
      reasons: [],
      structure: {
        hasContext: false,
        hasParentIssue: false,
        hasTasks: false,
        hasCurrentTaskIndex: false,
        hasStatus: false,
        hasTimestamps: false,
        taskCount: 0
      }
    };

    // Check required fields
    if (!state) {
      validation.valid = false;
      validation.reasons.push('State is null or undefined');
      return validation;
    }

    // Validate context
    if (state.context && typeof state.context === 'string') {
      validation.structure.hasContext = true;
    } else {
      validation.valid = false;
      validation.reasons.push('Missing or invalid context field');
    }

    // Validate parent_issue
    if (typeof state.parent_issue === 'number' && state.parent_issue > 0) {
      validation.structure.hasParentIssue = true;
    } else {
      validation.valid = false;
      validation.reasons.push('Missing or invalid parent_issue field');
    }

    // Validate tasks array
    if (Array.isArray(state.tasks) && state.tasks.length > 0) {
      validation.structure.hasTasks = true;
      validation.structure.taskCount = state.tasks.length;

      // Validate each task structure
      for (let i = 0; i < state.tasks.length; i++) {
        const task = state.tasks[i];
        const taskValidation = this.validateTaskStructure(task, i + 1);
        
        if (!taskValidation.valid) {
          validation.valid = false;
          validation.reasons.push(`Task ${i + 1} validation failed: ${taskValidation.reasons.join(', ')}`);
        }
      }
    } else {
      validation.valid = false;
      validation.reasons.push('Missing or empty tasks array');
    }

    // Validate current_task_index
    if (typeof state.current_task_index === 'number' && state.current_task_index >= 0) {
      validation.structure.hasCurrentTaskIndex = true;
    } else {
      validation.valid = false;
      validation.reasons.push('Missing or invalid current_task_index field');
    }

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'failed'];
    if (validStatuses.includes(state.status)) {
      validation.structure.hasStatus = true;
    } else {
      validation.valid = false;
      validation.reasons.push(`Invalid status: ${state.status}. Expected: ${validStatuses.join(', ')}`);
    }

    // Validate timestamps
    if (state.started_at && state.updated_at) {
      validation.structure.hasTimestamps = true;
    } else {
      validation.valid = false;
      validation.reasons.push('Missing timestamp fields (started_at, updated_at)');
    }

    console.log(`📊 State structure validation:`, {
      valid: validation.valid,
      taskCount: validation.structure.taskCount,
      status: state.status,
      currentTask: state.current_task_index + 1
    });

    return validation;
  }

  validateTaskStructure(task, taskNumber) {
    const validation = {
      valid: true,
      reasons: []
    };

    // Required fields for each task
    const requiredFields = ['id', 'title', 'body', 'status', 'branch', 'created_at'];
    
    for (const field of requiredFields) {
      if (!(field in task) || task[field] === null || task[field] === undefined) {
        validation.valid = false;
        validation.reasons.push(`Missing required field: ${field}`);
      }
    }

    // Validate task ID matches expected number
    if (task.id !== taskNumber) {
      validation.valid = false;
      validation.reasons.push(`Task ID ${task.id} doesn't match expected ${taskNumber}`);
    }

    // Validate task status
    const validTaskStatuses = ['pending', 'in_progress', 'completed', 'failed'];
    if (!validTaskStatuses.includes(task.status)) {
      validation.valid = false;
      validation.reasons.push(`Invalid task status: ${task.status}`);
    }

    // Validate branch naming
    const expectedBranch = `sequential/issue-${state.parent_issue || 'unknown'}/task-${taskNumber}`;
    if (task.branch !== expectedBranch) {
      validation.valid = false;
      validation.reasons.push(`Incorrect branch name. Expected: ${expectedBranch}, Got: ${task.branch}`);
    }

    return validation;
  }

  async validateStateProgression(github, owner, repo, issueNumber, expectedTaskCount) {
    try {
      console.log(`🔍 Validating state progression for ${expectedTaskCount} tasks...`);

      // Get all comments to see state progression
      const { data: comments } = await github.rest.issues.listComments({
        owner,
        repo,
        issue_number: issueNumber,
        per_page: 100
      });

      // Find all state comments chronologically
      const stateComments = [];
      
      for (const comment of comments) {
        if (comment.body.includes(this.STATE_COMMENT_PREFIX)) {
          try {
            const startIndex = comment.body.indexOf(this.STATE_COMMENT_PREFIX) + this.STATE_COMMENT_PREFIX.length;
            const endIndex = comment.body.indexOf(this.STATE_COMMENT_SUFFIX);
            
            if (endIndex > startIndex) {
              const stateJson = comment.body.substring(startIndex, endIndex).trim();
              const state = JSON.parse(stateJson);
              
              stateComments.push({
                commentId: comment.id,
                createdAt: comment.created_at,
                state: state
              });
            }
          } catch (parseError) {
            console.log(`⚠️ Failed to parse state comment ${comment.id}:`, parseError.message);
          }
        }
      }

      // Sort by creation time
      stateComments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      console.log(`📊 Found ${stateComments.length} state comments`);

      const validation = {
        valid: true,
        reasons: [],
        progression: {
          stateUpdates: stateComments.length,
          initialState: stateComments.length > 0 ? stateComments[0].state : null,
          finalState: stateComments.length > 0 ? stateComments[stateComments.length - 1].state : null,
          statusProgression: [],
          taskProgression: []
        }
      };

      if (stateComments.length === 0) {
        validation.valid = false;
        validation.reasons.push('No state comments found');
        return validation;
      }

      // Analyze progression
      for (let i = 0; i < stateComments.length; i++) {
        const stateComment = stateComments[i];
        const state = stateComment.state;
        
        validation.progression.statusProgression.push({
          order: i + 1,
          timestamp: stateComment.createdAt,
          status: state.status,
          currentTaskIndex: state.current_task_index,
          tasksCompleted: state.tasks?.filter(t => t.status === 'completed').length || 0
        });
      }

      // Validate final state
      const finalState = validation.progression.finalState;
      if (finalState) {
        // Check if all tasks are completed
        const completedTasks = finalState.tasks?.filter(t => t.status === 'completed').length || 0;
        
        if (completedTasks < expectedTaskCount) {
          validation.valid = false;
          validation.reasons.push(`Expected ${expectedTaskCount} completed tasks, found ${completedTasks}`);
        }

        // Check if final status is appropriate
        if (completedTasks === expectedTaskCount && finalState.status !== 'completed') {
          validation.reasons.push(`All tasks completed but final status is '${finalState.status}'`);
        }
      }

      console.log(`📊 State progression validation:`, {
        updates: validation.progression.stateUpdates,
        valid: validation.valid,
        finalStatus: finalState?.status,
        completedTasks: finalState?.tasks?.filter(t => t.status === 'completed').length || 0
      });

      return validation;

    } catch (error) {
      console.log('❌ Error validating state progression:', error.message);
      return {
        valid: false,
        reasons: [`Error validating progression: ${error.message}`],
        progression: {
          stateUpdates: 0,
          initialState: null,
          finalState: null,
          statusProgression: [],
          taskProgression: []
        }
      };
    }
  }

  async validateFinalState(github, owner, repo, issueNumber, expectedTaskCount) {
    try {
      console.log(`🔍 Validating final sequential state...`);

      const currentState = await this.findStateInIssueComments(github, owner, repo, issueNumber);
      
      if (!currentState) {
        return {
          valid: false,
          reasons: ['No sequential state found'],
          finalState: null
        };
      }

      const validation = {
        valid: true,
        reasons: [],
        finalState: currentState,
        completedTasks: 0,
        expectedTasks: expectedTaskCount
      };

      // Validate structure first
      const structureValidation = await this.validateStateStructure(currentState);
      if (!structureValidation.valid) {
        validation.valid = false;
        validation.reasons.push(...structureValidation.reasons);
      }

      // Count completed tasks
      if (currentState.tasks && Array.isArray(currentState.tasks)) {
        validation.completedTasks = currentState.tasks.filter(task => task.status === 'completed').length;
      }

      // Validate all tasks are completed
      if (validation.completedTasks < expectedTaskCount) {
        validation.valid = false;
        validation.reasons.push(
          `Expected ${expectedTaskCount} completed tasks, found ${validation.completedTasks}`
        );
      }

      // Validate final status
      const appropriateFinalStatuses = ['completed'];
      if (validation.completedTasks === expectedTaskCount) {
        if (!appropriateFinalStatuses.includes(currentState.status)) {
          validation.reasons.push(
            `All tasks completed but status is '${currentState.status}', expected 'completed'`
          );
        }
      }

      // Validate current task index points to completion
      if (validation.completedTasks === expectedTaskCount) {
        if (currentState.current_task_index !== expectedTaskCount - 1 && currentState.current_task_index !== expectedTaskCount) {
          validation.reasons.push(
            `Current task index ${currentState.current_task_index} doesn't match completion state`
          );
        }
      }

      console.log(`📊 Final state validation:`, {
        valid: validation.valid,
        status: currentState.status,
        completedTasks: validation.completedTasks,
        expectedTasks: expectedTaskCount,
        currentTaskIndex: currentState.current_task_index
      });

      return validation;

    } catch (error) {
      console.log('❌ Error validating final state:', error.message);
      return {
        valid: false,
        reasons: [`Error validating final state: ${error.message}`],
        finalState: null,
        completedTasks: 0,
        expectedTasks: expectedTaskCount
      };
    }
  }

  async getStateHistory(github, owner, repo, issueNumber) {
    try {
      console.log(`🔍 Getting complete state history for issue #${issueNumber}...`);

      const { data: comments } = await github.rest.issues.listComments({
        owner,
        repo,
        issue_number: issueNumber,
        per_page: 100
      });

      const stateHistory = [];
      
      for (const comment of comments) {
        if (comment.body.includes(this.STATE_COMMENT_PREFIX)) {
          try {
            const startIndex = comment.body.indexOf(this.STATE_COMMENT_PREFIX) + this.STATE_COMMENT_PREFIX.length;
            const endIndex = comment.body.indexOf(this.STATE_COMMENT_SUFFIX);
            
            if (endIndex > startIndex) {
              const stateJson = comment.body.substring(startIndex, endIndex).trim();
              const state = JSON.parse(stateJson);
              
              stateHistory.push({
                commentId: comment.id,
                createdAt: comment.created_at,
                updatedAt: comment.updated_at,
                state: state,
                snapshot: {
                  status: state.status,
                  currentTaskIndex: state.current_task_index,
                  completedTasks: state.tasks?.filter(t => t.status === 'completed').length || 0,
                  totalTasks: state.tasks?.length || 0
                }
              });
            }
          } catch (parseError) {
            console.log(`⚠️ Failed to parse state from comment ${comment.id}`);
          }
        }
      }

      // Sort chronologically
      stateHistory.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      console.log(`📊 Retrieved ${stateHistory.length} state snapshots`);
      return stateHistory;

    } catch (error) {
      console.log('⚠️ Error getting state history:', error.message);
      return [];
    }
  }

  validateStateTransition(fromState, toState) {
    const validation = {
      valid: true,
      reasons: [],
      transition: {
        from: fromState?.status,
        to: toState?.status,
        taskProgressChanged: false,
        validTransition: true
      }
    };

    if (!fromState || !toState) {
      validation.valid = false;
      validation.reasons.push('Missing state for transition validation');
      return validation;
    }

    // Valid state transitions
    const validTransitions = {
      'pending': ['in_progress', 'failed'],
      'in_progress': ['completed', 'failed'],
      'completed': [], // Terminal state
      'failed': ['in_progress'] // Can retry
    };

    // Check if transition is valid
    const allowedNext = validTransitions[fromState.status] || [];
    if (!allowedNext.includes(toState.status) && fromState.status !== toState.status) {
      validation.valid = false;
      validation.transition.validTransition = false;
      validation.reasons.push(
        `Invalid state transition from '${fromState.status}' to '${toState.status}'`
      );
    }

    // Check task progression
    const fromCompleted = fromState.tasks?.filter(t => t.status === 'completed').length || 0;
    const toCompleted = toState.tasks?.filter(t => t.status === 'completed').length || 0;
    
    if (toCompleted !== fromCompleted) {
      validation.transition.taskProgressChanged = true;
    }

    // Task progress should generally not go backwards
    if (toCompleted < fromCompleted) {
      validation.valid = false;
      validation.reasons.push('Task completion count went backwards');
    }

    return validation;
  }
}

module.exports = new StateValidator();