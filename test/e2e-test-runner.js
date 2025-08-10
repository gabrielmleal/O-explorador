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
- sequential-task-test`
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
- **Priority Level:** Low (Test execution)`
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
- **Priority Level:** Medium (Test execution)`
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
      600000, // 10 minutes
      10000   // Check every 10 seconds
    );

    this.testResults.workflowsExecuted++;
    this.log('✅ Context-to-tasks workflow completed', workflowResult);

    // Validate tasks.json was created (indirectly through state comment)
    await this.sleep(5000); // Wait for state comment creation
    
    const stateComment = await this.validators.state.findStateInIssueComments(
      this.github,
      this.context.repo.owner,
      this.context.repo.repo,
      this.testIssueNumber
    );

    if (!stateComment) {
      throw new Error('Sequential tasks state comment not found after workflow completion');
    }

    this.testResults.tasksCreated = stateComment.tasks.length;
    this.log(`✅ Tasks created: ${this.testResults.tasksCreated}`, { tasks: stateComment.tasks });

    return stateComment;
  }

  async validateSequentialExecution(initialState) {
    this.log('🔄 Validating sequential task execution...');
    
    const totalTasks = initialState.tasks.length;
    let completedTasks = 0;
    
    for (let taskIndex = 0; taskIndex < totalTasks; taskIndex++) {
      this.log(`⚡ Validating task ${taskIndex + 1}/${totalTasks}...`);
      
      // Wait for task workflow to execute
      const taskResult = await this.waitForCondition(
        async () => {
          return await this.validators.workflow.checkTaskWorkflowExecution(
            this.github,
            this.context.repo.owner,
            this.context.repo.repo,
            'sequential-task-executor.yml',
            this.testIssueNumber,
            taskIndex
          );
        },
        `Task ${taskIndex + 1} workflow completion`,
        900000, // 15 minutes per task
        15000   // Check every 15 seconds
      );

      this.testResults.workflowsExecuted++;
      this.log(`✅ Task ${taskIndex + 1} workflow completed`, taskResult);

      // Validate branch creation
      const expectedBranch = `sequential/task-${taskIndex + 1}`;
      const branchExists = await this.validators.branch.validateBranchExists(
        this.github,
        this.context.repo.owner,
        this.context.repo.repo,
        expectedBranch
      );

      if (!branchExists) {
        throw new Error(`Branch ${expectedBranch} was not created for task ${taskIndex + 1}`);
      }

      this.log(`✅ Branch validated: ${expectedBranch}`);

      // Wait for PR creation
      await this.sleep(10000); // Give time for PR creation
      
      const pr = await this.validators.pr.findPRForBranch(
        this.github,
        this.context.repo.owner,
        this.context.repo.repo,
        expectedBranch
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
    }

    // Validate final state
    await this.sleep(10000); // Wait for final state update
    
    const finalState = await this.validators.state.findStateInIssueComments(
      this.github,
      this.context.repo.owner,
      this.context.repo.repo,
      this.testIssueNumber
    );

    if (!finalState) {
      throw new Error('Final state comment not found');
    }

    this.log('✅ Sequential execution completed', {
      finalStatus: finalState.status,
      completedTasks: completedTasks,
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