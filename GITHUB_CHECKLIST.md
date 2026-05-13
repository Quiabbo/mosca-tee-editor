# Before Pushing to GitHub

Just some things to remember before making the push.

## Make sure the basics are in order

- All documentation looks good
- LICENSE file is set to GPL-3.0
- .gitignore is properly configured
- package.json version is 1.0.0

## Files worth checking

Make sure these are there:
- README.md
- LICENSE
- CONTRIBUTING.md
- CODE_OF_CONDUCT.md
- SECURITY.md
- .flatpak files for Flatpak building

## Git commands

If you haven't done it yet:

```bash
cd /Users/filipihadji/Documents/Designer\ Brasil\ /Mosca\ Tee/mosca-tee-_-editor-de-design-online-grátis---200

# See what will be pushed
git status

# Add everything
git add .

# Commit with a message
git commit -m "Add Flatpak support and complete project documentation"

# Push to GitHub
git push origin main
```

## After pushing

Check that everything shows up correctly on GitHub. The README should display properly, and all your documentation files should be visible.

## On Linux Mint later

When you get to Linux Mint:

```bash
./.flatpak-validate.sh    # Check if your system has what's needed
./.flatpak-build.sh       # Build the Flatpak
flatpak run com.moscatee.MoscaTee  # Test it
```

That's it. Keep it simple.

---

Você está pronto para o GitHub! 🚀
