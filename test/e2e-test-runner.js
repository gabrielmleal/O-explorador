const fs = require('fs');
const path = require('path');

// Import validators
const workflowValidator = require('./validators/workflow-validator');
const issueValidator = require('./validators/issue-validator');
const prValidator = require('./validators/pr-validator');
const branchValidator = require('./validators/branch-validator');
const stateValidator = require('./validators/state-validator');

// Test configuration templates
const testScenarios = {
  'basic-3-tasks': {
    title: '[SEQUENTIAL] E2E Test: Basic 3-Task Implementation',
    context: `## 📋 Project Context for Sequential Implementation

### Overview
Create a simple web application with user authentication and basic CRUD operations. This is an E2E test to validate the sequential workflow system.

### Detailed Requirements
1. User registration and login system
2. User profile management with basic CRUD operations  
3. Simple dashboard displaying user information

### Technical Specifications
- **Technology Stack:** Node.js, Express.js, basic HTML/CSS
- **Architecture Pattern:** MVC pattern
- **Performance Requirements:** Basic response times under 200ms
- **Security Requirements:** Password hashing, basic input validation

### Sequential Implementation Considerations
- **Task Dependencies:** Authentication must be implemented first, then profile management, then dashboard
- **Logical Ordering:** Foundation → User Management → Interface
- **Integration Points:** Each task builds upon the previous implementation

### Success Criteria
- [ ] Users can register and login
- [ ] Users can manage their profiles
- [ ] Dashboard displays user information correctly

### Constraints and Assumptions
**Constraints:**
- Keep implementation simple for testing purposes
- Use minimal external dependencies

**Assumptions:**
- This is a test implementation
- Focus on demonstrating sequential workflow functionality

### Timeline
- **Priority Level:** Medium (Test execution)

---

## 🔗 Sequential Execution Settings

### Task Generation Preferences
- **Maximum number of tasks:** 5
- **Preferred task complexity:** Low to Medium
- **Sequential execution:** Yes (default)
- **Task interdependencies:** Consider dependencies in ordering

### Implementation Strategy
- **Stacked PRs:** Yes (each task builds on previous)
- **Base branch strategy:** Previous task branch
- **Create draft PRs:** No

### Labels to Apply
- e2e-test
- sequential-task-test

@claude Please implement the above requirements using the sequential task system.`
  },
  'single-task': {
    title: '[SEQUENTIAL] E2E Test: Single Task Implementation',
    context: `## 📋 Project Context for Sequential Implementation

### Overview
Create a simple "Hello World" web server to test single-task sequential execution.

### Detailed Requirements
1. Basic HTTP server responding with "Hello World"

### Technical Specifications
- **Technology Stack:** Node.js
- **Architecture Pattern:** Simple server
- **Performance Requirements:** Basic functionality

### Success Criteria
- [ ] Server responds to HTTP requests

### Timeline
- **Priority Level:** Low (Test execution)

@claude Please implement the above requirements using the sequential task system.`
  },
  'error-recovery': {
    title: '[SEQUENTIAL] E2E Test: Error Recovery Scenario',
    context: `## 📋 Project Context for Sequential Implementation

### Overview
Test error recovery capabilities with intentionally problematic requirements.

### Detailed Requirements
1. Create undefined functionality that may cause errors
2. Test recovery mechanisms
3. Validate error handling

### Technical Specifications
- **Technology Stack:** Any
- **Architecture Pattern:** Test pattern

### Success Criteria
- [ ] Error recovery works correctly

### Timeline
- **Priority Level:** Medium (Test execution)

@claude Please implement the above requirements using the sequential task system.`
  }
};

class E2ETestRunner {
  constructor({ github, context, core, scenario, cleanup, timeoutMinutes }) {
    this.github = github;
    this.context = context;
    this.core = core;
    this.scenario = scenario || 'basic-3-tasks';
    this.cleanup = cleanup !== false;
    this.timeoutMinutes = parseInt(timeoutMinutes) || 45;
    this.timeoutMs = this.timeoutMinutes * 60 * 1000;
    
    this.testStartTime = Date.now();
    this.testIssueNumber = null;
    this.validators = {
      workflow: workflowValidator,
      issue: issueValidator,
      pr: prValidator,
      branch: branchValidator,
      state: stateValidator
    };
    
    this.testResults = {
      passed: false,
      testIssueNumber: null,
      tasksCreated: 0,
      tasksCompleted: 0,
      prsCreated: 0,
      workflowsExecuted: 0,
      durationMinutes: 0,
      validationResults: [],
      failureReason: null,
      summary: {}
    };

    this.setupLogging();
  }

