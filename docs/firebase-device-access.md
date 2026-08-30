# Firebase Device Access Runbook

Manual release gate: there is **no automatic production deployment**.

Use this runbook to stage and activate installation-level access for `inventario-9863a`. The application uses silent anonymous Auth, a manually managed `deviceAccess/{uid}` record, and a fail-closed shell; it does not provide human login or client-side approval. This is a manual rollout: **nothing in the repository or build automatically deploys production rules**.

> **Stop gate:** Do not activate staging or final rules while the legacy snapshot is unverified, a required check is blocked, or the rollback snapshots are incomplete.

## Quick path

1. Confirm the preconditions and freeze unapproved production changes.
2. Capture the currently deployed rules as an explicitly **unverified legacy snapshot**: exact text, SHA-256, and UTC capture time.
3. Review the tested final candidate and prepare a separate staging snapshot.
4. Manually apply staging rules: deny inventory, allow only an authenticated installation to read its own access record, and deny every client allowlist write.
5. Launch a controlled client set, collect each displayed UID, then audit, clean up, and recreate the intended allowlist records in Firebase Console.
6. Manually activate the final tested rules and roll out the gated client only after every verification gate passes.
7. Record results and keep the legacy, staging, final-rules, and client rollback snapshots together.

## Preconditions

- The target project is `inventario-9863a`; the operator has the required Firebase Console and separately controlled deployment access.
- A reviewed client build contains the anonymous Auth flow and the approved-only shell gate. Pending, revoked, unavailable, and identity-loss states must remain blocked.
- Anonymous Auth is enabled for the target project. No human-login UI, custom-token service, service-account key, Admin SDK key, signing key, or privileged secret is part of the client or repository.
- A named administrator owns the access roster and a second reviewer confirms destructive allowlist cleanup and final activation.
- The exact rules and client snapshots have an external, access-controlled storage location. Do not put privileged credentials or secret files in the repository, `dist/`, `out/`, the installer, the renderer, or web storage.
- The current deployed rules have been captured before any change. If their text, hash, or date is unavailable, the rollout is blocked.
- The release evidence below is a record of this work unit. It is not a production deployment approval; the blocked checks must be resolved before release.

## Snapshot register

Keep these snapshots immutable and record the operator, reviewer, UTC timestamp, SHA-256, target project, and activation result for each one:

| Snapshot | Required contents | Use |
|---|---|---|
| Legacy | Exact deployed rules text, SHA-256, UTC capture date/time, and **unverified** status | Emergency reference only; never infer approvals from it |
| Staging | Temporary deny-inventory rules text, SHA-256, and review date/time | Safe UID collection and allowlist cleanup |
| Final | Tested `firestore.rules` text, SHA-256, test results, and activation date/time | Production authorization candidate |
| Client | Exact gated package/version and SHA-256, plus the previous client package | Client rollback without changing unrelated data |

### Legacy snapshot status for this work unit

No Firebase Console read or production deployment was performed here. These fields are intentionally **unverified**, not placeholders for approval:

| Field | Value |
|---|---|
| Text | **UNVERIFIED / NOT CAPTURED** — deployed rules text was not retrieved |
| SHA-256 | **UNVERIFIED / NOT COMPUTED** — exact text is unavailable |
| Captured at | **UNVERIFIED / NOT CAPTURED** — no Console capture was performed |
| Release gate | **BLOCKED** until an authorized operator fills all three fields and a reviewer confirms them |

When an authorized operator starts rollout, retrieve the deployed rules without editing them, save the exact text in the controlled snapshot location, run `sha256sum <legacy-rules-file>`, and record the UTC timestamp immediately. A repository copy of `firestore.rules` is the tested candidate, not proof of what is deployed.

## Safe sequence

### 1. Freeze and capture

1. Announce a change window and prohibit unreviewed Console or client changes.
2. Capture and independently check the legacy text/hash/date. Stop if any field is missing.
3. Export or otherwise preserve the existing `deviceAccess` records for audit. Do not treat an old record as an approval merely because it exists.

### 2. Review the candidates locally

Run the release checks in the evidence section. The final rules must remain default-deny and must preserve the approved workflow:

- Approved UIDs may read and mutate valid products, read/create valid movements, and cannot update/delete movement history.
- Unauthenticated, missing, pending, revoked, malformed, mismatched, or newly reinstalled UIDs cannot read inventory.
- A client can read only its own access record; it cannot list, create, update, or delete any allowlist record.
- Direct quantity edits and product deletion remain known audit/lifecycle limitations; this rollout does not redesign them or add cascade cleanup.

### 3. Apply staging manually

Prepare a separately named staging snapshot and have it reviewed before applying it to the target. Staging MUST have these semantics:

