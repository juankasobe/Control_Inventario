```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:7796990b734837989742158491c6bd5c4eebb4528467c642346dbe7297b33e4f
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 11/11
scenarios: 25/25
test_command: CHROME_BIN=/snap/bin/chromium npm test
test_exit_code: 0
test_output_hash: sha256:175fe1b93c8d1b31d026e12c7e36792e36e6573e5a623070cdc96a59d8d679c8
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:349680fea506bb5d8517df8064eca2f6ac0aa3079e276b46904562246581a306
```

## Verification Report

**Change**: `control-seguridad-firebase`
**Version**: N/A
**Mode**: Strict TDD
**Artifact store**: Hybrid OpenSpec + Engram
**Scope**: Independent final verification; no source, deployment, Console, credential, native-attempt, or process-integration changes.

### Completeness

| Metric | Result |
|---|---:|
| Tasks total / complete / incomplete | 15 / 15 / 0 |
| Requirements | 11 / 11 |
| Scenarios | 25 / 25 |
| Candidate implementation diff before this report | 199 / 400 lines |

### Build, tests, coverage, and cleanup

| Check | Result | Evidence |
|---|---|---|
| Full Angular/Karma suite | ✅ 77/77, 0 failed, 0 skipped | `verify-generation9-full-angular.log`; exit 0; hash `sha256:175fe1b93c8d1b31d026e12c7e36792e36e6573e5a623070cdc96a59d8d679c8` |
| Firestore emulator rules | ✅ 10/10, 0 failed | `verify-generation9-firestore-rules.log`; Java 17 override; exit 0; hash `sha256:ee044d534a02827add11e2afe1fc7acf829946ad6c3b95e16d90b4a73ad9161e` |
| Typecheck | ✅ exit 0, no output | `verify-generation9-typecheck.log`; hash `sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| Production build | ✅ exit 0 | `verify-generation9-build.log`; hash `sha256:349680fea506bb5d8517df8064eca2f6ac0aa3079e276b46904562246581a306` |
| Git whitespace check | ✅ exit 0, no output | `verify-generation9-diff-check.log`; hash `sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| Coverage | ✅ collected; threshold 0 | `verify-generation9-coverage.log`; 80.4% statements, 72.72% branches, 81.96% functions, 81.88% lines; exit 0 |
| Cleanup | ✅ complete | `verify-generation9-cleanup.log`; generated `dist`, `out`, `coverage`, `.angular/cache`, profiles absent; named test/runtime PIDs absent |

The Angular and rules logs contain expected deliberate error/permission-denied diagnostics from negative-path tests; both suites completed successfully. The production build retains existing initial-bundle-budget, SweetAlert2 CommonJS, and Node `module.register()` deprecation warnings.

### Task verification

| Task | Actual implementation/evidence | Result |
|---|---|---|
| 1.1 | `package.json`/lockfile include Firebase and rules tooling; `test:rules`, emulator config, and Firebase/Auth/Firestore providers are present. | ✅ |
| 1.2 | `tests/firestore.rules.test.mjs` contains executable approved, untrusted, allowlist, reinstall, product, movement, validation, legacy, default-deny, and credential checks; fresh emulator run passed 10/10. | ✅ |
| 1.3 | `firestore.rules` has default deny, own-record get only, approved product permissions, immutable movements, and schema/range helpers. | ✅ |
| 1.4 | `isApproved()` performs one access-record `get()` and rules tests pass without a second authorization lookup. | ✅ |
| 2.1 | `installation-access.service.spec.ts` has 12 executable lifecycle/state/teardown cases; full Angular run passed. | ✅ |
| 2.2 | `InstallationAccessService` performs silent Auth, own-UID observation, malformed/error fail-closed mapping, and destroy-scoped teardown. | ✅ |
| 2.3 | `AccessState` is exposed as a read-only `Signal`; approval/token-restoration members are absent and tested. | ✅ |
| 3.1 | App, blocker, and navbar specs cover all blocked states, approved route, revocation, label/status, UID reveal/copy, and fallback; full run passed. | ✅ |
| 3.2 | `AppComponent` conditionally instantiates navbar/outlet only for approved state; blocker and approved identity UI are implemented. | ✅ |
| 3.3 | Live revocation test proves blocker replaces the outlet and active route content while approved navigation is retained. | ✅ |
| 4.1 | Listar specs execute empty, malformed, nonexistent, inline/toast, skipped-adjustment, local-day, leap-day, and movement-teardown cases. | ✅ |
| 4.2 | `parseFechaLocal()` enforces canonical calendar dates/local construction; movement subscription uses `takeUntilDestroyed`. | ✅ |
| 4.3 | Inventory service approvals cover transactional stock/audit writes and canonical/legacy movement mapping; route paths remain unchanged. | ✅ |
| 5.1 | README and the 188-line runbook document staged rollout, unverified legacy state, secrets boundary, UID collection, Console cleanup/recreation, activation, rollback, and prohibited automation. | ✅ |
| 5.2 | Preserved package manifest/validation and concise packaged evidence pass independent validation; fresh F/R/typecheck/build/diff checks pass; no new users were created. | ✅ |

