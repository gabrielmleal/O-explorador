const { execSync } = require('child_process');
const fs = require('fs');
const { TEMP_FILES } = require('../utils/constants');

function configureGit() {
  execSync('git config user.name "Claude Sequential Bot"');
  execSync('git config user.email "claude-sequential@anthropic.com"');
}

async function createTaskBranch(taskBranch, previousBranch) {
  configureGit();
  execSync('git fetch origin');
  
  try {
    execSync(`git branch -D ${taskBranch}`, { stdio: 'pipe' });
  } catch (e) {
    // Branch doesn't exist locally
  }
  
  if (previousBranch !== 'main') {
    try {
      const remoteBranchCheck = execSync(`git ls-remote --heads origin ${previousBranch}`, { encoding: 'utf8' }).trim();
      if (remoteBranchCheck) {
        execSync(`git checkout -b temp-${taskBranch} origin/${previousBranch}`);
        execSync(`git checkout -b ${taskBranch}`);
        execSync(`git branch -D temp-${taskBranch}`, { stdio: 'pipe' });
      } else {
        execSync('git checkout main');
        execSync('git pull origin main');
        execSync(`git checkout -b ${taskBranch}`);
      }
    } catch (error) {
      execSync('git checkout main');
      execSync('git pull origin main');
      execSync(`git checkout -b ${taskBranch}`);
    }
  } else {
    execSync('git checkout main');
    execSync('git pull origin main');
    execSync(`git checkout -b ${taskBranch}`);
  }
  
  execSync(`git push -u origin ${taskBranch}`, { stdio: ['pipe', 'pipe', 'pipe'] });
}

function hasChanges() {
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  return status.trim() !== '';
}

function cleanTempFiles() {
  TEMP_FILES.forEach(pattern => {
    try {
      if (fs.existsSync(pattern)) {
        fs.unlinkSync(pattern);
      }
    } catch (error) {
      // File doesn't exist or couldn't be removed
    }
  });
}

function getValidChangedFiles() {
  const statusOutput = execSync('git status --porcelain', { encoding: 'utf8' });
  const changedFiles = statusOutput.trim().split('\n')
    .filter(line => line.trim())
    .map(line => line.substring(3).trim())
    .filter(file => {
      const unwantedPatterns = [
        /^current-task-context\.json$/,
        /^output\.txt$/,
        /^task-output\.txt$/,
        /^claude-output\.txt$/,
        /^tasks\.json$/,
        /^\.claude-context/,
        /\.tmp$/,
        /\.temp$/,
        /^\.debug-/
      ];
      return !unwantedPatterns.some(pattern => pattern.test(file));
    });
  
  return changedFiles;
}

function commitAndPushChanges(taskIndex, taskData, previousTasks, currentBranch, workflowToken, context) {
  cleanTempFiles();
  
  const changedFiles = getValidChangedFiles();
  if (changedFiles.length === 0) {
    return false; // No changes to commit
  }
  
  changedFiles.forEach(file => execSync(`git add "${file}"`));
  
  execSync(`git commit -m "Sequential Task ${taskIndex + 1}: ${taskData.title}

${taskData.body}

This task builds on previous changes from:
${previousTasks.map(t => `- Task ${t.id}: ${t.title}`).join('\n') || '- Starting from main branch'}

Files modified: ${changedFiles.join(', ')}

🤖 Generated with Claude Code Sequential Executor
Co-authored-by: Claude <claude@anthropic.com>"`);

  if (workflowToken) {
    const repoUrl = `https://x-access-token:${workflowToken}@github.com/${context.repo.owner}/${context.repo.repo}.git`;
    execSync(`git remote set-url origin ${repoUrl}`);
  }

  execSync(`git push origin ${currentBranch}`);

  if (workflowToken) {
    const cleanRepoUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}.git`;
    execSync(`git remote set-url origin ${cleanRepoUrl}`);
  }

  return true; // Changes committed
}

function handleClaudeBranchMerge(parentIssue, currentBranch, taskIndex) {
  const claudeBranchPattern = `claude/issue-${parentIssue}-`;
  
  execSync('git fetch origin', { stdio: 'pipe' });
  const remoteBranches = execSync('git branch -r', { encoding: 'utf8' });
  const claudeBranches = remoteBranches.split('\n')
    .map(branch => branch.trim().replace('origin/', ''))
    .filter(branch => branch.startsWith(claudeBranchPattern))
    .sort()
    .reverse();

  if (claudeBranches.length === 0) {
    return currentBranch; // No Claude branch found
  }

  const claudeBranch = claudeBranches[0];
  try {
    const comparison = execSync(`git rev-list --count origin/${currentBranch}..origin/${claudeBranch}`, { encoding: 'utf8' }).trim();
    const commitsAhead = parseInt(comparison);

    if (commitsAhead > 0) {
      execSync(`git checkout ${currentBranch}`);
      execSync(`git reset --hard origin/${currentBranch}`);
      execSync(`git merge origin/${claudeBranch} --no-edit -m "Sequential Task ${taskIndex + 1}: Merge implementation from ${claudeBranch}"`);
      execSync(`git push origin ${currentBranch}`);
      return currentBranch;
    }
  } catch (mergeError) {
    return claudeBranch; // Use Claude's branch directly on merge failure
  }

  return currentBranch;
}

module.exports = {
  configureGit,
  createTaskBranch,
  hasChanges,
  cleanTempFiles,
  getValidChangedFiles,
  commitAndPushChanges,
  handleClaudeBranchMerge
};