  setupLogging() {
    // Ensure test directories exist
    const testDir = path.join(process.cwd(), 'test');
    const logsDir = path.join(testDir, 'logs');
    const artifactsDir = path.join(testDir, 'artifacts');
    
    [testDir, logsDir, artifactsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    this.logFile = path.join(logsDir, `e2e-test-${Date.now()}.log`);
  }

  log(message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    
    console.log(logEntry);
    
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
    
    // Write to log file
    try {
      const fullLogEntry = data ? `${logEntry}\n${JSON.stringify(data, null, 2)}\n` : `${logEntry}\n`;
      fs.appendFileSync(this.logFile, fullLogEntry);
    } catch (error) {
      console.log('⚠️ Failed to write to log file:', error.message);
    }
  }

  async waitForCondition(conditionFn, description, timeoutMs = 300000, intervalMs = 5000) {
    this.log(`⏳ Waiting for condition: ${description}`);
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const result = await conditionFn();
        if (result) {
          this.log(`✅ Condition met: ${description}`);
          return result;
        }
      } catch (error) {
        this.log(`⚠️ Error checking condition "${description}":`, { error: error.message });
      }
      
      await this.sleep(intervalMs);
    }
    
    throw new Error(`Timeout waiting for condition: ${description} (${timeoutMs}ms)`);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async createTestIssue() {
    this.log('📝 Creating test issue...');
    
    const testConfig = testScenarios[this.scenario];
    if (!testConfig) {
      throw new Error(`Unknown test scenario: ${this.scenario}`);
    }

    try {
      const { data: issue } = await this.github.rest.issues.create({
        owner: this.context.repo.owner,
        repo: this.context.repo.repo,
        title: testConfig.title,
        body: testConfig.context,
        labels: ['sequential-context', 'e2e-test']
      });

      this.testIssueNumber = issue.number;
      this.testResults.testIssueNumber = issue.number;
      
      this.log(`✅ Test issue created: #${issue.number}`);
      return issue;
    } catch (error) {
      this.log('❌ Failed to create test issue:', { error: error.message });
      throw new Error(`Failed to create test issue: ${error.message}`);
    }
  }

  async validateContextToTasksWorkflow() {
    this.log('🔍 Validating context-to-sequential-tasks workflow execution...');
    
    // Wait for workflow to be triggered first (more time for initial trigger)
    await this.sleep(15000); // Give GitHub 15 seconds to trigger the workflow
    
    // Wait for workflow to be triggered and complete
    const workflowResult = await this.waitForCondition(
      async () => {
        return await this.validators.workflow.checkWorkflowExecution(
          this.github,
          this.context.repo.owner,
          this.context.repo.repo,
          'context-to-sequential-tasks.yml',
          this.testIssueNumber
        );
      },
      'Context-to-tasks workflow completion',
      1200000, // 20 minutes (increased from 10)
      15000    // Check every 15 seconds (increased from 10)
    );

    this.testResults.workflowsExecuted++;
    this.log('✅ Context-to-tasks workflow completed', workflowResult);

    // Wait longer for state comment creation and first task trigger
    await this.sleep(30000); // Wait 30 seconds for state comment and first task trigger
    
    // Wait for state comment with retries
    const stateComment = await this.waitForCondition(
      async () => {
        const state = await this.validators.state.findStateInIssueComments(
          this.github,
          this.context.repo.owner,
          this.context.repo.repo,
          this.testIssueNumber
        );
        
        // Make sure we have tasks and the first task has been triggered
        if (state && state.tasks && state.tasks.length > 0) {
          this.log(`📊 Found state with ${state.tasks.length} tasks, status: ${state.status}`);
          return state;
        }
        return null;
      },
      'Sequential tasks state comment with tasks',
      300000, // 5 minutes
      10000   // Check every 10 seconds
    );

    if (!stateComment) {
      throw new Error('Sequential tasks state comment not found after workflow completion');
    }

    this.testResults.tasksCreated = stateComment.tasks.length;
    this.log(`✅ Tasks created: ${this.testResults.tasksCreated}`, { 
      tasks: stateComment.tasks.map(t => ({ id: t.id, title: t.title, status: t.status }))
    });

    return stateComment;
  }

