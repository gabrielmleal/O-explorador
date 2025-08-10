// Pull Request validator for E2E testing

class PRValidator {
  constructor() {
    this.prCache = new Map();
  }

  async findPRForBranch(github, owner, repo, branchName) {
    try {
      console.log(`🔍 Looking for PR with head branch: ${branchName}`);

      // Search for PRs with the specific head branch
      const { data: prs } = await github.rest.pulls.list({
        owner,
        repo,
        state: 'all', // Include both open and closed PRs
        head: `${owner}:${branchName}`,
        per_page: 10
      });

      if (prs.length === 0) {
        console.log(`⚠️ No PR found for branch ${branchName}`);
        return null;
      }

      // Return the most recent PR for this branch
      const pr = prs[0];
      
      console.log(`✅ Found PR #${pr.number} for branch ${branchName}`);
      
      return {
        number: pr.number,
        title: pr.title,
        state: pr.state,
        merged: pr.merged,
        created_at: pr.created_at,
        updated_at: pr.updated_at,
        html_url: pr.html_url,
        head: {
          ref: pr.head.ref,
          sha: pr.head.sha
        },
        base: {
          ref: pr.base.ref,
          sha: pr.base.sha
        },
        labels: pr.labels.map(label => label.name),
        draft: pr.draft,
        mergeable: pr.mergeable,
        author: pr.user.login
      };

    } catch (error) {
      console.log(`⚠️ Error finding PR for branch ${branchName}:`, error.message);
      return null;
    }
  }

  async validatePRStackStructure(github, owner, repo, expectedTaskCount) {
    try {
      console.log(`🔍 Validating PR stack structure for ${expectedTaskCount} tasks...`);

      const validation = {
        valid: true,
        reasons: [],
        prs: [],
        expectedPRs: expectedTaskCount,
        foundPRs: 0,
        stackingCorrect: true,
        branchChain: []
      };

      // Find PRs for each expected task branch
      for (let taskIndex = 1; taskIndex <= expectedTaskCount; taskIndex++) {
        const branchName = `sequential/task-${taskIndex}`;
        const pr = await this.findPRForBranch(github, owner, repo, branchName);
        
        if (pr) {
          validation.prs.push({
            taskIndex,
            branchName,
            pr
          });
          validation.foundPRs++;
          
          // Validate PR labels
          const hasSequentialLabel = pr.labels.includes('sequential-task');
          const hasTaskLabel = pr.labels.some(label => label.includes(`task-${taskIndex}`));
          
          if (!hasSequentialLabel) {
            validation.reasons.push(`PR #${pr.number} missing 'sequential-task' label`);
          }
          
          // Validate base branch for stacking
          const expectedBase = taskIndex === 1 ? 'main' : `sequential/task-${taskIndex - 1}`;
          if (pr.base.ref !== expectedBase) {
            validation.stackingCorrect = false;
            validation.reasons.push(
              `PR #${pr.number} base branch incorrect. Expected: ${expectedBase}, Actual: ${pr.base.ref}`
            );
          }
          
          validation.branchChain.push({
            taskIndex,
            branch: pr.head.ref,
            baseBranch: pr.base.ref,
            prNumber: pr.number
          });
          
        } else {
          validation.valid = false;
          validation.reasons.push(`No PR found for task ${taskIndex} (branch: ${branchName})`);
        }
      }

      // Overall validation
      if (validation.foundPRs < validation.expectedPRs) {
        validation.valid = false;
        validation.reasons.push(
          `Expected ${validation.expectedPRs} PRs, found ${validation.foundPRs}`
        );
      }

      if (!validation.stackingCorrect) {
        validation.valid = false;
      }

      console.log(`📊 PR stack validation:`, {
        expected: validation.expectedPRs,
        found: validation.foundPRs,
        stackingCorrect: validation.stackingCorrect,
        valid: validation.valid
      });

      return validation;

    } catch (error) {
      console.log('❌ Error validating PR stack structure:', error.message);
      return {
        valid: false,
        reasons: [`Error validating PR stack: ${error.message}`],
        prs: [],
        expectedPRs: expectedTaskCount,
        foundPRs: 0,
        stackingCorrect: false,
        branchChain: []
      };
    }
  }

