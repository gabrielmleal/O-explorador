# Workflow Setup Instructions

## Personal Access Token Configuration

To enable the automated workflow chain (context → tasks → PRs), you need to create a Fine-Grained Personal Access Token that can trigger workflows.

### Step 1: Create Fine-Grained PAT

1. Go to GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. Click "Generate new token"
3. Configure the token:
   - **Token name**: `workflow-automation-token`
   - **Expiration**: 90 days (or as needed)
   - **Resource owner**: Select your account/organization
   - **Repository access**: Selected repositories → Choose this repository

### Step 2: Configure Repository Permissions

Grant the following permissions to the token:

**Required Permissions:**
- **Actions**: Write (to trigger workflows)
- **Contents**: Write (to create branches and files)
- **Issues**: Write (to create/update issues and comments)
- **Pull requests**: Write (to create PRs)
- **Metadata**: Read (for repository access)

### Step 3: Add Token to Repository Secrets

1. Navigate to your repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add the secret:
   - **Name**: `WORKFLOW_TRIGGER_TOKEN`
   - **Secret**: Paste your Fine-Grained PAT

### Step 4: Verify Setup

After completing the token setup, test the workflow:

1. Go to Actions → Context to Tasks Orchestrator
2. Click "Run workflow"  
3. Provide test context input
4. Verify the full chain executes: context analysis → task creation → PR generation

## Security Notes

- The PAT has minimal required permissions for this repository only
- Token is stored securely in GitHub Secrets
- Regular token rotation is recommended (90-day expiry)
- Only repository collaborators can trigger workflows

## Troubleshooting

**Issue**: Workflows still not triggering
- Verify token has correct repository access
- Check token hasn't expired
- Ensure secret name matches exactly: `WORKFLOW_TRIGGER_TOKEN`

**Issue**: Permission denied errors
- Review token permissions match requirements above
- Regenerate token if permissions were modified after creation