# GitHub Configuration Files

This directory contains GitHub-specific configuration files that enhance your project's GitHub experience.

## Contents

### Issue Templates

Located in `.github/ISSUE_TEMPLATE/`:

#### `bug_report.md`
- **Purpose**: Standardized bug report template
- **When to use**: When reporting bugs and issues
- **Includes**: Environment details, reproduction steps, expected vs actual behavior
- **Benefit**: Consistent bug reports make fixing easier

#### `feature_request.md`
- **Purpose**: Feature request template
- **When to use**: When proposing new features
- **Includes**: Problem description, proposed solution, alternatives
- **Benefit**: Helps prioritize community requests

#### `accessibility.md`
- **Purpose**: Accessibility-specific issue template
- **When to use**: When reporting accessibility problems
- **Includes**: Assistive technology used, affected features, WCAG compliance notes
- **Benefit**: Prioritizes accessibility as a core concern

### Pull Request Template

Located in `.github/PULL_REQUEST_TEMPLATE.md`:

- **Purpose**: Standardized PR template
- **When to use**: When submitting pull requests
- **Includes**: Description, type of change, testing details, accessibility considerations
- **Benefit**: Ensures thorough PR reviews and quality standards

## How GitHub Uses These Files

### Automatic Appearance

When someone tries to create a new issue or PR:

1. **Issues**: GitHub shows the available templates from `ISSUE_TEMPLATE/`
2. **PRs**: GitHub automatically fills the PR template
3. **User sees**: A dropdown to choose or auto-populated form

### Benefits

- ✅ Consistent issue quality
- ✅ Better organized information
- ✅ Faster issue resolution
- ✅ Community engagement
- ✅ Accessibility prioritization

## Examples

### Creating a Bug Report

1. Click "New Issue"
2. See template options
3. Click "Bug report"
4. Fill in the template
5. Submit

### Creating a Feature Request

1. Click "New Issue"
2. See template options
3. Click "Feature request"
4. Fill in the template
5. Submit

### Creating a Pull Request

1. Click "New Pull Request"
2. See template auto-filled
3. Fill in the required sections
4. Submit

## Customization

To modify these templates:

1. Edit the `.md` files directly
2. Update the frontmatter (YAML at top)
3. Modify the template content
4. Commit and push changes
5. GitHub will use new templates immediately

## Best Practices

### For Maintainers

- Keep templates concise but comprehensive
- Update templates based on issue quality
- Reference templates in documentation
- Periodically review and refine

### For Contributors

- Use the provided templates
- Fill out all sections
- Be detailed and specific
- Include screenshots/recordings when relevant
- Search for duplicates first

## Additional GitHub Features

Consider also setting up:

- **Branch protection rules** - Require PR reviews before merge
- **Code owners** - Automatic reviewer assignment
- **Labels** - Organize issues (bug, enhancement, help-wanted, etc.)
- **Milestones** - Track progress toward releases
- **Discussions** - Community conversations
- **Wikis** - Extended documentation
- **Pages** - Project website

## Documentation

For more information about GitHub templates, see:
- [GitHub Docs - Issue Templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-template-for-your-repository)
- [GitHub Docs - PR Templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository)

## Support

If you need help with GitHub configuration:

1. Check the [Mosca Tee Documentation](../README.md)
2. Review the [Contributing Guide](../CONTRIBUTING.md)
3. Open a GitHub Discussion or Issue

---

**These templates help make Mosca Tee community-friendly and organized!** 🎨
