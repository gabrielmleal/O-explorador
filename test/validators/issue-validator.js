// Issue state and comment validator for E2E testing

class IssueValidator {
  constructor() {
    this.commentCache = new Map();
  }

  async validateIssueConsistency(github, owner, repo, issueNumber) {
    try {
      console.log(`🔍 Validating issue #${issueNumber} consistency...`);

      // Get issue details
      const { data: issue } = await github.rest.issues.get({
        owner,
        repo,
        issue_number: issueNumber
      });

      // Get all issue comments
      const { data: comments } = await github.rest.issues.listComments({
        owner,
        repo,
        issue_number: issueNumber,
        per_page: 100
      });

      console.log(`📝 Issue #${issueNumber} has ${comments.length} comments`);

      const validation = {
        valid: true,
        reasons: [],
        issue: {
          number: issue.number,
          title: issue.title,
          state: issue.state,
          labels: issue.labels.map(label => label.name),
          created_at: issue.created_at
        },
        comments: {
          total: comments.length,
          stateComments: 0,
          progressComments: 0,
          triggerComments: 0,
          errorComments: 0
        }
      };

      // Validate issue has required labels
      const hasSequentialLabel = issue.labels.some(label => label.name === 'sequential-context');
      if (!hasSequentialLabel) {
        validation.valid = false;
        validation.reasons.push('Issue missing sequential-context label');
      }

      // Analyze comments
      for (const comment of comments) {
        const body = comment.body;
        
        // Count different types of comments
        if (body.includes('SEQUENTIAL_TASKS_STATE:')) {
          validation.comments.stateComments++;
        }
        
        if (body.includes('Sequential Task Execution') && body.includes('Started')) {
          validation.comments.progressComments++;
        }
        
        if (body.includes('[SEQUENTIAL-TASK-TRIGGER]')) {
          validation.comments.triggerComments++;
        }
        
        if (body.includes('❌') || body.includes('failed') || body.includes('error')) {
          validation.comments.errorComments++;
        }
      }

      console.log(`📊 Comment analysis:`, validation.comments);

      // Validate we have expected comment types
      if (validation.comments.stateComments === 0) {
        validation.valid = false;
        validation.reasons.push('No state management comments found');
      }

      if (validation.comments.progressComments === 0) {
        validation.valid = false;
        validation.reasons.push('No progress tracking comments found');
      }

      if (validation.comments.triggerComments === 0) {
        validation.valid = false;
        validation.reasons.push('No task trigger comments found');
      }

      // Error comments might indicate problems
      if (validation.comments.errorComments > 0) {
        validation.reasons.push(`Found ${validation.comments.errorComments} error-related comments`);
        // Note: This doesn't mark as invalid since errors might be part of recovery testing
      }

      console.log(`✅ Issue validation completed:`, validation);
      return validation;

    } catch (error) {
      console.log('❌ Error validating issue consistency:', error.message);
      return {
        valid: false,
        reasons: [`Error validating issue: ${error.message}`],
        issue: null,
        comments: { total: 0, stateComments: 0, progressComments: 0, triggerComments: 0, errorComments: 0 }
      };
    }
  }

  async findCommentsOfType(github, owner, repo, issueNumber, commentType) {
    try {
      const { data: comments } = await github.rest.issues.listComments({
        owner,
        repo,
        issue_number: issueNumber,
        per_page: 100
      });

      let matchingComments = [];

      switch (commentType) {
        case 'state':
          matchingComments = comments.filter(comment => 
            comment.body.includes('SEQUENTIAL_TASKS_STATE:')
          );
          break;
          
        case 'progress':
          matchingComments = comments.filter(comment => 
            comment.body.includes('Sequential Task Execution') ||
            comment.body.includes('tasks created and ready') ||
            comment.body.includes('Sequential execution')
          );
          break;
          
        case 'trigger':
          matchingComments = comments.filter(comment => 
            comment.body.includes('[SEQUENTIAL-TASK-TRIGGER]')
          );
          break;
          
        case 'error':
          matchingComments = comments.filter(comment => 
            comment.body.includes('❌') || 
            comment.body.includes('failed') ||
            comment.body.includes('Error')
          );
          break;
          
        default:
          matchingComments = comments;
      }

      return matchingComments.map(comment => ({
        id: comment.id,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        body: comment.body,
        author: comment.user.login
      }));

    } catch (error) {
      console.log(`⚠️ Error finding ${commentType} comments:`, error.message);
      return [];
    }
  }

