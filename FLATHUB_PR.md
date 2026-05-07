# Flathub submission PR - com.moscatee.Editor

This repository contains the Flatpak manifest at `flatpak/com.moscatee.Editor.yml` and app metainfo at `flatpak/com.moscatee.Editor.metainfo.xml`.

To submit to Flathub, follow these steps:

1. Fork the `flathub` repository: https://github.com/flathub/flathub
2. Create a branch in your fork, e.g. `add-com.moscatee.Editor`.
3. Add the manifest and metainfo to your fork under `com.moscatee.Editor/` or follow the Flathub guidelines (typically add under `data/` or `apps/` as required). Provide the manifest file `com.moscatee.Editor.yml` and the metainfo XML.
4. Commit and push the branch.
5. Open a Pull Request from your fork/branch to `flathub/flathub` with the title: "Add com.moscatee.Editor"
6. In the PR description include:
   - Link to this repository: https://github.com/Quiabbo/mosca-tee-editor
   - Release tag to build from: `v0.0.1`
   - Any additional notes (runtime requirements, special build steps).

Notes / checklist:
- The `commit` field in `flatpak/com.moscatee.Editor.yml` is set to `bfbed92c98b95b0254693115828dbd1c24893713` (branch `release/flathub-v0.0.1`).
- Ensure screenshots and icon URLs in `com.moscatee.Editor.metainfo.xml` point to valid resources in this repository.
- CI: Once PR is opened, Flathub's bot will attempt to build the Flatpak and report errors. You may need to iterate on the manifest.

If you want, I can open the PR using the GitHub CLI (`gh`) if you provide authentication here, or I can provide the exact sequence of commands to run from your machine to open the PR.
