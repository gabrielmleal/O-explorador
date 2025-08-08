---
name: Context Input for Task Decomposition
about: Submit project requirements or context for automatic task decomposition and PR generation
title: '[CONTEXT] '
labels: context-input
assignees: ''
---

## 📋 Project Context

### Overview
<!-- Provide a high-level description of what needs to be built or accomplished -->


### Detailed Requirements
<!-- List specific requirements, features, or functionality needed -->

1. 
2. 
3. 

### Technical Specifications
<!-- Include any technical details, constraints, or preferences -->

- **Technology Stack:**
- **Architecture Pattern:**
- **Performance Requirements:**
- **Security Requirements:**

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

## 🤖 Automation Settings

### Task Generation Preferences
<!-- Configure how tasks should be generated -->

- **Maximum number of tasks:** 10
- **Preferred task complexity:** [Low/Medium/High/Mixed]
- **Allow parallel tasks:** Yes/No

### Implementation Preferences
<!-- Configure how PRs should be created -->

- **Auto-implement tasks:** Yes (default)
- **Create draft PRs:** No
- **Request reviews from:** @username

### Labels to Apply
<!-- Additional labels to apply to generated issues -->

- 

---

**Note:** Once this issue is created with the `context-input` label, it will automatically:
1. Be analyzed by Claude to decompose into individual tasks
2. Generate separate GitHub issues for each task
3. Trigger Claude to create PRs implementing each task

You can monitor progress in the comments below.