# Vercel Deployment Management Scripts

## Overview

This directory contains scripts to help manage Vercel deployments for the `jabclub` and `jabclub-api-backend` projects.

## Scripts

### `delete-failed-deployments.sh`

Bulk delete failed deployments from both Vercel projects.

#### Usage

```bash
# Dry run (preview what will be deleted)
./scripts/delete-failed-deployments.sh --dry-run

# Delete with confirmation prompt
./scripts/delete-failed-deployments.sh

# Delete without confirmation (auto-yes)
./scripts/delete-failed-deployments.sh --yes
```

#### Using npm scripts

```bash
# Preview failed deployments
npm run vercel:delete-failed:dry-run

# Delete failed deployments (with confirmation)
npm run vercel:delete-failed

# Delete failed deployments (without confirmation)
npm run vercel:delete-failed:yes
```

#### What it does

1. Checks both `jabclub` and `jabclub-api-backend` projects for failed deployments
2. Extracts deployment IDs from failed deployment URLs
3. Shows a summary of what will be deleted
4. Deletes all failed deployments in bulk

## Other Useful Commands

### List all deployments

```bash
# List all deployments for current project
npm run vercel:list

# List only failed deployments
npm run vercel:list-failed

# List deployments for specific project
npm run vercel:list-jabclub
npm run vercel:list-backend
```

### Using Vercel CLI directly

```bash
# List all projects
vercel project ls

# List deployments for a specific project
vercel ls jabclub
vercel ls jabclub-api-backend

# List only failed deployments
vercel ls jabclub --status ERROR
vercel ls jabclub-api-backend --status ERROR

# Delete a specific deployment
vercel remove dpl_xxxxxxxxxxxxx

# Delete multiple deployments
vercel remove dpl_xxx dpl_yyy dpl_zzz
```

## Projects

- **jabclub**: Frontend project (Next.js)
- **jabclub-api-backend**: Backend project (Express.js)

Both projects are deployed on Vercel under the scope "Youssef madkour's projects".