### Spec compliance matrix

| Requirement | Scenarios counted from spec | Covering runtime evidence | Result |
|---|---|---|---|
| Silent Installation Identity | 3: first launch; ordinary restart; reinstall/local-state loss | Service lifecycle tests plus preserved packaged `file://` evidence | ✅ COMPLIANT |
| Explicit Access States | 4: pending; revoked; approved; unavailable | Service and blocker specs; full Angular run | ✅ COMPLIANT |
| Inventory Gate | 2: block non-approved; permit approved | App shell/gate and route tests; full Angular run | ✅ COMPLIANT |
| Administrator-Controlled Lifecycle | 3: manual change; self-approval refusal; initial rollout | Service state transitions, no approval API, emulator write denial | ✅ COMPLIANT |
| Fail-Closed Compatibility | 2: approval not restored; existing approved route | Service failure tests and route-preservation tests | ✅ COMPLIANT |
| Default-Deny Authorization | 2: valid approved request; untrusted state | Fresh Firestore emulator suite | ✅ COMPLIANT |
| Administrator-Managed Allowlist | 2: client mutation denied; reinstall denied | Fresh Firestore emulator suite | ✅ COMPLIANT |
| Approved Product Operations | 1: current product workflow | Fresh product CRUD/transaction test | ✅ COMPLIANT |
| Immutable Movement History | 2: read/create; update/delete denied | Fresh movement emulator tests | ✅ COMPLIANT |
| Compatible Document Validation | 3: valid current; invalid shape/range; known legacy | Fresh validation/legacy emulator tests plus inventory approvals | ✅ COMPLIANT |
| Predeployment Proof and Secret Exclusion | 1: policy tests and artifact inspection pass | Fresh emulator credential-marker check; package proof; sanitized evidence inspection | ✅ COMPLIANT |

**Compliance summary**: 25/25 scenarios compliant.

### Correctness

| Area | Status | Evidence |
|---|---|---|
| Installation identity/access | ✅ Implemented | Auth restore/sign-in, own-record state mapping, fail-closed errors, and listener teardown are present and exercised. |
| Shell authorization boundary | ✅ Implemented | Non-approved states render only the blocker; approved state renders navbar and router outlet. |
| Firestore policy | ✅ Implemented | Rules constrain approval, product/movement operations, exact schemas, finite numeric values, and unknown paths. |
| Inventory compatibility | ✅ Implemented | Canonical local-date validation, transactional stock/audit writes, legacy movement normalization, and established routes are preserved. |
| Release/package proof | ✅ Implemented | Preserved validation proves hashed production entry, packaged/production main-byte equality, and no development marker; fresh production bytes match the preserved main hash. |
| Documentation/secret boundary | ✅ Truthful | README/runbook identify the public Firebase client config, prohibit privileged material, and keep production activation manual and blocked until operator gates pass. |

### Design coherence

| Decision | Result | Notes |
|---|---|---|
| Root shell gate instead of route guards | ✅ Followed | `AppComponent` prevents route component/outlet creation before approval. |
| Anonymous Auth with local restoration | ✅ Followed | No human login, custom token, or token backup path exists. |
| Own `deviceAccess/{uid}` observation | ✅ Followed | Client gets only its own record; rules use one approval lookup. |
| `node:test` plus Firestore Emulator | ✅ Followed | `test:rules` executes the declared emulator suite without deployment. |
| Preserve existing inventory routes/workflows | ✅ Followed | `/`, `/agregar`, `/editar/:id`, and `/movimientos/:id` remain unchanged after approval. |
| Manual staged rollout/rollback | ✅ Followed | No Console mutation or deployment was performed; the runbook truthfully marks those operator gates blocked. |

### TDD compliance

