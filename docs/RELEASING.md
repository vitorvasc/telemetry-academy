# Releases and production builds

Every push to `main` deploys to Cloudflare Pages after type checking, lint, tests, and build succeed. Release Please manages version/changelog PRs and GitHub releases separately. This private app is not published to npm.

## GitHub App setup (required before merging the token migration)

Release Please uses an installation token so its PR events can trigger CI. There is no `GITHUB_TOKEN` fallback. Missing credentials fail the workflow with a setup error.

1. In [GitHub App settings](https://github.com/settings/apps), reuse an authorized App or register one for release automation. Disable webhooks if creating a dedicated App.
2. Grant only repository **Contents: Read and write** and **Pull requests: Read and write** (Metadata read is implicit). No organization permissions, Actions write, or ruleset bypass are needed.
3. Install the App on `vitorvasc/telemetry-academy` with **Only select repositories**. Approve permission updates if reusing an installation.
4. In the repository's [Actions variables](https://github.com/vitorvasc/telemetry-academy/settings/variables/actions), set `RELEASE_PLEASE_APP_CLIENT_ID` to the App's Client ID.
5. Generate a private key in the App settings. Store the complete PEM as the repository Actions secret `RELEASE_PLEASE_APP_PRIVATE_KEY` in [Actions secrets](https://github.com/vitorvasc/telemetry-academy/settings/secrets/actions). Never paste it into a PR, chat, or log.
6. Before merging the migration, confirm both names exist and the installation has the permissions above. After the next authorized push to `main`, verify Release Please succeeds and an App-created/updated release PR starts CI. If no release PR update is needed, verify on the next release-bearing change.

The [official token action](https://github.com/actions/create-github-app-token) is pinned to a commit. It limits the token to this repository and the two write permissions, and revokes it when the job finishes. The workflow's built-in token has no permissions.

Keep the required approval, resolved discussions, squash merge, and `Build & Lint` gates. Do not merge a release PR just to test activation: merging it lets Release Please create a tag and GitHub release.

## Version policy

Release PRs are requested ready for review. Before 1.0, `fix:` increments patch, `feat:` increments minor, and breaking changes increment minor. Maintenance classified as `chore:` or `ci:` does not independently trigger a release. Changelog sections remain unchanged.

As of 2026-09-21, the latest release is `telemetry-academy-v0.1.4`. Existing draft PR [#250](https://github.com/vitorvasc/telemetry-academy/pull/250) proposes 0.1.5 solely for merged `fix(renovate): consolidate dependency update configuration (#249)` and has no checks. The new configuration does not reclassify that merged commit: it still qualifies for a patch release. It also does not retroactively generate missing CI events. After App activation, inspect the next update and explicitly mark the existing PR ready if it remains draft. Review its release content before any merge; this migration does not publish or merge it.

## Correlating Datadog with a deployment

Production sets `VITE_DD_VERSION` to `<package.json version>+<first 12 characters of the commit SHA>`, for example `0.1.4+1af8b82f3ff5`. The existing RUM initialization sends this as the Datadog service version for `telemetry-academy` in `production`.

Filter Datadog RUM by that version, then open `https://github.com/vitorvasc/telemetry-academy/commit/<SHA suffix>` or match the SHA to the production Actions run and Cloudflare deployment. The prefix identifies the package release baseline; the suffix identifies the deployed code between releases. Rebuilding the same commit produces the same version because it contains no timestamp or run number.
