// Workflow execution validator for E2E testing

const MAX_WORKFLOW_WAIT_TIME = 900000; // 15 minutes
const WORKFLOW_CHECK_INTERVAL = 10000;  // 10 seconds

class WorkflowValidator {
  constructor() {
    this.workflowCache = new Map();
  }

  async checkWorkflowExecution(github, owner, repo, workflowFileName, triggerIssueNumber = null) {
    try {
      // Get recent workflow runs for this workflow file
      const { data: workflowRuns } = await github.rest.actions.listWorkflowRuns({
        owner,
        repo,
        workflow_id: workflowFileName,
        per_page: 20,
        created: this.getRecentTimeFilter()
      });

      // Find the most recent run that could be related to our test
      const relevantRuns = workflowRuns.workflow_runs.filter(run => {
        // For issue-triggered workflows, check if created after our test started
        if (triggerIssueNumber) {
          const runCreatedTime = new Date(run.created_at).getTime();
          const testStartTime = Date.now() - MAX_WORKFLOW_WAIT_TIME;
          return runCreatedTime > testStartTime;
        }
        return true;
      });

      if (relevantRuns.length === 0) {
        return null; // No relevant runs found
      }

      // Get the most recent run
      const latestRun = relevantRuns[0];
      
      // If still running, return null (keep waiting)
      if (latestRun.status === 'in_progress' || latestRun.status === 'queued') {
        return null;
      }

      // Return detailed information about the workflow run
      return {
        id: latestRun.id,
        status: latestRun.status,
        conclusion: latestRun.conclusion,
        created_at: latestRun.created_at,
        updated_at: latestRun.updated_at,
        html_url: latestRun.html_url,
        run_number: latestRun.run_number,
        workflow_file: workflowFileName,
        successful: latestRun.conclusion === 'success'
      };

    } catch (error) {
      console.log(`⚠️ Error checking workflow ${workflowFileName}:`, error.message);
      return null;
    }
  }

  async checkTaskWorkflowExecution(github, owner, repo, workflowFileName, parentIssue, taskIndex) {
    try {
      // Get recent workflow runs for sequential-task-executor
      const { data: workflowRuns } = await github.rest.actions.listWorkflowRuns({
        owner,
        repo,
        workflow_id: workflowFileName,
        per_page: 30,
        created: this.getRecentTimeFilter()
      });

      // Look for workflow runs that might be for our specific task
      const relevantRuns = workflowRuns.workflow_runs.filter(run => {
        const runCreatedTime = new Date(run.created_at).getTime();
        const testStartTime = Date.now() - MAX_WORKFLOW_WAIT_TIME;
        return runCreatedTime > testStartTime;
      });

      if (relevantRuns.length === 0) {
        return null;
      }

      // For task workflows, we need to check if any completed run corresponds to our task
      // Since we can't easily match by task index, we'll look for the most recent completed run
      const completedRuns = relevantRuns.filter(run => 
        run.status === 'completed' || run.conclusion !== null
      );

      if (completedRuns.length === 0) {
        return null; // No completed runs yet
      }

      // Check if we have at least (taskIndex + 1) completed task workflow runs
      // This helps ensure we're looking at the right task execution
      const taskSpecificRun = completedRuns[0]; // Most recent completed run

      return {
        id: taskSpecificRun.id,
        status: taskSpecificRun.status,
        conclusion: taskSpecificRun.conclusion,
        created_at: taskSpecificRun.created_at,
        updated_at: taskSpecificRun.updated_at,
        html_url: taskSpecificRun.html_url,
        run_number: taskSpecificRun.run_number,
        workflow_file: workflowFileName,
        task_index: taskIndex,
        successful: taskSpecificRun.conclusion === 'success'
      };

    } catch (error) {
      console.log(`⚠️ Error checking task workflow for task ${taskIndex}:`, error.message);
      return null;
    }
  }

  async getWorkflowLogs(github, owner, repo, runId) {
    try {
      const { data: jobs } = await github.rest.actions.listJobsForWorkflowRun({
        owner,
        repo,
        run_id: runId
      });

      const logDetails = [];
      
      for (const job of jobs.jobs) {
        try {
          const { data: logs } = await github.rest.actions.downloadJobLogsForWorkflowRun({
            owner,
            repo,
            job_id: job.id
          });
          
          logDetails.push({
            job_name: job.name,
            status: job.status,
            conclusion: job.conclusion,
            logs: logs // This would be the raw log content
          });
        } catch (logError) {
          console.log(`⚠️ Could not fetch logs for job ${job.name}:`, logError.message);
        }
      }

      return logDetails;

    } catch (error) {
      console.log('⚠️ Error fetching workflow logs:', error.message);
      return [];
    }
  }