| Check | Result | Details |
|---|---|---|
| TDD evidence reported | ✅ | Apply progress contains a 15-row TDD Cycle Evidence table. |
| Test/evidence anchor for every task | ✅ | 15/15 tasks map to existing executable tests or release evidence. |
| RED confirmed | ⚠️ | All referenced test files exist and historical notes describe red-first work, but RED cells do not use the prescribed literal `✅ Written`. |
| GREEN confirmed | ✅ | Fresh Angular/rules execution and preserved packaged runtime evidence pass. |
| Triangulation | ✅ | Distinct state, validation, transaction, schema, lifecycle, and package scenarios have non-trivial expected outcomes. |
| Safety net | ⚠️ | Historical safety-net evidence exists, but the apply artifact does not provide a canonical per-file numeric breakdown for every modified file. |

**TDD compliance**: 4/6 checks fully canonical; no missing test file or failed GREEN evidence found.

### Test layer distribution

| Layer | Tests | Files | Tool/evidence |
|---|---:|---:|---|
| Unit/component | 77 | 8 | Karma, Jasmine, Angular TestBed |
| Emulator policy | 10 | 1 | Firebase Emulator + `node:test` |
| Release harness | 3 scenarios | 1 preserved harness/evidence set | Packaged Electron `file://`; no new run or users in this retry |
| Integration/E2E capability | 0 | 0 | No project integration/E2E runner detected |

### Changed-file coverage

| Instrumented changed TypeScript file | Lines | Branches |
|---|---:|---:|
| `src/app/service/installation-access.service.ts` | 88.73% (63/71) | 65.71% (23/35) |
| `src/app/app.component.ts` | 100% (3/3) | 100% (0/0) |
| `src/app/components/access-block/access-block.component.ts` | 71.42% (10/14) | 50% (2/4) |
| `src/app/components/navbar/navbar.component.ts` | 100% (15/15) | 50% (1/2) |
| `src/app/components/listar/listar.component.ts` | 97.22% (105/108) | 87.87% (29/33) |
| `src/app/components/movimientos-producto/movimientos-producto.component.ts` | 87.5% (42/48) | 78.94% (15/19) |

Average instrumented changed-file line coverage is 91.9%. Templates, CSS, interfaces, config, rules, docs, and test sources are not emitted as comparable executable coverage files.

### Assertion quality

| File/line | Finding | Severity |
|---|---|---|
| `src/app/app.component.spec.ts:54` | `toBeTruthy()` is a creation smoke assertion and contributes no behavioral proof. | WARNING |
| `src/app/components/navbar/navbar.component.spec.ts:42` | `toBeTruthy()` is a creation smoke assertion. | WARNING |
| `src/app/components/listar/listar.component.spec.ts:47` | `toBeTruthy()` is a creation smoke assertion. | WARNING |
| `src/app/components/movimientos-producto/movimientos-producto.component.spec.ts:41` | `toBeTruthy()` is a creation smoke assertion. | WARNING |

Assertion audit found no tautologies, orphan empty assertions, ghost loops, assertion-free required paths, or mock-heavy violation. Empty-result assertions have setup that intentionally produces no matches and companion non-empty cases.

### Quality metrics

- **Linter**: ➖ Not available in project capabilities.
- **Formatter**: ➖ Not available in project capabilities.
- **Type checker**: ✅ No errors; exit 0.
- **Build**: ✅ Exit 0 with the non-blocking warnings recorded above.

### Canonical verification evidence

Exact preimage: `/tmp/opencode/control-inventario-pr5-runtime/verify-generation9-canonical-evidence-preimage.txt`
Preimage SHA-256 / `evidence_revision`: `sha256:7796990b734837989742158491c6bd5c4eebb4528467c642346dbe7297b33e4f`.

### Issues found

**CRITICAL**: None. All retrieved requirements/scenarios and all 15 tasks have runtime or preserved release evidence.

**WARNING**:
- Strict TDD apply notes are descriptive rather than literal in RED cells and lack a complete per-file numeric safety-net breakdown.
- Existing production build warnings remain: initial bundle exceeds 500 kB, SweetAlert2 is CommonJS, and Node emits a deprecation warning.
- Coverage is informational (configured threshold 0); the blocker component is below 80% line coverage and several changed files have branches below 80%.
- Four existing creation smoke assertions do not add behavioral proof.
- Legacy snapshot capture, staging, Console audit/recreation, final activation, and deployment remain intentionally manual operator gates; this verification did not perform them.

**SUGGESTION**:
- Normalize future apply TDD evidence to the prescribed literal RED/safety-net fields and replace creation-only assertions with small behavioral assertions when those suites are next edited.

### Verdict

**PASS WITH WARNINGS**

All 11 requirements, 25 scenarios, and 15 tasks are supported by fresh runtime checks, source inspection, or preserved packaged evidence. Warnings are non-blocking and limited to canonical TDD bookkeeping, existing build/coverage quality signals, smoke assertions, and intentionally unperformed production operator gates.