```text
deviceAccess/{uid}
  authenticated request for its own UID: allow get
  list: deny
  create/update/delete: deny

every inventory and every other unspecified path: deny read and write
```

Staging therefore denies inventory access for every installation, permits only an authenticated installation's own-record read, and denies every client allowlist write; in short, it **denies allowlist writes**. Apply it through an explicit, human-approved Console or reviewed deployment action; never through CI, an application startup hook, or an automatic production step. Verify the staging snapshot before continuing.

### 4. Collect UIDs with a controlled launch

While staging is active:

1. Launch only the controlled client set with anonymous Auth enabled.
2. Record the UID and a human-readable physical/device label from the blocker out of band. Record no Auth token or private credential.
3. Confirm that first launch, a normal restart, and a missing local profile behave as expected: the first two use the same UID; identity loss produces a new pending UID.
4. Do not attempt approval from the app. The client has no allowlist-write path and must remain blocked until an administrator recreates its record.

### 5. Audit, clean up, and recreate in Firebase Console

1. Compare every collected UID with the operator-owned roster and the preserved legacy allowlist export.
2. Audit every pre-existing `deviceAccess` record, including its exact `uid`, label, status, and provenance.
3. After the reviewed export and cleanup approval, delete every pre-existing access record from the target allowlist, including stale or unverified records. Preserve the audit snapshot; do not promise that deleted records can be restored.
4. Recreate **only** intended records in Firebase Console, with the exact UID, a non-empty human-readable label, and an explicit `pending`, `approved`, or `revoked` status. Recreated approvals must be based on the controlled-launch UID and administrator review, not on a stale record alone.
5. Verify that every pre-existing installation remains blocked until its current UID is explicitly approved. A reinstall is a new UID and does not inherit approval.

### 6. Activate the final candidate

Proceed only when the legacy fields are complete, staging probes pass, UIDs and records are reviewed, and all release checks required by the change are green. Manually activate the tested final rules for `inventario-9863a`, then roll out the gated client in the approved change window. Do not claim success from a local build alone, and do not perform a production deployment from this repository or from an automatic pipeline.

## Verification

### Operator checklist

- [ ] Legacy deployed rules text, SHA-256, and UTC capture date/time are recorded and independently checked.
- [ ] Staging denies all inventory reads/writes, allows only an authenticated own-record `get`, and denies list/create/update/delete on `deviceAccess`.
- [ ] Controlled clients display a UID and remain blocked until their Console record is approved.
- [ ] Console audit, deletion, and recreation are complete; stale records were not silently reused.
- [ ] Final rules tests and client tests pass; approved routes `/`, `/agregar`, `/editar/:id`, and `/movimientos/:id` remain available.
- [ ] A packaged `file://` client keeps its UID across two restarts with one isolated profile and receives a new unapproved UID after profile removal/reinstall.
- [ ] Rules, staging, final client, and previous-client rollback snapshots are stored with hashes and timestamps.
- [ ] No deployment, Firebase Console mutation, or privileged credential access is counted as complete without an operator record.

### Auth → access → shell → rules evidence (pre-console-fix diagnostic)

The application-level chain is covered by the Angular service and shell tests: Auth establishes or restores an anonymous UID, the access service maps its own record to an access state, the shell renders the blocker unless the state is approved, and the rules suite independently authorizes or denies the Firestore request. The current Angular run passed the service and shell layers (28/28), and the Firestore emulator suite passed independently (10/10). The packaged launch reached the real `file://` page, but the configured Firebase Auth endpoint returned `CONFIGURATION_NOT_FOUND`, so no UID was available for the packaged persistence scenarios.

## PR5 release evidence — pre-console-fix diagnostic (historical) — 2026-08-29 (local `-05:00`)

These results are reproducible evidence from this worktree. No Firebase Console mutation, production deployment, commit, push, or repository dependency or lockfile change was performed.

