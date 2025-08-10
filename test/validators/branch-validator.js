// Branch validation for E2E testing

class BranchValidator {
  constructor() {
    this.branchCache = new Map();
  }

  async validateBranchExists(github, owner, repo, branchName) {
    try {
      console.log(`🔍 Checking if branch exists: ${branchName}`);

      // Check cache first
      const cacheKey = `${owner}/${repo}/${branchName}`;
      if (this.branchCache.has(cacheKey)) {
        const cachedResult = this.branchCache.get(cacheKey);
        if (Date.now() - cachedResult.timestamp < 30000) { // 30 second cache
          console.log(`✅ Branch ${branchName} found in cache: ${cachedResult.exists}`);
          return cachedResult.exists;
        }
      }

      // Check branch existence
      try {
        const { data: branch } = await github.rest.repos.getBranch({
          owner,
          repo,
          branch: branchName
        });

        // Cache successful result
        this.branchCache.set(cacheKey, {
          exists: true,
          timestamp: Date.now(),
          sha: branch.commit.sha
        });

        console.log(`✅ Branch ${branchName} exists (SHA: ${branch.commit.sha.substring(0, 7)})`);
        return true;

      } catch (error) {
        if (error.status === 404) {
          // Branch doesn't exist
          this.branchCache.set(cacheKey, {
            exists: false,
            timestamp: Date.now(),
            sha: null
          });

          console.log(`❌ Branch ${branchName} does not exist`);
          return false;
        } else {
          throw error; // Re-throw non-404 errors
        }
      }

    } catch (error) {
      console.log(`⚠️ Error checking branch ${branchName}:`, error.message);
      return false;
    }
  }

  async validateSequentialBranchStructure(github, owner, repo, expectedTaskCount) {
    try {
      console.log(`🔍 Validating sequential branch structure for ${expectedTaskCount} tasks...`);

      const validation = {
        valid: true,
        reasons: [],
        branches: [],
        expectedBranches: expectedTaskCount,
        foundBranches: 0,
        branchChain: [],
        parentChildRelationships: []
      };

      // Check each expected sequential branch
      for (let taskIndex = 1; taskIndex <= expectedTaskCount; taskIndex++) {
        const branchName = `sequential/task-${taskIndex}`;
        
        try {
          const exists = await this.validateBranchExists(github, owner, repo, branchName);
          
          if (exists) {
            validation.foundBranches++;
            
            // Get detailed branch information
            const { data: branch } = await github.rest.repos.getBranch({
              owner,
              repo,
              branch: branchName
            });

            const branchInfo = {
              taskIndex,
              name: branchName,
              sha: branch.commit.sha,
              exists: true,
              created_at: branch.commit.commit.author.date,
              author: branch.commit.commit.author.name,
              message: branch.commit.commit.message
            };

            validation.branches.push(branchInfo);
            validation.branchChain.push(branchInfo);

            // Validate branch ancestry/parent relationships
            if (taskIndex > 1) {
              const parentBranch = `sequential/task-${taskIndex - 1}`;
              const relationship = await this.validateBranchAncestry(
                github, owner, repo, branchName, parentBranch
              );
              validation.parentChildRelationships.push(relationship);
              
              if (!relationship.isDescendant) {
                validation.valid = false;
                validation.reasons.push(
                  `Branch ${branchName} is not properly based on ${parentBranch}`
                );
              }
            } else {
              // First task should be based on main
              const relationship = await this.validateBranchAncestry(
                github, owner, repo, branchName, 'main'
              );
              validation.parentChildRelationships.push(relationship);
              
              if (!relationship.isDescendant) {
                validation.valid = false;
                validation.reasons.push(
                  `Branch ${branchName} is not properly based on main`
                );
              }
            }

          } else {
            validation.valid = false;
            validation.reasons.push(`Expected branch ${branchName} does not exist`);
            validation.branches.push({
              taskIndex,
              name: branchName,
              exists: false
            });
          }

        } catch (error) {
          validation.valid = false;
          validation.reasons.push(`Error checking branch ${branchName}: ${error.message}`);
          validation.branches.push({
            taskIndex,
            name: branchName,
            exists: false,
            error: error.message
          });
        }
      }

      // Overall validation
      if (validation.foundBranches < validation.expectedBranches) {
        validation.valid = false;
        validation.reasons.push(
          `Expected ${validation.expectedBranches} branches, found ${validation.foundBranches}`
        );
      }

      console.log(`📊 Branch structure validation:`, {
        expected: validation.expectedBranches,
        found: validation.foundBranches,
        valid: validation.valid,
        chainLength: validation.branchChain.length
      });

      return validation;

    } catch (error) {
      console.log('❌ Error validating branch structure:', error.message);
      return {
        valid: false,
        reasons: [`Error validating branch structure: ${error.message}`],
        branches: [],
        expectedBranches: expectedTaskCount,
        foundBranches: 0,
        branchChain: [],
        parentChildRelationships: []
      };
    }
  }

