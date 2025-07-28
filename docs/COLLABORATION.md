# COLLABORATION.md - Team Development Guidelines

## Core Philosophy

You're working alongside other Claude Code instances and human developers. Since merge conflicts are resolvable, prioritize writing excellent code over avoiding conflicts.

## Key Principles

### 1. Quality First
- Write the best solution, even if it modifies shared files
- Refactor when it improves the codebase
- Don't compromise code quality for conflict avoidance

### 2. Clear Communication
- Write descriptive commit messages explaining your changes
- Document why you made specific decisions
- Use PR descriptions to communicate with teammates

### 3. Stay Synchronized
```bash
# Before starting work
git pull origin main
git log --oneline -10  # See recent changes

# Push frequently
git push origin feature-branch
```

## Best Practices

### When Modifying Shared Code

1. **Make it better**: If you're touching a file, improve it
2. **Be thorough**: Complete refactors rather than partial changes
3. **Test everything**: Ensure your changes don't break existing functionality

### Documentation

Add comments when your code might surprise others:
```typescript
// Refactored to use async/await pattern for consistency
// Previous implementation used callbacks
```

### Commit Messages

Be specific about what and why:
```
Refactor auth flow to use JWT tokens

- Replaced session-based auth with JWT
- Improved security and scalability
- All existing auth endpoints maintained

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## What to Avoid

1. **Half-finished work**: Complete what you start
2. **Uncommitted changes**: Push regularly
3. **Unclear intentions**: Always explain significant changes

## Handling Conflicts

When conflicts arise:
1. I'll resolve them by understanding both changes
2. Merge the best aspects of both versions
3. Ensure the result is better than either original
4. Document the resolution in the merge commit

## Summary

Write excellent code. Communicate clearly. Push frequently. Don't worry about conflicts - they're just opportunities to combine the best ideas from multiple developers.

Focus on making the codebase better with every commit.