| Check | Exact command | Result |
|---|---|---|
| Full Angular tests (`F`) | `CHROME_BIN=/snap/bin/chromium npm test` | **PASS** — Chrome 151; `TOTAL: 77 SUCCESS`; expected simulated error logs only |
| Firestore rules (`R`) | `JAVA_HOME=/tmp/opencode/control-inventario-pr5-runtime/java PATH=/tmp/opencode/control-inventario-pr5-runtime/java/bin:$PATH npm run test:rules` | **PASS** — Firebase CLI 13.35.1; 10/10 `node:test` cases passed; emulator script exited 0 |
| Typecheck | `npx tsc -p tsconfig.app.json --noEmit` | **PASS** — exit 0, no output |
| Production build | `npm run build` | **PASS** — bundle generated; existing 500 kB initial-budget and SweetAlert2 CommonJS warnings |
| Development build | `npm run build -- --configuration development` | **PASS** — bundle generated |
| Credential filename inspection | `git ls-files -co --exclude-standard \| node --input-type=module -e "import { readFileSync } from 'node:fs'; const paths = readFileSync(0, 'utf8').trim().split(/\\r?\\n/).filter(Boolean); const secret = /(^|\\/)(?:\\.env(?:\\..*)?|.*(?:service.?account|firebase-adminsdk|credential).*\\.(?:json|pem|key)|.*\\.(?:pem|key))$/i; const matches = paths.filter((path) => secret.test(path)); console.log('candidate_paths=' + paths.length); console.log('secret_path_matches=' + matches.length); if (matches.length) console.log(matches.join('\\n')); else console.log('No denied credential filenames opened or read.');"` | **PASS** — `candidate_paths=70`, `secret_path_matches=0`; filename paths only, no denied credential file opened/read |
| Auth → access → shell | `CHROME_BIN=/snap/bin/chromium npm test -- --include=src/app/service/installation-access.service.spec.ts --include=src/app/app.component.spec.ts --include=src/app/components/access-block/access-block.component.spec.ts --include=src/app/components/navbar/navbar.component.spec.ts` | **PASS** — `TOTAL: 28 SUCCESS`; Auth/access mappings, blocker, approved shell, route/revocation, label, and UID copy/fallback paths |
| Package | `npm run package` | **PASS** — Electron Forge 7.8.1 / Packager 18.3.6 under the temporary pinned Node 22.14.0 runtime; `out/inventario-linux-x64` created successfully |
| Packaged `file://` launch and Auth | `DISPLAY=:0 LIBGL_ALWAYS_SOFTWARE=1 LD_LIBRARY_PATH=/tmp/opencode/control-inventario-pr5-runtime/libs/usr/lib/x86_64-linux-gnu out/inventario-linux-x64/inventario --no-sandbox --disable-gpu --use-angle=swiftshader --ozone-platform=x11 --user-data-dir=<isolated-profile>` | **BLOCKED** — the real page loaded at `file:///home/juanka/dev/Control_Inventario/out/inventario-linux-x64/resources/app.asar/dist/inventario/browser/`, but `POST https://identitytoolkit.googleapis.com/v1/accounts:signUp` returned HTTP 400 `CONFIGURATION_NOT_FOUND`; the UI correctly remained fail-closed at `Estado: Acceso no disponible` with no UID |

The required packaged runtime scenarios were not completed because the configured Firebase Auth project did not issue an anonymous UID:

- **Same-profile `file://` restart twice:** N/A — the packaged executable and page loaded, but the first anonymous sign-in returned `CONFIGURATION_NOT_FOUND`, so there was no UID to compare across restarts.
- **Profile removal/reinstall:** N/A — no first-launch UID was issued, so no new UID or approval-not-restored observation could be measured.
- **Substitute harness:** intentionally not used. An unpackaged browser, unit mock, or profile-file inference would not prove the required packaged runtime behavior.

The actionable diagnosis is to provide an authorized Firebase project/web configuration for `inventario-9863a` with a valid Identity Toolkit configuration and Anonymous Auth enabled, then rerun both isolated-profile scenarios. The package itself is now reproducible with the pinned Electron artifact. Do not work around this gate by changing application configuration, adding dependencies, copying credentials, deploying, or treating the fail-closed screen as UID persistence proof.

## PR5 release evidence — generation 8 after external Auth fix — 2026-08-30 (UTC)

This is the current candidate evidence. The only external change was maintainer initialization of Firebase Authentication and enabling Anonymous Auth in `inventario-9863a`. No Console mutation, deployment, approval, token inspection, direct REST sign-up, credential access, dependency change, commit, or push was performed here.

