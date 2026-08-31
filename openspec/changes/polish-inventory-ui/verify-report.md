```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:b53e9c2a8a4fb45d31109afa67458b0c3eb1dcb76d192123bc31c077f7940309
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 4/4
scenarios: 13/13
test_command: env CHROME_BIN=/snap/bin/chromium npm test
test_exit_code: 0
test_output_hash: sha256:8dfed9f168ba3a15b69fef32a6dee52d51de8d74b10fe6fe97319a80d193907c
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:90e9e2b06df08fcf7f47d63b58b807a746803894ff0dfa7f3ac67d70e5a0308f
```

## Verification Report

**Change**: `polish-inventory-ui`  
**Version**: N/A  
**Mode**: Strict TDD  
**Artifact store**: Hybrid (OpenSpec + Engram)  
**Verification scope**: Independent final verification of the proposal, both specifications, design, completed tasks, apply evidence, affected implementation/tests, protected workspace boundaries, and fresh runtime commands. Verification did not modify application source, tests, configuration, package manifests, Firebase state, or native runtime-attempt state.

### Artifact and Count Basis

| Artifact | Source | Result |
|---|---|---|
| Proposal | OpenSpec `openspec/changes/polish-inventory-ui/proposal.md` | Read |
| Specifications | OpenSpec `specs/device-access-control/spec.md` and `specs/inventory-ui-presentation/spec.md` | Read; **4 requirements and 13 scenarios** counted from the files |
| Design | OpenSpec `design.md` | Read |
| Tasks | OpenSpec `tasks.md` | Read; **9/9 tasks checked** |
| Apply progress | Engram `sdd/polish-inventory-ui/apply-progress` (observation #500) | Read; TDD Cycle Evidence and native Windows manual evidence present |
| Native attempt | `gentle-ai sdd-attempt status` | Read; ordinal 3 remains active at the parent-owned revision |
| Native SDD status | `gentle-ai sdd-status polish-inventory-ui --json --instructions` | Read; all tasks complete; status blocked only by the active parent-owned runtime attempt |

### Completeness

| Metric | Value |
|---|---:|
| Tasks total | 9 |
| Tasks complete | 9 |
| Tasks incomplete | 0 |
| Requirements | 4/4 |
| Scenarios | 13/13 |
| Authored application/test diff | 347 additions + deletions across the 11 intended application/test files |
| Review budget | 347/400 authored changed lines; within the approved limit |
| Protected local edits | `angular.json` and `package-lock.json` excluded from the candidate and unchanged |

### Build & Tests Execution

**Focused Unit A tests**: ✅ Passed — 11 passed, 0 failed, 0 skipped.

```text
Command: env CHROME_BIN=/snap/bin/chromium npm test -- --include=src/app/components/navbar/navbar.component.spec.ts --include=src/app/components/access-block/access-block.component.spec.ts
Exit code: 0
Output hash: sha256:e29904cf6eb3168fa581d03bae8a14a702110390aba2ebd0f80e3857ed490913
Result: TOTAL: 11 SUCCESS
```

**Focused Unit B tests**: ✅ Passed — 14 passed, 0 failed, 0 skipped.

```text
Command: env CHROME_BIN=/snap/bin/chromium npm test -- --include=src/app/components/movimientos-producto/movimientos-producto.component.spec.ts
Exit code: 0
Output hash: sha256:5edc5071be68816bd3b2fd5570fd2a8a22c030e410589400caaa9de29bd1a3e1
Result: TOTAL: 14 SUCCESS
```

**Full Angular/Karma tests**: ✅ Passed — 81 passed, 0 failed, 0 skipped.

```text
Command: env CHROME_BIN=/snap/bin/chromium npm test
Exit code: 0
Output hash: sha256:8dfed9f168ba3a15b69fef32a6dee52d51de8d74b10fe6fe97319a80d193907c
Result: TOTAL: 81 SUCCESS
```

The full output contains expected `ERROR` diagnostics from deliberate negative-path tests in the existing `agregar` suite; the Karma process completed with 81/81 success and exit 0.

**Type checker**: ✅ Passed — no output.

```text
Command: npx tsc -p tsconfig.app.json --noEmit
Exit code: 0
Output hash: sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

**Production build**: ✅ Passed — application bundle generation completed with exit 0.

```text
Command: npm run build
Exit code: 0
Output hash: sha256:90e9e2b06df08fcf7f47d63b58b807a746803894ff0dfa7f3ac67d70e5a0308f
Warnings: initial bundle 848.80 kB exceeded the 500 kB warning budget; sweetalert2 was reported as CommonJS.
```

**Coverage**: ✅ Collected with the available `karma-coverage` tool; configured threshold is 0.

```text
Command: env CHROME_BIN=/snap/bin/chromium npm test -- --code-coverage
Exit code: 0
Output hash: sha256:ce238e5f556244e66b9b00a0debcbf0ce26c9094e94c56143a3b4e34d4f87e8b
CLI-wide summary: 81.08% statements (360/444), 73.68% branches (126/171), 81.96% functions (100/122), 82.58% lines (351/425)
```

**Whitespace checks**: ✅ Passed — both the working-tree and candidate diffs are clean.

```text
Command: git diff --check
Exit code: 0
Output hash: sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855

Command: git diff --check 4702a11..HEAD
Exit code: 0
Output hash: sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

### Spec Compliance Matrix

| Requirement | Scenario | Covering runtime/static evidence | Result |
|---|---|---|---|
| Explicit Access States | Pending installation | `access-block.component.spec.ts > uses exact Spanish status labels for every access state`; `keeps identity private and offers copy only for handoff states`; app gate test; fresh focused/full suites | ✅ COMPLIANT |
| Explicit Access States | Revoked installation | `access-block.component.spec.ts > uses exact Spanish status labels for every access state`; `keeps identity private and offers copy only for handoff states`; fresh focused/full suites | ✅ COMPLIANT |
| Explicit Access States | Approved installation | `navbar.component.spec.ts > separates the approved identity label, status, and copy action without exposing the UID`; app approved-route test; maintainer Windows visual validation `Todo correcto` for desktop and below 640px | ✅ COMPLIANT |
| Explicit Access States | Authorization unavailable | Access-block unavailable-state and copy-eligibility assertions; app gate test verifies non-approved shell remains blocked; fresh full suite | ✅ COMPLIANT |
| Explicit Access States | Clipboard copy succeeds | Navbar and access-block success tests assert the Clipboard API argument, exact Spanish live message, status role/live region, and hidden UID | ✅ COMPLIANT |
| Explicit Access States | Clipboard copy fails | Navbar rejection and unavailable-API paths plus access-block rejection path assert exact failure feedback and hidden UID | ✅ COMPLIANT |
| Product Branding | Consistent identity | `navbar.component.spec.ts > uses the exact product brand in the navbar`; `src/index.html:5` has the exact document title; maintainer Windows visual validation `Todo correcto` confirms both at the required widths (manual evidence, not an automated test) | ✅ COMPLIANT |
| Dark Movement Surfaces | Populated movement history | `movimientos-producto.component.spec.ts > keeps populated and empty movement surfaces dark and readable` asserts dark surfaces, table content/scopes, and both badge backgrounds; maintainer visual checklist confirms dark movement surfaces | ✅ COMPLIANT |
| Dark Movement Surfaces | Empty movement history | The same movement presentation test asserts the unchanged empty message and dark readable empty surface; fresh Unit B/full suites | ✅ COMPLIANT |
| Dark Movement Surfaces | Keyboard focus and disabled pagination | `movimientos-producto.component.spec.ts > keeps keyboard focus visible and disabled pagination distinguishable` asserts visible focus, disabled/inoperative state, contrast, and enabled-button focus | ✅ COMPLIANT |
| Dark Movement Surfaces | Narrow viewport | `retains overflow and wrapping contracts for narrow layouts` asserts overflow/wrapping; the maintainer tested below 640px usability and reported exactly `Todo correcto` | ✅ COMPLIANT |
| Presentation-Only Scope | Existing movement workflow | Fresh movement tests cover filtering-before-pagination, page totals/reset, empty-filter state, return link, and teardown; movement TypeScript/HTML, routes, service, and global styles have no candidate diff | ✅ COMPLIANT |
| Presentation-Only Scope | Product movement link | `src/app/components/listar/listar.component.html` contains neither `routerLinkActive` nor `aria-current`; maintainer Windows checklist item 7 reports no persistent active style (manual evidence, no automated covering test) | ✅ COMPLIANT |

**Compliance summary**: 13/13 scenarios have passing fresh automated or explicitly permitted maintainer-manual runtime evidence. Manual evidence is identified as manual and is not represented as an automated test.

### Correctness (Static Evidence)

| Requirement / Boundary | Status | Notes |
|---|---|---|
| Product branding | ✅ Implemented | `src/index.html:5` and the navbar render exactly `Control Inventario`; no alternate product brand remains in the changed UI. |
| Explicit access states and privacy | ✅ Implemented | AccessBlock maps all five `AccessState` variants to the specified Spanish labels, renders labels/instructions, exposes copy only for UID-bearing pending/revoked/unavailable states, and has no UID DOM or reveal fallback. |
| Clipboard feedback | ✅ Implemented | Navbar and AccessBlock use the direct Clipboard API and announce `UID copiado.` or `No se pudo copiar el UID. Intentá nuevamente.` through `role="status"` and `aria-live="polite"`; failures never disclose the UID. |
| Dark movement presentation | ✅ Implemented | Component-local CSS supplies slate surfaces, light text, explicit borders, focus/hover/disabled states, responsive overflow/wrapping preservation, and contrast-safe green/red badges. |
| Presentation-only behavior | ✅ Preserved | Movement markup/logic, filtering, pagination, route definitions, access service, and global styles are unchanged; the product-list movement link has no persistent active directive or `aria-current`. |
| Access and data boundaries | ✅ Preserved | `InstallationAccessService`, `AppComponent` gating, inventory service, Firestore behavior, and routes are outside the candidate implementation diff. |
| Protected workspace | ✅ Preserved | SHA-256 values remain exactly `angular.json=80fe144ee61caf2fe12d5c452e9c5dcc09af7190185f70ecb8029882f0808096` and `package-lock.json=6b851f6f718fff30534ad7aae6702efe8cbe62a591177db23a22df8c7be45154`. |

### Coherence (Design)

| Decision | Followed? | Notes |
|---|---|---|
| Component-local HTML/CSS | ✅ Yes | Branding/access presentation stays in the standalone components; movement palette is local CSS and no global tokens or theme migration were introduced. |
| Copy-only UID actions | ✅ Yes | Both approved and handoff states call the Clipboard API directly; there is no manual reveal or failure disclosure path. |
| Delete reveal behavior | ✅ Yes | `uidVisible`, `revelarUid()`, visible UID code, and manual-copy fallback branches/DOM were removed. |
| Preserve movement DOM and logic | ✅ Yes | The movement component HTML/TypeScript and existing semantic table, filtering, pagination, empty-state, and teardown behavior remain unchanged; only the component CSS and focused spec were extended. |
| Preserve authorization/gating | ✅ Yes | The access service and root shell gate are unchanged, so presentation work cannot approve or bypass an installation. |

### Task Verification

| Task | Evidence | Result |
|---|---|---|
| 1.1 | Navbar RED contract exists in `navbar.component.spec.ts`, including exact branding, identity hierarchy, privacy, copy outcomes, live feedback, and menu hooks/state. | ✅ |
| 1.2 | AccessBlock RED contract exists in `access-block.component.spec.ts`, including exact states, conditional copy, privacy, and accessible outcomes. | ✅ |
| 2.1 | `src/index.html` and navbar HTML/TypeScript/CSS implement exact branding, responsive identity groups, direct copy, and live feedback while preserving the menu. | ✅ |
| 2.2 | AccessBlock HTML/TypeScript/CSS implement exact Spanish states and copy-only handoff without changing the access service or gate. | ✅ |
| 3.1 | Movement presentation contract tests exist; movement table scopes and hooks remain; `listar.component.html` has neither `routerLinkActive` nor `aria-current`. | ✅ |
| 4.1 | Movement component CSS supplies the approved dark surfaces, borders, text, interaction states, and badge distinctions without changing movement DOM or logic. | ✅ |
| 5.1 | Fresh focused suites passed 11/11 and 14/14; fresh full suite passed 81/81; typecheck, build, coverage, and diff checks passed. | ✅ |
| 5.2 | Maintainer-provided native Windows Electron validation covered desktop and below-640px widths and reported exactly `Todo correcto`; no WSLg claim is used. | ✅ |
| 5.3 | Protected file hashes match the required values; no Firebase deployment or mutation occurred. | ✅ |

### TDD Compliance

| Check | Result | Details |
|---|---|---|
| TDD Evidence reported | ✅ | Engram apply progress #500 contains the required TDD Cycle Evidence table. |
| All task rows have evidence anchors | ✅ | All 9 task rows have implementation, test, runtime, or protected-boundary evidence; the manual-only 5.2 row is correctly marked N/A for a test file. |
| RED confirmed (test files exist) | ⚠️ | All 6 code-bearing TDD rows point to existing test files, but the RED cells use descriptive `Written; ...` text rather than the prescribed literal `✅ Written`. |
| GREEN confirmed (tests pass) | ✅ | Fresh Unit A and Unit B runs pass 11/11 and 14/14, corroborating all 6 code-bearing GREEN rows. |
| Triangulation adequate | ✅ | The recorded state, copy, surface, interaction, workflow, and teardown cases exist with the claimed variance; manual 5.2 is intentionally not triangulated by a test file. |
| Safety Net for modified files | ✅ | The apply artifact records numeric 10/10 or 11/11 safety-net runs for each modified code/test file; manual-only 5.2 is correctly N/A. |

**TDD Compliance**: 5/6 checks fully canonical; runtime RED/GREEN evidence is present and current.

### Test Layer Distribution

| Layer | Tests | Files | Tools / evidence |
|---|---:|---:|---|
| Unit/component | 25 | 3 modified spec files | Karma, Jasmine, Angular TestBed |
| Integration | 0 | 0 | Not available; no integration harness detected |
| E2E | 0 | 0 | Not available; no Playwright, Cypress, Selenium, or equivalent harness detected |
| Manual visual runtime | 7 checklist items | `tasks.md` + Engram apply progress #500 | Maintainer-provided native Windows Electron evidence; result `Todo correcto`, not automated |
| **Automated total** | **25** | **3** | |

The project configuration declares only the Unit layer for this change. No related test uses an unavailable integration or E2E tool.

### Changed File Coverage

| File | Line % | Branch % | Uncovered lines | Rating |
|---|---:|---:|---|---|
| `src/app/components/navbar/navbar.component.ts` | 100% (13/13) | 50% (1/2) | —; untested non-approved early-return branch at L22 | ✅ Excellent |
| `src/app/components/access-block/access-block.component.ts` | 93.75% (15/16) | 80% (8/10) | L40, L44 | ✅ Excellent |
| `src/app/components/movimientos-producto/movimientos-producto.component.ts` | 87.5% (42/48) | 78.94% (15/19) | L82-L83, L114-L115, L132-L133 | ✅ Acceptable |
| `src/index.html` | N/A | N/A | Static HTML is not emitted as Istanbul executable coverage | N/A |
| `src/app/components/navbar/navbar.component.html` | N/A | N/A | Angular template source is not emitted as a separate comparable coverage file | N/A |
| `src/app/components/navbar/navbar.component.css` | N/A | N/A | CSS is not executable coverage content | N/A |
| `src/app/components/access-block/access-block.component.html` | N/A | N/A | Angular template source is not emitted as a separate comparable coverage file | N/A |
| `src/app/components/access-block/access-block.component.css` | N/A | N/A | CSS is not executable coverage content | N/A |
| `src/app/components/movimientos-producto/movimientos-producto.component.css` | N/A | N/A | CSS is not executable coverage content | N/A |
| `src/app/components/navbar/navbar.component.spec.ts` | N/A | N/A | Test source is not a production coverage target | N/A |
| `src/app/components/access-block/access-block.component.spec.ts` | N/A | N/A | Test source is not a production coverage target | N/A |
| `src/app/components/movimientos-producto/movimientos-producto.component.spec.ts` | N/A | N/A | Test source is not a production coverage target | N/A |

**Average changed-file line coverage**: 93.75% arithmetic average across the 3 instrumented production TypeScript files (70/77 lines, 90.91% weighted). No instrumented changed file is below the 80% line-coverage warning threshold; coverage remains informational because the configured threshold is 0.

### Assertion Quality

| File | Line | Assertion | Issue | Severity |
|---|---:|---|---|---|
| `src/app/components/navbar/navbar.component.spec.ts` | 42 | `expect(component).toBeTruthy()` | Instantiation smoke/type assertion only; it does not verify behavior or count toward scenario coverage. | WARNING |
| `src/app/components/movimientos-producto/movimientos-producto.component.spec.ts` | 41 | `expect(component).toBeTruthy()` | Instantiation smoke/type assertion only; it does not verify behavior or count toward scenario coverage. | WARNING |

No tautologies, orphan empty-collection assertions, ghost loops, assertion-free production paths, or mock-heavy test-file violations were found. The movement empty-result assertion has companion non-empty assertions, and all loops iterate fixed non-empty case arrays.

**Assertion quality**: 0 CRITICAL, 2 WARNING.

### Quality Metrics

**Linter**: ➖ Not available — project capabilities declare no linter configuration or runner.  
**Formatter**: ➖ Not available — project capabilities declare no formatter configuration or runner.  
**Type Checker**: ✅ No errors — `npx tsc -p tsconfig.app.json --noEmit` exited 0.  
**Build**: ✅ No errors — `npm run build` exited 0 with the non-blocking warnings recorded above.

### Runtime Attempt, Scope, Cleanup, and Process Evidence

| Evidence | Result |
|---|---|
| Runtime attempt | Objective generation 3, ordinal 3, work unit `independent-sdd-verification`; attempt remains `running` at revision `sha256:670fe9e5c37add343ff6ebf256deef883dbf8cf05c93913b03e45de62ee5c6e2`. Verification issued no `begin`, `finish`, or `reset`. |
| Candidate identity/tree | Begin identity `sha256:41dd3a8b999e317b9d393a72f7d6803a1cbe74d32aed14d041f3d1a78a9f564d`; begin tree `67bcb353cdf7ba35827276de909c4ecc71310160`. |
| Scope before persistence | Git status contained only the protected `angular.json` and `package-lock.json` edits; snapshot hash `sha256:7f6ceffc819e6fa31bc4577d9433ee63110d6a475e708273c3eeaa7fda92dab2`. |
| Candidate scope | Application/test diff from `4702a11..HEAD` is limited to the intended 11 files; candidate diff-name hash `sha256:ecdfac1735f799f32aa924c746206616cd48288a48134903ee6d8ce88de3425a`. |
| Scope after runtime | Post-run Git status still contained only the two protected edits; worktree diff-name hash `sha256:fb9cf3f7a1e7fe2f0a577eaae9505a2d576d63a46a936c621f94b6af54f8a4fe`; protected hashes remained exact. |
| Cleanup | All focused/full test, coverage, typecheck, build, and diff-check processes exited. Ignored generated `.angular/cache`, `coverage`, and `dist` outputs were not included in the candidate; no repository temporary files were created before this report. |
| Process evidence | No `ng`, Karma, Chrome/Chromium, or Electron test processes remained in the final process snapshot; snapshot hash `sha256:01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b`. |
| Boundary protection | No application/test/config/package file changed during verification; no Firebase deployment or mutation occurred; RDD/Judgment-Day/review was not started. |
| CodeGraph | MCP query reported no usable index despite the local `.codegraph` directory; verification fell back to targeted Read/Grep inspection and did not initialize or mutate CodeGraph. |

### Canonical Verification Evidence

The following exact preimage is hashed as `evidence_revision` in the leading envelope. It is preserved outside the repository at `/tmp/opencode/polish-inventory-ui-verify-g3-canonical-evidence-preimage.txt` until the parent consumes it.

```text
schema=gentle-ai.verify-evidence/v1
change=polish-inventory-ui
mode=strict-tdd
objective_generation=3
attempt_ordinal=3
runtime_revision=sha256:670fe9e5c37add343ff6ebf256deef883dbf8cf05c93913b03e45de62ee5c6e2
objective_id=sha256:36385f938149cb066f33f49e3a66f96a43c276a82801e4aa8434db4f72e9f7e5
candidate_identity=sha256:41dd3a8b999e317b9d393a72f7d6803a1cbe74d32aed14d041f3d1a78a9f564d
candidate_tree=67bcb353cdf7ba35827276de909c4ecc71310160
authored_application_test_diff_lines=347
review_budget=347/400
protected_angular_json_sha256=sha256:80fe144ee61caf2fe12d5c452e9c5dcc09af7190185f70ecb8029882f0808096
protected_package_lock_sha256=sha256:6b851f6f718fff30534ad7aae6702efe8cbe62a591177db23a22df8c7be45154
worktree_status_sha256=sha256:7f6ceffc819e6fa31bc4577d9433ee63110d6a475e708273c3eeaa7fda92dab2
worktree_diff_names_sha256=sha256:fb9cf3f7a1e7fe2f0a577eaae9505a2d576d63a46a936c621f94b6af54f8a4fe
candidate_diff_names_sha256=sha256:ecdfac1735f799f32aa924c746206616cd48288a48134903ee6d8ce88de3425a
focused_unit_a_command=env CHROME_BIN=/snap/bin/chromium npm test -- --include=src/app/components/navbar/navbar.component.spec.ts --include=src/app/components/access-block/access-block.component.spec.ts
focused_unit_a_exit_code=0
focused_unit_a_output_sha256=sha256:e29904cf6eb3168fa581d03bae8a14a702110390aba2ebd0f80e3857ed490913
focused_unit_b_command=env CHROME_BIN=/snap/bin/chromium npm test -- --include=src/app/components/movimientos-producto/movimientos-producto.component.spec.ts
focused_unit_b_exit_code=0
focused_unit_b_output_sha256=sha256:5edc5071be68816bd3b2fd5570fd2a8a22c030e410589400caaa9de29bd1a3e1
full_test_command=env CHROME_BIN=/snap/bin/chromium npm test
full_test_exit_code=0
full_test_output_sha256=sha256:8dfed9f168ba3a15b69fef32a6dee52d51de8d74b10fe6fe97319a80d193907c
coverage_command=env CHROME_BIN=/snap/bin/chromium npm test -- --code-coverage
coverage_exit_code=0
coverage_output_sha256=sha256:ce238e5f556244e66b9b00a0debcbf0ce26c9094e94c56143a3b4e34d4f87e8b
typecheck_command=npx tsc -p tsconfig.app.json --noEmit
typecheck_exit_code=0
typecheck_output_sha256=sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
build_command=npm run build
build_exit_code=0
build_output_sha256=sha256:90e9e2b06df08fcf7f47d63b58b807a746803894ff0dfa7f3ac67d70e5a0308f
working_tree_diff_check_command=git diff --check
working_tree_diff_check_exit_code=0
working_tree_diff_check_output_sha256=sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
candidate_diff_check_command=git diff --check 4702a11..HEAD
candidate_diff_check_exit_code=0
candidate_diff_check_output_sha256=sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
requirements=4/4
scenarios=13/13
tasks=9/9
manual_windows_scope=desktop and below-640px
manual_windows_result=Todo correcto
runtime_process_snapshot=none
application_and_test_files_changed_during_verification=false
protected_workspace_files_changed_during_verification=false
firebase_deployment_or_mutation=false
rdd_or_review_started=false
attempt_begin_finish_reset_called_by_verification=false
```

### Issues Found

**CRITICAL**: None.

**WARNING**:
- Strict TDD apply evidence records descriptive RED cells (`Written; ...`) rather than the prescribed literal `✅ Written`; current test files exist and fresh GREEN execution passes.
- The production build reports the non-blocking initial-bundle budget and SweetAlert2 CommonJS warnings.
- Branch coverage is below 80% for the changed navbar (50%) and movement component (78.94%); line coverage is acceptable and the configured threshold is 0.
- The modified navbar and movement specs retain creation-only `toBeTruthy()` smoke assertions at lines 42 and 41; they add no behavioral proof.
- The document-title and product-movement-link checks have no dedicated automated assertions; current evidence is static inspection plus the explicitly permitted maintainer manual validation, recorded without claiming automation.

**SUGGESTION**:
- Add focused DOM assertions for the document title and per-product `Movimientos` link when those suites are next expanded, and cover the currently untested non-scenario branches if they become release-critical.

### Verdict

**PASS WITH WARNINGS**

All 4 requirements, 13 scenarios, and 9 tasks are supported by fresh automated evidence, source inspection, or the explicitly recorded native Windows manual validation. The implementation follows the approved design, all required commands passed, and the only findings are non-blocking build/coverage signals, canonical TDD bookkeeping, and test-quality improvements.
