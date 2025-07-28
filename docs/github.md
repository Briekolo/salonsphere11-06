# GitHub Workflow Guide for Claude Code

This document provides explicit instructions for Claude Code instances to follow when working with Git and GitHub. Follow these procedures exactly as written to ensure consistent collaboration between multiple Claude Code instances and human developers.

## Quick Reference for Common Workflows

### Starting New Feature
```bash
git checkout main && git pull origin main
git checkout -b feature-name
git status
```

### Committing Changes
```bash
git status
git diff
git add specific/file.tsx
git commit -m "$(cat <<'EOF'
Add feature: Brief description

- Detail 1
- Detail 2

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
git push -u origin feature-name
```

### Creating PR
```bash
gh pr create --title "Title" --body "$(cat <<'EOF'
## Summary
- Key change 1
- Key change 2

## Test plan
- [ ] Test 1
- [ ] Test 2

🤖 Generated with [Claude Code](https://claude.ai/code)
EOF
)"
```

## IMPORTANT: Prerequisites
Before any Git operations, ALWAYS:
1. Run `git status` to check current state
2. Verify you're in the correct repository  
3. Check for uncommitted changes that might conflict
4. Never assume - always verify current branch with `git branch --show-current`

## Table of Contents
1. [Feature Branch Workflow](#feature-branch-workflow)
2. [Commit Guidelines](#commit-guidelines)
3. [Pull Request Process](#pull-request-process)
4. [Code Review](#code-review)
5. [Merging](#merging)
6. [Critical Rules](#critical-rules)

## Feature Branch Workflow

### Creating a Feature Branch

**IMPORTANT**: Never work directly on `main` branch. Always use feature branches.

1. **First, ensure you're on main and up to date**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create a new feature branch OR switch to existing one**
   ```bash
   # For new branch:
   git checkout -b feature-name
   
   # For existing branch:
   git checkout feature-name
   ```
   - Branch naming convention: use lowercase with hyphens (e.g., `add-user-auth`, `fix-navigation-bug`, `update-ui-components`)
   - If branch exists remotely, it will automatically track it

3. **ALWAYS verify branch and status**
   ```bash
   git status
   git branch --show-current
   ```
   - Confirm you're on the correct branch before ANY changes
   - If there are uncommitted changes, decide whether to:
     - Commit them if they're complete
     - Stash them: `git stash push -m "WIP: description"`
     - Discard them: `git checkout -- .` (CAUTION: irreversible)

### Working on Features

1. **Before making changes, sync with remote**
   ```bash
   git pull origin $(git branch --show-current)
   ```

2. **Make your changes**
   - Focus on a single feature or fix per branch
   - Follow existing code conventions (check CLAUDE.md)
   - Keep changes focused and avoid scope creep
   - Run tests/linting after changes (see CLAUDE.md for commands)

3. **Regularly review your changes**
   ```bash
   # See unstaged changes
   git diff
   
   # Compare with main branch
   git diff origin/main -- src/
   
   # List changed files only
   git diff --name-only origin/main
   ```
   - Ensure only intended files are modified
   - Check for accidental changes to unrelated files

## Commit Guidelines

### Creating Quality Commits

**CRITICAL**: NEVER use `git add .` unless you've carefully reviewed ALL changes.

1. **Review what will be staged**
   ```bash
   # See all changes
   git status
   
   # Review specific file before staging
   git diff path/to/file.tsx
   ```

2. **Stage specific changes only**
   ```bash
   # Stage individual files
   git add src/components/NoteCard.tsx
   
   # Stage multiple specific files
   git add src/components/Button.tsx src/utils/helpers.ts
   
   # Interactive staging for partial file changes
   git add -p src/components/Component.tsx
   ```
   - Only stage files related to the current feature
   - NEVER stage: .env files, build artifacts (.next/), node_modules/, or temporary files

3. **Write descriptive commit messages**
   ```bash
   # ALWAYS use heredoc format for multi-line commits
   git commit -m "$(cat <<'EOF'
   [Action] [Component/Area]: Brief description (50 chars max)

   - Detailed change 1
   - Detailed change 2
   - Detailed change 3

   🤖 Generated with [Claude Code](https://claude.ai/code)

   Co-Authored-By: Claude <noreply@anthropic.com>
   EOF
   )"
   ```
   
   **Example actions**: Add, Update, Fix, Remove, Refactor, Enhance, Implement
   **Example**: "Add user authentication: Implement JWT-based auth flow"

### Commit Message Format

- **First line**: Concise summary (50 chars or less)
- **Body**: Detailed explanation of changes
  - Use bullet points for multiple changes
  - Explain the "why" not just the "what"
  - Reference issue numbers if applicable
- **Footer**: Attribution for AI-assisted development

### Push to Remote

**ALWAYS push after committing to prevent work loss**

```bash
# First push of a new branch
git push -u origin feature-name

# Subsequent pushes
git push origin feature-name

# If rejected, pull first then push
git pull origin feature-name --rebase
git push origin feature-name
```

## Pull Request Process

### Creating a Pull Request

1. **Use GitHub CLI for consistency**
   ```bash
   gh pr create --title "Enhance NoteCard UI with colorful gradients and improved styling" --body "$(cat <<'EOF'
   ## Summary
   - Added dynamic gradient backgrounds that vary by note ID for visual variety
   - Enhanced hover effects with scale, shadow, and backdrop blur for modern UI
   - Improved mobile UX with always-visible action buttons and better touch targets

   ## Changes
   - **Visual Design**: Implemented 8 colorful gradient themes with matching icon colors
   - **Animations**: Added smooth hover transitions with scale and elevation effects
   - **Mobile Support**: Improved button sizing and visibility for touch devices
   - **Typography**: Enhanced text hierarchy with better font weights and spacing

   ## Test plan
   - [ ] Verify gradients display correctly across different notes
   - [ ] Test hover effects on desktop
   - [ ] Confirm action buttons are accessible on mobile devices
   - [ ] Check that all animations are smooth and performant

   🤖 Generated with [Claude Code](https://claude.ai/code)
   EOF
   )"
   ```

### PR Description Template

Every PR should include:

1. **Summary**: 2-3 bullet points of key changes
2. **Changes**: Detailed breakdown by category
3. **Test Plan**: Checklist of validation steps
4. **Attribution**: Note if AI-assisted

## Code Review

### Review Process

1. **List open PRs**
   ```bash
   gh pr list
   ```

2. **View PR details**
   ```bash
   gh pr view 1
   ```

3. **Review the diff**
   ```bash
   gh pr diff 1
   ```

### Review Checklist

- ✅ **Code Quality**
  - Follows project conventions
  - No unnecessary complexity
  - Clear variable/function names

- ⚠️ **Performance**
  - No redundant calculations
  - Efficient algorithms
  - Considers mobile devices

- 🔒 **Security**
  - No exposed secrets
  - Proper input validation
  - Safe data handling

- 🎨 **UI/UX**
  - Responsive design
  - Accessibility compliance
  - Consistent styling

### Providing Feedback

Structure reviews with:
- **Overview**: What the PR accomplishes
- **Strengths**: What works well
- **Improvements**: Specific suggestions
- **Issues**: Any blockers or risks

## Merging

### Merge Requirements

Before merging:
1. All CI checks pass
2. Code review approved
3. No merge conflicts
4. Test plan completed

### Merge Process

1. **Merge the PR**
   ```bash
   gh pr merge 1 --merge
   ```
   - Use `--merge` for standard merge commits
   - Use `--squash` for cleaner history (if preferred)
   - Use `--rebase` for linear history (if team prefers)

2. **Update local main**
   ```bash
   git checkout main
   git pull origin main
   ```

### Post-Merge

- Delete remote feature branch (if not auto-deleted)
- Update project boards/issues
- Notify team of significant changes

## Best Practices

### General Guidelines

1. **Commit Early, Commit Often**
   - Make atomic commits
   - Each commit should be functional
   - Easier to review and revert if needed

2. **Keep PRs Small**
   - Easier to review
   - Faster to merge
   - Less chance of conflicts

3. **Communicate**
   - Use PR descriptions effectively
   - Comment on complex code
   - Ask for reviews proactively

### When Using AI Assistance

1. **Review AI-Generated Code**
   - Understand every line
   - Verify it follows project patterns
   - Test thoroughly

2. **Document AI Usage**
   - Include attribution in commits
   - Note in PR descriptions
   - Helps track AI-assisted development

3. **Maintain Consistency**
   - AI should follow CLAUDE.md guidelines
   - Ensure consistent code style
   - Preserve project conventions

## Common Commands Reference

```bash
# Branch Management
git checkout -b feature-name    # Create new branch
git checkout feature-name       # Switch to existing branch
git branch -d feature-name      # Delete local branch

# Viewing Changes
git status                      # Current branch status
git diff                        # Unstaged changes
git diff --staged              # Staged changes
git log --oneline -10          # Recent commits

# GitHub CLI
gh pr list                      # List open PRs
gh pr create                    # Create new PR
gh pr view <number>            # View PR details
gh pr diff <number>            # View PR diff
gh pr merge <number>           # Merge PR
gh pr close <number>           # Close PR

# Syncing
git fetch origin               # Fetch remote changes
git pull origin main           # Update main branch
git push origin feature-name   # Push feature branch
```

## Troubleshooting

### Common Issues

1. **Merge Conflicts**
   - Pull latest main: `git pull origin main`
   - Resolve conflicts in editor
   - Stage resolved files: `git add .`
   - Complete merge: `git commit`

2. **Behind Main Branch**
   - Update feature branch: `git pull origin main`
   - Or rebase: `git rebase origin/main`

3. **Accidental Commits**
   - Undo last commit: `git reset HEAD~1`
   - Keep changes staged: `git reset --soft HEAD~1`

## Critical Rules

### NEVER DO THESE:
1. **NEVER commit directly to main branch**
2. **NEVER use `git push --force` without explicit user permission**
3. **NEVER commit sensitive data (API keys, passwords, .env files)**
4. **NEVER use `git add .` without reviewing changes**
5. **NEVER merge without running tests/linting first**
6. **VERY IMPORTANT: NEVER APPLY ANY GIT COMMANDS THAT WILL ALTER FILES, COMMIT, MERGE OR PUSH, PULL OR DO ANYTHING. THIS SHOULD ALWAYS BE REQUESTED BY THE USER**

### ALWAYS DO THESE:
1. **ALWAYS create feature branches for new work**
2. **ALWAYS pull latest changes before starting work**
3. **ALWAYS write descriptive commit messages with AI attribution**
4. **ALWAYS review diffs before committing**
5. **ALWAYS push after committing to prevent work loss**
6. **ALWAYS run project health checks before creating PR** (see CLAUDE.md)

### Handling Multiple Claude Instances

When multiple Claude Code instances work on the same repository:

1. **Communication through commits**: Use detailed commit messages as communication
2. **Branch isolation**: Each instance should work on separate feature branches
3. **Frequent pulls**: Run `git pull origin main` before starting any work
4. **Clear PR descriptions**: Thoroughly document what was changed and why
5. **Avoid conflicts**: Check which files others are working on via `git log --oneline -20`

### Error Recovery

If you encounter errors:

1. **Don't panic or force push**
2. **Save current state**: `git stash push -m "Error recovery: description"`
3. **Check status**: `git status` and `git log --oneline -5`
4. **Ask for help**: Inform the user of the specific error
5. **Document the issue**: Include error messages in your response

Remember: This workflow is designed for AI-AI and AI-human collaboration. Follow it exactly to ensure smooth teamwork.