  async validateBranchAncestry(github, owner, repo, childBranch, parentBranch) {
    try {
      console.log(`🔍 Checking ancestry: ${childBranch} from ${parentBranch}...`);

      // Get commits for both branches to compare
      const [childData, parentData] = await Promise.all([
        github.rest.repos.getBranch({ owner, repo, branch: childBranch }),
        github.rest.repos.getBranch({ owner, repo, branch: parentBranch })
      ]);

      const childSha = childData.data.commit.sha;
      const parentSha = parentData.data.commit.sha;

      // Compare commits using GitHub's compare API
      try {
        const { data: comparison } = await github.rest.repos.compareCommits({
          owner,
          repo,
          base: parentSha,
          head: childSha
        });

        const relationship = {
          child: childBranch,
          parent: parentBranch,
          childSha: childSha.substring(0, 7),
          parentSha: parentSha.substring(0, 7),
          isDescendant: comparison.status !== 'diverged',
          commitsAhead: comparison.ahead_by,
          commitsBehind: comparison.behind_by,
          status: comparison.status
        };

        console.log(`📊 Branch relationship:`, {
          child: childBranch,
          parent: parentBranch,
          status: comparison.status,
          ahead: comparison.ahead_by,
          isDescendant: relationship.isDescendant
        });

        return relationship;

      } catch (compareError) {
        console.log(`⚠️ Could not compare branches: ${compareError.message}`);
        return {
          child: childBranch,
          parent: parentBranch,
          childSha: childSha.substring(0, 7),
          parentSha: parentSha.substring(0, 7),
          isDescendant: false,
          commitsAhead: 0,
          commitsBehind: 0,
          status: 'unknown',
          error: compareError.message
        };
      }

    } catch (error) {
      console.log(`⚠️ Error validating ancestry ${childBranch} from ${parentBranch}:`, error.message);
      return {
        child: childBranch,
        parent: parentBranch,
        isDescendant: false,
        error: error.message
      };
    }
  }

  async getAllSequentialBranches(github, owner, repo) {
    try {
      console.log(`🔍 Finding all sequential branches in ${owner}/${repo}...`);

      // Get all branches
      const { data: branches } = await github.rest.repos.listBranches({
        owner,
        repo,
        per_page: 100
      });

      // Filter for sequential task branches
      const sequentialBranches = branches.filter(branch => 
        branch.name.startsWith('sequential/task-')
      );

      console.log(`📊 Found ${sequentialBranches.length} sequential branches`);

      return sequentialBranches.map(branch => ({
        name: branch.name,
        sha: branch.commit.sha,
        protected: branch.protected,
        taskNumber: this.extractTaskNumber(branch.name)
      })).sort((a, b) => (a.taskNumber || 0) - (b.taskNumber || 0));

    } catch (error) {
      console.log('⚠️ Error getting sequential branches:', error.message);
      return [];
    }
  }

  extractTaskNumber(branchName) {
    const match = branchName.match(/sequential\/task-(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  async validateBranchProtection(github, owner, repo, branchName) {
    try {
      console.log(`🔍 Checking protection status for branch: ${branchName}`);

      try {
        const { data: protection } = await github.rest.repos.getBranchProtection({
          owner,
          repo,
          branch: branchName
        });

        return {
          protected: true,
          protection: {
            required_status_checks: protection.required_status_checks,
            enforce_admins: protection.enforce_admins,
            required_pull_request_reviews: protection.required_pull_request_reviews,
            restrictions: protection.restrictions
          }
        };

      } catch (error) {
        if (error.status === 404) {
          return { protected: false, protection: null };
        } else {
          throw error;
        }
      }

    } catch (error) {
      console.log(`⚠️ Error checking branch protection for ${branchName}:`, error.message);
      return { protected: null, protection: null, error: error.message };
    }
  }

  async getBranchCommitHistory(github, owner, repo, branchName, maxCommits = 20) {
    try {
      console.log(`🔍 Getting commit history for branch: ${branchName}`);

      const { data: commits } = await github.rest.repos.listCommits({
        owner,
        repo,
        sha: branchName,
        per_page: maxCommits
      });

      return commits.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: {
          name: commit.commit.author.name,
          email: commit.commit.author.email,
          date: commit.commit.author.date
        },
        committer: {
          name: commit.commit.committer.name,
          email: commit.commit.committer.email,
          date: commit.commit.committer.date
        },
        html_url: commit.html_url
      }));

    } catch (error) {
      console.log(`⚠️ Error getting commit history for ${branchName}:`, error.message);
      return [];
    }
  }

  async validateBranchNaming(branches) {
    const validation = {
      valid: true,
      reasons: [],
      branches: branches.length,
      namingPattern: /^sequential\/task-\d+$/
    };

    for (const branch of branches) {
      if (!validation.namingPattern.test(branch.name)) {
        validation.valid = false;
        validation.reasons.push(`Branch ${branch.name} doesn't follow naming convention`);
      }
    }

    return validation;
  }

  clearCache() {
    this.branchCache.clear();
    console.log('🧹 Branch cache cleared');
  }
}

module.exports = new BranchValidator();