  async validateSequentialTriggerComments(github, owner, repo, issueNumber, expectedTaskCount) {
    try {
      console.log(`🔍 Validating trigger comments for ${expectedTaskCount} tasks...`);

      const triggerComments = await this.findCommentsOfType(github, owner, repo, issueNumber, 'trigger');
      
      console.log(`📝 Found ${triggerComments.length} trigger comments`);

      const validation = {
        valid: true,
        reasons: [],
        triggerComments: triggerComments.length,
        expectedTriggers: expectedTaskCount, // One trigger per task
        parsedTriggers: []
      };

      // Parse each trigger comment
      for (const comment of triggerComments) {
        const triggerMatch = comment.body.match(/\[SEQUENTIAL-TASK-TRIGGER\]\s+(.+)/);
        
        if (triggerMatch) {
          const paramString = triggerMatch[1];
          
          // Parse parameters
          const taskIndexMatch = paramString.match(/task_index=(\d+)/);
          const previousBranchMatch = paramString.match(/previous_branch=([^\s]+)/);
          const parentIssueMatch = paramString.match(/parent_issue=(\d+)/);
          
          if (taskIndexMatch && previousBranchMatch && parentIssueMatch) {
            validation.parsedTriggers.push({
              taskIndex: parseInt(taskIndexMatch[1]),
              previousBranch: previousBranchMatch[1],
              parentIssue: parseInt(parentIssueMatch[1]),
              commentId: comment.id,
              createdAt: comment.created_at
            });
          } else {
            validation.reasons.push(`Invalid trigger comment format: ${comment.id}`);
          }
        } else {
          validation.reasons.push(`Malformed trigger comment: ${comment.id}`);
        }
      }

      // Validate we have triggers for expected task indices
      const triggeredTaskIndices = validation.parsedTriggers.map(t => t.taskIndex).sort();
      const expectedTaskIndices = Array.from({ length: expectedTaskCount }, (_, i) => i);
      
      for (const expectedIndex of expectedTaskIndices) {
        if (!triggeredTaskIndices.includes(expectedIndex)) {
          validation.valid = false;
          validation.reasons.push(`Missing trigger for task index ${expectedIndex}`);
        }
      }

      // Check for proper sequential order by creation time
      const sortedTriggers = validation.parsedTriggers.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );

      for (let i = 0; i < sortedTriggers.length; i++) {
        const trigger = sortedTriggers[i];
        if (trigger.taskIndex !== i) {
          validation.reasons.push(
            `Trigger order mismatch: expected task ${i}, found task ${trigger.taskIndex}`
          );
        }
      }

      console.log(`📊 Trigger validation:`, {
        found: validation.triggerComments,
        expected: validation.expectedTriggers,
        valid: validation.valid,
        parsedCount: validation.parsedTriggers.length
      });

      return validation;

    } catch (error) {
      console.log('❌ Error validating trigger comments:', error.message);
      return {
        valid: false,
        reasons: [`Error validating triggers: ${error.message}`],
        triggerComments: 0,
        expectedTriggers: expectedTaskCount,
        parsedTriggers: []
      };
    }
  }

  async validateProgressTracking(github, owner, repo, issueNumber) {
    try {
      console.log(`🔍 Validating progress tracking for issue #${issueNumber}...`);

      const progressComments = await this.findCommentsOfType(github, owner, repo, issueNumber, 'progress');
      
      const validation = {
        valid: true,
        reasons: [],
        progressComments: progressComments.length,
        hasInitialProgress: false,
        hasTaskUpdates: false,
        hasCompletionSummary: false
      };

      // Look for specific progress patterns
      for (const comment of progressComments) {
        const body = comment.body;
        
        if (body.includes('Sequential Task Execution Started') || body.includes('tasks created and ready')) {
          validation.hasInitialProgress = true;
        }
        
        if (body.includes('Task') && body.includes('completed') || body.includes('task progress')) {
          validation.hasTaskUpdates = true;
        }
        
        if (body.includes('All sequential tasks') && body.includes('completed') || body.includes('execution complete')) {
          validation.hasCompletionSummary = true;
        }
      }

      // Validate we have expected progress tracking
      if (!validation.hasInitialProgress) {
        validation.valid = false;
        validation.reasons.push('No initial progress tracking found');
      }

      console.log(`📊 Progress tracking validation:`, {
        comments: validation.progressComments,
        hasInitial: validation.hasInitialProgress,
        hasUpdates: validation.hasTaskUpdates,
        hasCompletion: validation.hasCompletionSummary
      });

      return validation;

    } catch (error) {
      console.log('❌ Error validating progress tracking:', error.message);
      return {
        valid: false,
        reasons: [`Error validating progress: ${error.message}`],
        progressComments: 0,
        hasInitialProgress: false,
        hasTaskUpdates: false,
        hasCompletionSummary: false
      };
    }
  }

  async getIssueMetrics(github, owner, repo, issueNumber) {
    try {
      const { data: issue } = await github.rest.issues.get({
        owner,
        repo,
        issue_number: issueNumber
      });

      const { data: comments } = await github.rest.issues.listComments({
        owner,
        repo,
        issue_number: issueNumber,
        per_page: 100
      });

      return {
        issue: {
          number: issue.number,
          title: issue.title,
          state: issue.state,
          created_at: issue.created_at,
          updated_at: issue.updated_at,
          labels: issue.labels.map(l => l.name),
          assignees: issue.assignees.map(a => a.login)
        },
        activity: {
          totalComments: comments.length,
          firstComment: comments.length > 0 ? comments[0].created_at : null,
          lastComment: comments.length > 0 ? comments[comments.length - 1].created_at : null,
          commentAuthors: [...new Set(comments.map(c => c.user.login))]
        },
        timeline: {
          issueAge: Date.now() - new Date(issue.created_at).getTime(),
          lastActivity: Date.now() - new Date(issue.updated_at).getTime()
        }
      };

    } catch (error) {
      console.log('⚠️ Error getting issue metrics:', error.message);
      return null;
    }
  }
}

module.exports = new IssueValidator();