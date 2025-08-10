// Test scenario configurations for E2E testing

const testScenarios = {
  'basic-3-tasks': {
    name: 'Basic 3-Task Sequential Implementation',
    description: 'Tests standard sequential workflow with 3 tasks',
    expectedTaskCount: 3,
    timeout: 30,
    context: {
      title: '[SEQUENTIAL] E2E Test: Basic 3-Task Implementation',
      body: `@claude

## 📋 Project Context for Sequential Implementation

### Overview
Create a simple web application with user authentication and basic CRUD operations. This is an E2E test to validate the sequential workflow system.

### Detailed Requirements
1. User registration and login system with password hashing
2. User profile management with basic CRUD operations (create, read, update, delete profile data)
3. Simple dashboard displaying user information and basic statistics

### Technical Specifications
- **Technology Stack:** Node.js, Express.js, basic HTML/CSS/JavaScript
- **Architecture Pattern:** MVC pattern with separation of concerns
- **Performance Requirements:** Basic response times under 200ms
- **Security Requirements:** Password hashing, input validation, basic XSS protection

### Sequential Implementation Considerations
- **Task Dependencies:** Authentication must be implemented first, then profile management, then dashboard
- **Logical Ordering:** Foundation → User Management → Interface
- **Integration Points:** Each task builds upon the previous implementation

### User Stories
As a user, I want to register and login so that I can access my personal dashboard.
As a user, I want to manage my profile information so that I can keep my data up to date.
As a user, I want to view a dashboard so that I can see my information and account statistics.

### Success Criteria
- [ ] Users can register with email and password
- [ ] Users can login and logout securely  
- [ ] Users can view and edit their profile information
- [ ] Dashboard displays user data and basic statistics
- [ ] All endpoints handle errors gracefully

### Constraints and Assumptions
**Constraints:**
- Keep implementation simple for testing purposes
- Use minimal external dependencies
- Focus on core functionality over advanced features

**Assumptions:**
- This is a test implementation
- Focus on demonstrating sequential workflow functionality
- Basic styling is sufficient

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
    }
  },

  'single-task': {
    name: 'Single Task Implementation',
    description: 'Tests sequential workflow with only one task',
    expectedTaskCount: 1,
    timeout: 15,
    context: {
      title: '[SEQUENTIAL] E2E Test: Single Task Implementation',
      body: `@claude

## 📋 Project Context for Sequential Implementation

### Overview
Create a simple "Hello World" web server to test single-task sequential execution.

### Detailed Requirements
1. Basic HTTP server that responds with "Hello World" message

### Technical Specifications
- **Technology Stack:** Node.js
- **Architecture Pattern:** Simple HTTP server
- **Performance Requirements:** Basic functionality
- **Security Requirements:** None required for this test

### Success Criteria
- [ ] Server starts and listens on a port
- [ ] Server responds to HTTP GET requests with "Hello World"
- [ ] Basic error handling for server startup

### Timeline
- **Priority Level:** Low (Test execution)

---

## 🔗 Sequential Execution Settings

### Task Generation Preferences
- **Maximum number of tasks:** 1
- **Preferred task complexity:** Low
- **Sequential execution:** Yes (default)

### Labels to Apply
- e2e-test
- sequential-task-test
- single-task`
    }
  },

  'error-recovery': {
    name: 'Error Recovery Scenario',
    description: 'Tests error handling and recovery mechanisms',
    expectedTaskCount: 2,
    timeout: 25,
    context: {
      title: '[SEQUENTIAL] E2E Test: Error Recovery Scenario',
      body: `@claude

## 📋 Project Context for Sequential Implementation

### Overview
Test error recovery capabilities with requirements that may cause validation or implementation challenges.

### Detailed Requirements
1. Create a configuration system with complex validation rules
2. Implement error handling and recovery mechanisms for the configuration system

### Technical Specifications
- **Technology Stack:** Node.js with JSON schema validation
- **Architecture Pattern:** Configuration management system
- **Performance Requirements:** Robust error handling
- **Security Requirements:** Input validation and sanitization

### Sequential Implementation Considerations
- **Task Dependencies:** Configuration system first, then error handling
- **Logical Ordering:** Core functionality → Error handling
- **Integration Points:** Error handling integrates with configuration system

### Success Criteria
- [ ] Configuration system validates input according to schema
- [ ] Error handling provides meaningful error messages
- [ ] Recovery mechanisms allow system to continue operation after errors

### Constraints and Assumptions
**Constraints:**
- Focus on error scenarios and edge cases
- Test recovery from various failure states

### Timeline
- **Priority Level:** Medium (Test execution)

---

## 🔗 Sequential Execution Settings

### Task Generation Preferences
- **Maximum number of tasks:** 3
- **Preferred task complexity:** Medium
- **Sequential execution:** Yes (default)

### Labels to Apply
- e2e-test
- sequential-task-test
- error-recovery-test`
    }
  },

  'max-tasks': {
    name: 'Maximum Tasks Scenario',
    description: 'Tests workflow with maximum number of tasks',
    expectedTaskCount: 5,
    timeout: 45,
    context: {
      title: '[SEQUENTIAL] E2E Test: Maximum Tasks Implementation',
      body: `@claude

## 📋 Project Context for Sequential Implementation

### Overview
Create a comprehensive task management application with multiple interconnected features to test maximum sequential workflow capacity.

### Detailed Requirements
1. User authentication and authorization system
2. Task creation and management with categories
3. Task assignment and team collaboration features
4. Reporting and analytics dashboard
5. Notification system for task updates

### Technical Specifications
- **Technology Stack:** Node.js, Express.js, MongoDB/SQLite, React/HTML
- **Architecture Pattern:** Full-stack MVC with API layer
- **Performance Requirements:** Scalable architecture, caching, pagination
- **Security Requirements:** JWT tokens, role-based access control, input validation

### Sequential Implementation Considerations
- **Task Dependencies:** Auth → Task Management → Collaboration → Analytics → Notifications
- **Logical Ordering:** Foundation → Core Features → Advanced Features → Integrations → Enhancements
- **Integration Points:** Each component integrates with previous implementations

### User Stories
As a user, I want to authenticate so that I can access the task management system.
As a user, I want to create and manage tasks so that I can organize my work.
As a team member, I want to collaborate on tasks so that we can work together efficiently.
As a manager, I want to see analytics so that I can track team productivity.
As a user, I want to receive notifications so that I stay updated on task changes.

### Success Criteria
- [ ] Complete authentication system with role-based access
- [ ] Full CRUD operations for tasks with categories
- [ ] Team collaboration features with assignment and sharing
- [ ] Analytics dashboard with meaningful metrics
- [ ] Real-time notification system for task updates

### Timeline
- **Priority Level:** High (Comprehensive test)

---

## 🔗 Sequential Execution Settings

### Task Generation Preferences
- **Maximum number of tasks:** 5
- **Preferred task complexity:** Mixed (Low to High)
- **Sequential execution:** Yes (default)

### Labels to Apply
- e2e-test
- sequential-task-test
- max-tasks-test
- comprehensive-test`
    }
  }
};

// Validation function for test scenarios
function validateScenario(scenarioName) {
  const scenario = testScenarios[scenarioName];
  
  if (!scenario) {
    throw new Error(`Unknown test scenario: ${scenarioName}`);
  }

  const validation = {
    valid: true,
    reasons: []
  };

  // Check required fields
  const requiredFields = ['name', 'description', 'expectedTaskCount', 'timeout', 'context'];
  for (const field of requiredFields) {
    if (!(field in scenario)) {
      validation.valid = false;
      validation.reasons.push(`Missing required field: ${field}`);
    }
  }

  // Check context structure
  if (scenario.context) {
    if (!scenario.context.title || !scenario.context.body) {
      validation.valid = false;
      validation.reasons.push('Context missing title or body');
    }

    if (!scenario.context.body.includes('Sequential Execution Settings')) {
      validation.valid = false;
      validation.reasons.push('Context missing sequential execution settings');
    }
  }

  // Validate expected task count
  if (scenario.expectedTaskCount < 1 || scenario.expectedTaskCount > 10) {
    validation.valid = false;
    validation.reasons.push('Expected task count out of valid range (1-10)');
  }

  // Validate timeout
  if (scenario.timeout < 5 || scenario.timeout > 60) {
    validation.valid = false;
    validation.reasons.push('Timeout out of valid range (5-60 minutes)');
  }

  return validation;
}

// Get scenario by name
function getScenario(scenarioName) {
  const validation = validateScenario(scenarioName);
  
  if (!validation.valid) {
    throw new Error(`Invalid scenario '${scenarioName}': ${validation.reasons.join(', ')}`);
  }

  return testScenarios[scenarioName];
}

// List all available scenarios
function listScenarios() {
  return Object.keys(testScenarios).map(key => ({
    key,
    name: testScenarios[key].name,
    description: testScenarios[key].description,
    expectedTasks: testScenarios[key].expectedTaskCount,
    timeout: testScenarios[key].timeout
  }));
}

module.exports = {
  testScenarios,
  validateScenario,
  getScenario,
  listScenarios
};