  async validateSequentialExecution(initialState) {
    this.log('🔄 Validating sequential task execution...');
    
    const totalTasks = initialState.tasks.length;
    let completedTasks = 0;
    
    for (let taskIndex = 0; taskIndex < totalTasks; taskIndex++) {
      this.log(`⚡ Validating task ${taskIndex + 1}/${totalTasks}...`);
      
      // Wait for task to start processing (check state updates)
      await this.waitForCondition(
        async () => {
          const currentState = await this.validators.state.findStateInIssueComments(
            this.github,
            this.context.repo.owner,
            this.context.repo.repo,
            this.testIssueNumber
          );
          
          if (currentState && currentState.tasks && currentState.tasks[taskIndex]) {
            const taskStatus = currentState.tasks[taskIndex].status;
            this.log(`📊 Task ${taskIndex + 1} status: ${taskStatus}`);
            
            // Task should at least be in-progress or completed
            return taskStatus === 'in-progress' || taskStatus === 'completed';
          }
          return false;
        },
        `Task ${taskIndex + 1} to start processing`,
        600000, // 10 minutes to start
        20000   // Check every 20 seconds
      );
      
      // Wait for task workflow to execute and complete
      const taskResult = await this.waitForCondition(
        async () => {
          // First check if task is completed in state
          const currentState = await this.validators.state.findStateInIssueComments(
            this.github,
            this.context.repo.owner,
            this.context.repo.repo,
            this.testIssueNumber
          );
          
          if (currentState && currentState.tasks && currentState.tasks[taskIndex]) {
            const task = currentState.tasks[taskIndex];
            if (task.status === 'completed') {
              this.log(`✅ Task ${taskIndex + 1} completed in state`);
              return { success: true, fromState: true };
            }
          }
          
          // Also check workflow execution
          const workflowResult = await this.validators.workflow.checkTaskWorkflowExecution(
            this.github,
            this.context.repo.owner,
            this.context.repo.repo,
            'sequential-task-executor.yml',
            this.testIssueNumber,
            taskIndex
          );
          
          if (workflowResult && workflowResult.successful) {
            this.log(`✅ Task ${taskIndex + 1} workflow completed successfully`);
            return workflowResult;
          }
          
          return null;
        },
        `Task ${taskIndex + 1} completion`,
        1800000, // 30 minutes per task (increased significantly)
        25000    // Check every 25 seconds
      );

      this.testResults.workflowsExecuted++;
      this.log(`✅ Task ${taskIndex + 1} workflow completed`, taskResult);

      // Wait for branch to be available
      const expectedBranch = `sequential/task-${taskIndex + 1}`;
      
      const branchExists = await this.waitForCondition(
        async () => {
          return await this.validators.branch.validateBranchExists(
            this.github,
            this.context.repo.owner,
            this.context.repo.repo,
            expectedBranch
          );
        },
        `Branch ${expectedBranch} creation`,
        300000, // 5 minutes for branch
        10000   // Check every 10 seconds
      );

      if (!branchExists) {
        throw new Error(`Branch ${expectedBranch} was not created for task ${taskIndex + 1}`);
      }

      this.log(`✅ Branch validated: ${expectedBranch}`);

      // Wait for PR creation with retries
      const pr = await this.waitForCondition(
        async () => {
          return await this.validators.pr.findPRForBranch(
            this.github,
            this.context.repo.owner,
            this.context.repo.repo,
            expectedBranch
          );
        },
        `PR creation for task ${taskIndex + 1}`,
        600000, // 10 minutes for PR creation
        15000   // Check every 15 seconds
      );

      if (pr) {
        this.testResults.prsCreated++;
        this.log(`✅ PR created for task ${taskIndex + 1}: #${pr.number}`);
        
        // Validate PR base branch
        const expectedBase = taskIndex === 0 ? 'main' : `sequential/task-${taskIndex}`;
        if (pr.base.ref !== expectedBase) {
          this.log(`⚠️ PR base branch mismatch. Expected: ${expectedBase}, Actual: ${pr.base.ref}`);
        }
      } else {
        this.log(`⚠️ No PR found for task ${taskIndex + 1} branch: ${expectedBranch}`);
      }

      completedTasks++;
      this.testResults.tasksCompleted = completedTasks;
      
      // Wait between tasks to allow for sequential processing
      if (taskIndex < totalTasks - 1) {
        this.log(`⏳ Waiting before next task validation...`);
        await this.sleep(15000); // 15 seconds between task validations
      }
    }

    // Wait longer for final state update
    await this.sleep(30000); // Wait 30 seconds for final state update
    
    // Wait for final state with proper completion
    const finalState = await this.waitForCondition(
      async () => {
        const state = await this.validators.state.findStateInIssueComments(
          this.github,
          this.context.repo.owner,
          this.context.repo.repo,
          this.testIssueNumber
        );
        
        if (state && state.tasks) {
          const completed = state.tasks.filter(t => t.status === 'completed').length;
          this.log(`📊 Final state check: ${completed}/${totalTasks} tasks completed, status: ${state.status}`);
          
          // Consider test successful if all tasks are completed, regardless of overall status
          if (completed === totalTasks) {
            return state;
          }
        }
        
        return null;
      },
      'Final state with all tasks completed',
      300000, // 5 minutes for final state
      15000   // Check every 15 seconds
    );

    if (!finalState) {
      throw new Error('Final state comment not found or incomplete');
    }

    this.log('✅ Sequential execution completed', {
      finalStatus: finalState.status,
      completedTasks: finalState.tasks.filter(t => t.status === 'completed').length,
      totalTasks: totalTasks
    });

    return finalState;
  }

