# Tasks: Firebase Device Access Control

## Review Workload Forecast

Forecast: 750–1,050 additions/deletions; 26 files; High; five units; ask-on-risk; stacked-to-main; resolved.

Maintainer: split approved; size:exception rejected; decision resolved.

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

Scope: product CRUD/quantity/delete; movement read/create; deny movement updates/deletes; no human login/admin/backend/App Check/offline/environment/audit/cascade.

### Work Units

`R`=`firebase emulators:exec --only firestore "node --test tests/firestore.rules.test.mjs"`; `npm run test:rules`. `K`=`CHROME_BIN=/snap/bin/chromium npm test -- --include=<spec-path>`; `F`=`CHROME_BIN=/snap/bin/chromium npm test`.

|Unit|Goal/PR|Focused|Harness|Rollback|Base (branch/target)|
|---|---|---|---|---|---|
|1|Rules/PR1|`R`|emulator + `node:test`|rules/tests/config/package|current main|
|2|Auth/PR2|`K` service|Karma/TestBed Auth→access|interface/service|main after PR1 merge|
|3|Shell/navbar/PR3|`K` shell/navbar|Karma/TestBed gate/revocation/copy|blocker/app/navbar|main after PR2 merge|
|4|Date/teardown/PR4|`K` inventory|Karma/TestBed calendar/destroy|inventory components|main after PR3 merge|
|5|Runbook/release/PR5|`F`,`R`,type-check,build|`npm run package`; packaged `file://` restart twice, profile removal/reinstall|docs/evidence; no deployment|main after PR4 merge|

Stacked-to-main: PR1 targets current `main`; each next PR branches from and targets updated `main` after the prior merge. Order: 1→2→3→4→5.

## Phase 1: Foundation and Firestore Policy

- [ ] 1.1 Add Auth/emulator dependencies, `test:rules`, and config in `package.json`, `package-lock.json`, `firebase.json`, `src/app/app.config.ts`.
- [ ] 1.2 RED: create `tests/firestore.rules.test.mjs` for all 11: approved; untrusted; record mutation; reinstall; product workflow; movement read/create; alteration; valid/invalid documents; legacy read; policy/credential verification.
- [ ] 1.3 GREEN: create `firestore.rules` for UID allowlist/default deny, product CRUD/validation/transactions, immutable movements, legacy reads, and unknown paths.
- [ ] 1.4 REFACTOR: minimize rule reads; pass `R`.

## Phase 2: Anonymous Identity State

- [ ] 2.1 RED: test `src/app/service/installation-access.service.spec.ts` for first launch, restart, reinstall, pending, revoked, approved, unavailable, manual approval/revocation, self-approval, initial rollout, approval-not-restored, and teardown.
- [ ] 2.2 GREEN: create `src/app/interface/installation-access.ts` and `src/app/service/installation-access.service.ts` for silent Auth, own-record listening, fail-closed mapping, and teardown.
- [ ] 2.3 REFACTOR: keep `AccessState` read-only/discriminated; expose no token restoration or self-approval path.

## Phase 3: Shell and Approved Identity UI

- [ ] 3.1 RED: extend `src/app/app.component.spec.ts` and `src/app/components/navbar/navbar.component.spec.ts`; create `src/app/components/access-block/access-block.component.spec.ts`; cover Block non-approved access, Permit approved access, Existing approved route, revocation, approved label/“Approved”/UID reveal-copy, and fallback.
- [ ] 3.2 GREEN: create `src/app/components/access-block/access-block.component.ts`, `src/app/components/access-block/access-block.component.html`, `src/app/components/access-block/access-block.component.css`; modify `src/app/app.component.ts`, `src/app/app.component.html`, `src/app/components/navbar/navbar.component.ts`, `src/app/components/navbar/navbar.component.html` to gate loading.
- [ ] 3.3 REFACTOR: verify revocation teardown and approved navigation.

## Phase 4: Inventory Compatibility and Teardown

- [ ] 4.1 RED: extend `src/app/components/listar/listar.component.spec.ts` for empty/malformed/nonexistent dates, “Select a valid date” plus toast, skipped adjustment, and local-day preservation; test `src/app/components/movimientos-producto/movimientos-producto.component.spec.ts` destroy teardown.
- [ ] 4.2 GREEN: modify `src/app/components/listar/listar.component.ts`, `src/app/components/listar/listar.component.html`, `src/app/components/movimientos-producto/movimientos-producto.component.ts` for canonical validation and listener teardown.
- [ ] 4.3 REFACTOR: preserve transactional adjustment, legacy movement display, and approved routes.

## Phase 5: Operations and Verification

- [ ] 5.1 Create `docs/firebase-device-access.md`; modify `README.md` with limitations/secrets and document-only staged rollout: unverified legacy rules text/hash/date; staging denies inventory, permits own-record reads, denies allowlist writes; collect UIDs; Console audit/cleanup/recreation; final activation; rollback snapshots; no automatic production deployment.
- [ ] 5.2 Run `F`, `R`, type-check, build, credential inspection, and packaged UID persistence/reinstall; verify Auth→access→gate→rules; record evidence without deploying.