| Check | Exact command/log | Result |
|---|---|---|
| Full Angular tests (`F`) | `CHROME_BIN=/snap/bin/chromium npm test` — `/tmp/opencode/control-inventario-pr5-runtime/full-angular.log` | **PASS** — 77/77; predecessor evidence reused |
| Firestore rules (`R`) | `JAVA_HOME=/tmp/opencode/control-inventario-pr5-runtime/java PATH=/tmp/opencode/control-inventario-pr5-runtime/java/bin:$PATH npm run test:rules` — `/tmp/opencode/control-inventario-pr5-runtime/firestore-rules.log` | **PASS** — 10/10; predecessor evidence reused |
| Typecheck | `npx tsc -p tsconfig.app.json --noEmit` — `/tmp/opencode/control-inventario-pr5-runtime/typecheck.log` | **PASS** — exit 0; predecessor evidence reused |
| Production Angular build | `npm run build` under temporary Node 22.14.0/npm 10.9.2 — `/tmp/opencode/control-inventario-pr5-runtime/generation8-build-production.log` | **PASS** — hashed `main-NSOBHBYG.js`; production bundle generated |
| Development-build comparison | `npm run build -- --configuration development` — `/tmp/opencode/control-inventario-pr5-runtime/build-development.log` | **PASS** — predecessor evidence reused; package was made only after the new production build |
| Credential filename inspection | filename-only candidate scan — `/tmp/opencode/control-inventario-pr5-runtime/credential-paths.log` | **PASS** — 70 candidate paths, 0 denied credential matches; no credential file opened |
| Electron package | `npm run package` under temporary Node 22.14.0/npm 10.9.2 — `/tmp/opencode/control-inventario-pr5-runtime/generation8-package.log` | **PASS** — `out/inventario-linux-x64` created |
| Packaged production-byte proof | `generation8-package-validation.mjs` — `/tmp/opencode/control-inventario-pr5-runtime/generation8-package-validation.log` | **PASS** — packaged `main-NSOBHBYG.js` matches production `main-NSOBHBYG.js`; development marker absent; archive SHA-256 `8ca37839fb65b62a39a21da8b5046dc41fa3b9b53c64372874eb4dd751a0b22e` |
| Packaged Auth/access/gate | `generation8-auth-harness.mjs` against the real packaged `file://` executable — `/tmp/opencode/control-inventario-pr5-runtime/generation8-harness.log`, `/tmp/opencode/control-inventario-pr5-runtime/generation8-auth-evidence-concise.json` | **PASS** — initial and same-profile restart issued the same UID hash `sha256:4cffbcb50bf4012914d6b33ab920987682c4d3ed5817fe3335ddca10b501b033`; fresh profile issued different UID hash `sha256:8eee17b96bcd22d4d760119515234b9617a79c0f112ca3cb124e6f5de6c17c98`; all three showed `Estado: Pendiente de aprobación`, blocker present, navbar/outlet absent |

The harness waited for the real packaged page and closed each Electron session cleanly. It deleted only `generation8-profile` after capture; no prior diagnostic profile was reused or changed. All three process exits were code 0, all URLs were packaged `file://` URLs, and no UID was approved. The profile-removal run therefore proves identity loss creates a different pending UID and preserves the fail-closed gate. The archived evidence contains only stable UID hashes and lengths, never raw UIDs, tokens, or credentials.

### Current Auth → access → shell → rules conclusion

The repaired packaged client now completes Auth and issues installation identity. The access listener resolves the absent own-record as pending, the shell keeps inventory routes out of the DOM (`blocker=true`, `navbar=false`, `outlet=false`), and the independent Firestore emulator evidence remains 10/10. Task 5.2 is complete for local release verification only; legacy snapshot capture, staging, Console audit/recreation, final activation, and deployment remain manual operator gates.

Deterministic evidence revision: `sha256:bab7904e23bed3a556f09cc97efd655e461ec1f183de5288b5d74cf444b95992` from `/tmp/opencode/control-inventario-pr5-runtime/generation8-evidence-manifest.txt` and `/tmp/opencode/control-inventario-pr5-runtime/generation8-evidence-revision.log`. Final worktree cleanup and process proof are recorded in `/tmp/opencode/control-inventario-pr5-runtime/generation8-cleanup.log`; generated `dist/`, `out/`, and the isolated generation8 profile are absent.

## Rollback

Rollback is manual and snapshot-driven:

1. Stop the gated-client rollout and record the failing verification.
2. First restore the last known safe staging rules snapshot and the prior client gate. This keeps inventory blocked while preserving authenticated own-record reads and denying all client allowlist writes.
3. If a full legacy rollback is explicitly approved, manually restore the exact legacy snapshot and prior client only as an acknowledged **weaker, unverified posture**. Do not restore deleted unverified records or treat them as approvals.
4. Keep separately audited Console-created records; do not trust them under staging until the final rules and UID review are complete.
5. Re-run the emulator, client, and packaged-profile checks before another activation attempt. There is no automatic rollback or automatic production deployment.

## Prohibited actions

- Do not deploy rules or mutate Firebase Console as part of this PR or from an application/build hook.
- Do not enable inventory access by weakening staging, adding a wildcard allow, or using a stale/legacy record as proof of approval.
- Do not let the client list or write `deviceAccess`, approve itself, restore tokens, or promise offline access.
- Do not copy, read, commit, package, or log service-account, Admin, signing, private-key, or other privileged credential material.
- Do not treat a successful Angular test, local build, or unpackaged browser run as proof of the packaged UID persistence/reinstall scenarios.
- Do not delete allowlist records before the reviewed audit snapshot exists, and do not claim deleted unverified records can be restored.
