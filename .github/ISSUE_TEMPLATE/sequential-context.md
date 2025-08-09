---
name: Sequential Context for Task Implementation
about: Submit project requirements for sequential task decomposition with stacked PRs
title: '[SEQUENTIAL] '
labels: sequential-context
assignees: ''
---

## 📋 Project Context for Sequential Implementation

### Overview
<!-- Provide a high-level description of what needs to be built or accomplished -->


### Detailed Requirements
<!-- List specific requirements, features, or functionality needed -->
<!-- Note: These will be implemented sequentially, with each task building on the previous -->

1. 
2. 
3. 

### Technical Specifications
<!-- Include any technical details, constraints, or preferences -->

- **Technology Stack:**
- **Architecture Pattern:**
- **Performance Requirements:**
- **Security Requirements:**

### Sequential Implementation Considerations
<!-- How should tasks build on each other? -->

- **Task Dependencies:** <!-- Which tasks depend on others? -->
- **Logical Ordering:** <!-- What's the best sequence for implementation? -->
- **Integration Points:** <!-- Where do tasks need to integrate with each other? -->

### User Stories
<!-- Optional: Include user stories if applicable -->

As a [user type], I want to [action] so that [benefit].

### Success Criteria
<!-- Define what success looks like for this project -->

- [ ] 
- [ ] 
- [ ] 

### Constraints and Assumptions
<!-- List any constraints, limitations, or assumptions -->

**Constraints:**
- 

**Assumptions:**
- 

### Dependencies
<!-- List any external dependencies or prerequisites -->

- 

### Timeline
<!-- Optional: Include any timeline or deadline information -->

- **Desired Completion Date:**
- **Priority Level:** [Low/Medium/High/Critical]

### Additional Context
<!-- Any other relevant information, mockups, or references -->


---

## 🔗 Sequential Execution Settings

### Task Generation Preferences
<!-- Configure how sequential tasks should be generated -->

- **Maximum number of tasks:** 10
- **Preferred task complexity:** [Low/Medium/High/Mixed]
- **Sequential execution:** Yes (default)
- **Task interdependencies:** Consider dependencies in ordering

### Implementation Strategy
<!-- Configure how sequential PRs should be created -->

- **Stacked PRs:** Yes (each task builds on previous)
- **Base branch strategy:** Previous task branch
- **Create draft PRs:** No
- **Request reviews from:** @username

### Progress Monitoring
<!-- Sequential execution provides enhanced monitoring -->

- **Progress tracking:** Enabled (automatic)
- **Parent issue updates:** Yes
- **Recovery support:** Available via workflows

### Labels to Apply
<!-- Additional labels to apply to generated tasks -->

- 

---

## 🚀 How Sequential Execution Works

**Note:** Once this issue is created with the `sequential-context` label, it will automatically:

1. **Analyze Context:** Claude decomposes requirements into sequential tasks
2. **Initialize State:** Creates state management for task chain tracking
3. **Execute Sequentially:** Tasks run one at a time, each building on previous changes
4. **Create Stacked PRs:** Each task creates a PR that branches from the previous task
5. **Auto-Chain:** Next task automatically triggers when current task completes
6. **Progress Updates:** Regular progress updates posted to this issue

### Key Benefits:
- ✅ **Progressive Building:** Each task has access to previous implementations
- ✅ **Stacked PRs:** Clean, focused PRs that show incremental progress  
- ✅ **Automatic Chaining:** No manual intervention needed between tasks
- ✅ **Error Recovery:** Built-in recovery workflows for handling failures
- ✅ **Full Context:** Later tasks understand and integrate with earlier work

### Monitoring Progress:
- Progress updates will appear in comments below
- Each task will create a labeled PR (sequential-task, task-N)
- Final summary posted when all tasks complete
- Recovery workflows available if issues occur

**Sequential execution is now starting...**

@claude please, execute this context