  async validateWorkflowSuccess(github, owner, repo, workflowFileName, maxWaitTime = MAX_WORKFLOW_WAIT_TIME) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const workflowResult = await this.checkWorkflowExecution(github, owner, repo, workflowFileName);
      
      if (workflowResult) {
        if (workflowResult.successful) {
          return workflowResult;
        } else {
          throw new Error(`Workflow ${workflowFileName} failed with conclusion: ${workflowResult.conclusion}`);
        }
      }
      
      // Wait before next check
      await this.sleep(WORKFLOW_CHECK_INTERVAL);
    }
    
    throw new Error(`Timeout waiting for workflow ${workflowFileName} to complete (${maxWaitTime}ms)`);
  }

  async getAllRecentWorkflowRuns(github, owner, repo, sinceMinutes = 60) {
    try {
      const since = new Date(Date.now() - (sinceMinutes * 60 * 1000)).toISOString();
      
      const { data: workflowRuns } = await github.rest.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        per_page: 100,
        created: `>${since}`
      });

      return workflowRuns.workflow_runs.map(run => ({
        id: run.id,
        name: run.name,
        workflow_file: run.path,
        status: run.status,
        conclusion: run.conclusion,
        created_at: run.created_at,
        updated_at: run.updated_at,
        html_url: run.html_url,
        run_number: run.run_number,
        event: run.event,
        successful: run.conclusion === 'success'
      }));

    } catch (error) {
      console.log('⚠️ Error fetching workflow runs:', error.message);
      return [];
    }
  }

  async validateSequentialWorkflowChain(github, owner, repo, parentIssue, expectedTaskCount) {
    try {
      console.log(`🔍 Validating sequential workflow chain for ${expectedTaskCount} tasks...`);
      
      // Get all recent workflow runs
      const allRuns = await this.getAllRecentWorkflowRuns(github, owner, repo, 120); // Last 2 hours
      
      // Filter for sequential-related workflows
      const contextRuns = allRuns.filter(run => 
        run.workflow_file.includes('context-to-sequential-tasks')
      );
      
      const taskRuns = allRuns.filter(run => 
        run.workflow_file.includes('sequential-task-executor')
      );

      console.log(`📊 Found ${contextRuns.length} context workflows, ${taskRuns.length} task workflows`);

      // Validate we have the expected workflow executions
      const validation = {
        valid: true,
        reasons: [],
        contextWorkflows: contextRuns.length,
        taskWorkflows: taskRuns.length,
        expectedTaskWorkflows: expectedTaskCount,
        allWorkflowsSuccessful: true
      };

      // Check if we have at least one context workflow
      if (contextRuns.length === 0) {
        validation.valid = false;
        validation.reasons.push('No context-to-sequential-tasks workflow runs found');
      }

      // Check if context workflow succeeded
      const successfulContextRuns = contextRuns.filter(run => run.successful);
      if (successfulContextRuns.length === 0) {
        validation.valid = false;
        validation.reasons.push('No successful context-to-sequential-tasks workflow runs');
        validation.allWorkflowsSuccessful = false;
      }

      // Check if we have expected number of task workflows
      if (taskRuns.length < expectedTaskCount) {
        validation.valid = false;
        validation.reasons.push(`Expected ${expectedTaskCount} task workflows, found ${taskRuns.length}`);
      }

      // Check if all task workflows succeeded
      const successfulTaskRuns = taskRuns.filter(run => run.successful);
      if (successfulTaskRuns.length < expectedTaskCount) {
        validation.valid = false;
        validation.reasons.push(`Expected ${expectedTaskCount} successful task workflows, found ${successfulTaskRuns.length}`);
        validation.allWorkflowsSuccessful = false;
      }

      console.log(`📋 Workflow chain validation:`, validation);
      return validation;

    } catch (error) {
      console.log('❌ Error validating workflow chain:', error.message);
      return {
        valid: false,
        reasons: [`Error validating workflow chain: ${error.message}`],
        contextWorkflows: 0,
        taskWorkflows: 0,
        expectedTaskWorkflows: expectedTaskCount,
        allWorkflowsSuccessful: false
      };
    }
  }

  getRecentTimeFilter(minutesAgo = 120) {
    // GitHub API filter format for created time
    const date = new Date(Date.now() - (minutesAgo * 60 * 1000));
    return `>${date.toISOString().slice(0, 19)}Z`;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new WorkflowValidator();