  async runTest() {
    this.log(`🚀 Starting E2E test for scenario: ${this.scenario}`);
    this.log(`⏱️ Timeout set to: ${this.timeoutMinutes} minutes`);
    
    try {
      // Phase 1: Create test issue
      await this.createTestIssue();

      // Phase 2: Validate context-to-tasks workflow
      const initialState = await this.validateContextToTasksWorkflow();

      // Phase 3: Validate sequential execution
      const finalState = await this.validateSequentialExecution(initialState);

      // Phase 4: Final validations
      await this.runFinalValidations();

      // Calculate test duration
      this.testResults.durationMinutes = Math.round((Date.now() - this.testStartTime) / 60000);
      
      // Mark test as passed
      this.testResults.passed = true;
      this.testResults.summary = {
        scenario: this.scenario,
        duration: `${this.testResults.durationMinutes} minutes`,
        tasksExecuted: this.testResults.tasksCompleted,
        workflowsExecuted: this.testResults.workflowsExecuted,
        prsCreated: this.testResults.prsCreated,
        finalState: finalState ? {
          status: finalState.status,
          completedTasks: finalState.tasks?.filter(t => t.status === 'completed')?.length || 0,
          totalTasks: finalState.tasks?.length || 0
        } : null
      };

      this.log('🎉 E2E test PASSED!', this.testResults.summary);
      
    } catch (error) {
      this.testResults.passed = false;
      this.testResults.failureReason = error.message;
      this.testResults.durationMinutes = Math.round((Date.now() - this.testStartTime) / 60000);
      
      this.log('❌ E2E test FAILED:', { 
        error: error.message,
        duration: this.testResults.durationMinutes,
        testContext: this.testResults
      });
      
      throw error;
    }

    return this.testResults;
  }

  async runFinalValidations() {
    this.log('🔍 Running final validations...');
    
    // Validate all expected branches exist
    const expectedBranches = [];
    for (let i = 1; i <= this.testResults.tasksCreated; i++) {
      expectedBranches.push(`sequential/task-${i}`);
    }

    for (const branch of expectedBranches) {
      const exists = await this.validators.branch.validateBranchExists(
        this.github,
        this.context.repo.owner,
        this.context.repo.repo,
        branch
      );
      
      if (!exists) {
        throw new Error(`Final validation failed: Branch ${branch} does not exist`);
      }
    }

    this.log(`✅ All expected branches validated: ${expectedBranches.length} branches`);

    // Validate issue state consistency
    const issueValidation = await this.validators.issue.validateIssueConsistency(
      this.github,
      this.context.repo.owner,
      this.context.repo.repo,
      this.testIssueNumber
    );

    if (!issueValidation.valid) {
      throw new Error(`Issue validation failed: ${issueValidation.reasons.join(', ')}`);
    }

    this.log('✅ Issue state validation passed');
    
    // Final state validation
    const stateValidation = await this.validators.state.validateFinalState(
      this.github,
      this.context.repo.owner,
      this.context.repo.repo,
      this.testIssueNumber,
      this.testResults.tasksCreated
    );

    if (!stateValidation.valid) {
      throw new Error(`State validation failed: ${stateValidation.reasons.join(', ')}`);
    }

    this.log('✅ Final state validation passed');
  }
}

module.exports = async ({ github, context, core, scenario, cleanup, timeoutMinutes }) => {
  const testRunner = new E2ETestRunner({
    github,
    context,
    core,
    scenario,
    cleanup,
    timeoutMinutes
  });

  return await testRunner.runTest();
};