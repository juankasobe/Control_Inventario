# Tasks: Safe Product Routing

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 260–340 authored additions + deletions |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR: one route-state work unit |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending (not selected; not needed) |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Safe shared-form routing | Single PR | `npm test -- --include=src/app/components/agregar/agregar.component.spec.ts` | N/A—no E2E/emulator; `RouterTestingHarness` covers routes | Revert `agregar.component.{ts,html,css,spec.ts}` together |

One work unit is appropriate: one component owns all route states; no route, service, schema, or migration change is needed.

## Phase 1: RED — Route Behavior Tests

- [x] 1.1 RED: In `src/app/components/agregar/agregar.component.spec.ts`, configure `RouterTestingHarness`, `routes`, component-input binding, snapshot spies, and the list observable stub.
- [x] 1.2 RED: Test direct `/agregar`: empty enabled form, no `getProductoId` call, and stable `agregar` / `editar/:id` route entries.
- [x] 1.3 RED: Test delayed `/editar/P-001`: pending shows neither create form nor not-found; a found snapshot then displays existing values.
- [x] 1.4 RED: Test `/editar/P-404`: missing state hides the form; its return link navigates to `/`.

## Phase 2: GREEN — Explicit Resolution States

- [x] 2.1 GREEN: In `src/app/components/agregar/agregar.component.ts`, import `RouterLink`, default `id`, add `ProductResolution`, reset/enable create mode, and resolve edits as pending/found/missing; ignore stale IDs and do not classify rejected reads as missing.
- [x] 2.2 GREEN: In `src/app/components/agregar/agregar.component.html` and `.css`, render exclusive pending/form/missing views; add an accessible `RouterLink` to `/` and component-local state styling.
- [x] 2.3 GREEN: Run `npm test -- --include=src/app/components/agregar/agregar.component.spec.ts` until all new route tests and existing save/delete regressions pass.

## Phase 3: REFACTOR — Scope and Verification

- [x] 3.1 REFACTOR: Simplify state/test helpers without changing create, update, delete, `InventarioService`, public URLs, Firestore schema, stock/movement behavior, migrations, or redirects.
- [x] 3.2 Re-run the focused test command and `npx tsc -p tsconfig.app.json --noEmit`; verify `src/app/app.routes.ts` and `src/app/app.config.ts` retain paths and `withComponentInputBinding()`.