  async validatePRContent(github, owner, repo, prNumber) {
    try {
      console.log(`🔍 Validating content of PR #${prNumber}...`);

      // Get PR details
      const { data: pr } = await github.rest.pulls.get({
        owner,
        repo,
        pull_number: prNumber
      });

      // Get PR files
      const { data: files } = await github.rest.pulls.listFiles({
        owner,
        repo,
        pull_number: prNumber
      });

      // Get PR commits
      const { data: commits } = await github.rest.pulls.listCommits({
        owner,
        repo,
        pull_number: prNumber
      });

      const validation = {
        valid: true,
        reasons: [],
        pr: {
          number: prNumber,
          title: pr.title,
          body: pr.body,
          state: pr.state,
          mergeable: pr.mergeable
        },
        changes: {
          filesChanged: files.length,
          additions: pr.additions,
          deletions: pr.deletions,
          totalChanges: pr.additions + pr.deletions
        },
        commits: {
          count: commits.length,
          authors: [...new Set(commits.map(c => c.author?.login).filter(Boolean))]
        },
        files: files.map(file => ({
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes
        }))
      };

      // Validate PR has actual changes
      if (validation.changes.filesChanged === 0) {
        validation.valid = false;
        validation.reasons.push('PR contains no file changes');
      }

      if (validation.changes.totalChanges === 0) {
        validation.valid = false;
        validation.reasons.push('PR contains no code changes');
      }

      // Validate PR has commits
      if (validation.commits.count === 0) {
        validation.valid = false;
        validation.reasons.push('PR contains no commits');
      }

      // Validate PR title follows expected pattern
      if (!pr.title.includes('Task') && !pr.title.includes('sequential')) {
        validation.reasons.push('PR title does not follow sequential task naming convention');
      }

      // Check for Claude Code attribution in commits
      const hasClaudeCommit = commits.some(commit => 
        commit.commit.message.includes('Generated with [Claude Code]') ||
        commit.commit.message.includes('Co-Authored-By: Claude')
      );

      if (!hasClaudeCommit) {
        validation.reasons.push('No Claude Code attribution found in commits');
      }

      console.log(`📊 PR content validation for #${prNumber}:`, {
        files: validation.changes.filesChanged,
        changes: validation.changes.totalChanges,
        commits: validation.commits.count,
        valid: validation.valid
      });

      return validation;

    } catch (error) {
      console.log(`⚠️ Error validating PR #${prNumber} content:`, error.message);
      return {
        valid: false,
        reasons: [`Error validating PR content: ${error.message}`],
        pr: { number: prNumber },
        changes: { filesChanged: 0, additions: 0, deletions: 0, totalChanges: 0 },
        commits: { count: 0, authors: [] },
        files: []
      };
    }
  }

  async validateSequentialPRLabels(github, owner, repo, prNumbers) {
    try {
      console.log(`🔍 Validating sequential PR labels for PRs: ${prNumbers.join(', ')}`);

      const validation = {
        valid: true,
        reasons: [],
        prLabels: [],
        expectedLabels: ['sequential-task'],
        missingLabels: []
      };

      for (const prNumber of prNumbers) {
        try {
          const { data: pr } = await github.rest.pulls.get({
            owner,
            repo,
            pull_number: prNumber
          });

          const labels = pr.labels.map(label => label.name);
          validation.prLabels.push({
            prNumber,
            labels
          });

          // Check for required sequential-task label
          if (!labels.includes('sequential-task')) {
            validation.valid = false;
            validation.missingLabels.push({
              prNumber,
              missingLabel: 'sequential-task'
            });
            validation.reasons.push(`PR #${prNumber} missing 'sequential-task' label`);
          }

          // Check for task-specific labels (optional but good practice)
          const hasTaskLabel = labels.some(label => label.includes('task-'));
          if (!hasTaskLabel) {
            validation.reasons.push(`PR #${prNumber} missing task-specific label`);
          }

        } catch (error) {
          validation.valid = false;
          validation.reasons.push(`Error getting labels for PR #${prNumber}: ${error.message}`);
        }
      }

      console.log(`📊 PR labels validation:`, {
        checked: prNumbers.length,
        valid: validation.valid,
        missingLabels: validation.missingLabels.length
      });

      return validation;

    } catch (error) {
      console.log('❌ Error validating PR labels:', error.message);
      return {
        valid: false,
        reasons: [`Error validating PR labels: ${error.message}`],
        prLabels: [],
        expectedLabels: ['sequential-task'],
        missingLabels: []
      };
    }
  }

  async getAllSequentialPRs(github, owner, repo, sinceHours = 2) {
    try {
      const since = new Date(Date.now() - (sinceHours * 60 * 60 * 1000)).toISOString();

      // Get recent PRs
      const { data: prs } = await github.rest.pulls.list({
        owner,
        repo,
        state: 'all',
        per_page: 100,
        sort: 'created',
        direction: 'desc'
      });

      // Filter for sequential PRs created recently
      const sequentialPRs = prs.filter(pr => {
        const createdRecently = new Date(pr.created_at) >= new Date(since);
        const isSequential = pr.labels.some(label => label.name === 'sequential-task') ||
                           pr.head.ref.includes('sequential/task-') ||
                           pr.title.includes('Task') ||
                           pr.title.includes('sequential');
        
        return createdRecently && isSequential;
      });

      return sequentialPRs.map(pr => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        created_at: pr.created_at,
        head_branch: pr.head.ref,
        base_branch: pr.base.ref,
        labels: pr.labels.map(l => l.name),
        author: pr.user.login,
        html_url: pr.html_url
      }));

    } catch (error) {
      console.log('⚠️ Error getting sequential PRs:', error.message);
      return [];
    }
  }

  async validatePRMergeability(github, owner, repo, prNumber) {
    try {
      const { data: pr } = await github.rest.pulls.get({
        owner,
        repo,
        pull_number: prNumber
      });

      return {
        mergeable: pr.mergeable,
        mergeable_state: pr.mergeable_state,
        draft: pr.draft,
        state: pr.state,
        conflicts: pr.mergeable === false,
        ready_to_merge: pr.mergeable === true && !pr.draft && pr.state === 'open'
      };

    } catch (error) {
      console.log(`⚠️ Error checking PR #${prNumber} mergeability:`, error.message);
      return {
        mergeable: null,
        mergeable_state: 'unknown',
        draft: null,
        state: 'unknown',
        conflicts: true,
        ready_to_merge: false
      };
    }
  }
}

module.exports = new PRValidator();