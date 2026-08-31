# Tasks: Polish Inventory UI

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 280–360 authored lines across 11 planned files |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | One PR with Unit A → Unit B work-unit commits |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| A | Brand + access identity privacy/layout | PR 1 (single) | `npm test` (navbar/access specs) | Native Windows Electron: desktop and ≤640px identity/menu/access checks; WSLg is not visual proof | Revert `src/index.html`, navbar/access files, and their specs only |
| B | Movement dark presentation | PR 1 (single) | `npm test` (movement spec) | Native Windows Electron: populated/empty/filtered movement at desktop and ≤640px | Revert `movimientos-producto.component.css` and its spec only |

## Phase 1: RED — Brand and Access Identity

- [x] 1.1 In `src/app/components/navbar/navbar.component.spec.ts`, add failing tests for exact navbar/title branding, the `approved-label`/`approved-status`/`copy-uid` hierarchy, no UID text or DOM, exact Spanish copy success/failure (`UID copiado.` / `No se pudo copiar el UID. Intentá nuevamente.`), live-status accessibility, and preserved menu hooks/state.
- [x] 1.2 In `src/app/components/access-block/access-block.component.spec.ts`, add failing tests for exact pending/revoked/unavailable Spanish states, label/instructions, conditional copy action, absent `access-uid`/UID text even after failed copy, and accessible copy outcomes.

## Phase 2: GREEN — Brand and Access Identity

- [x] 2.1 Update `src/index.html` and `src/app/components/navbar/{navbar.component.html,ts,css}` to use exact branding, responsive identity groups, direct Clipboard API copy, and live feedback; delete `uidVisible`, `revelarUid()`, reveal/manual-fallback branches and DOM while preserving mobile menu and access mapping.
- [x] 2.2 Update `src/app/components/access-block/{access-block.component.html,ts,css}` with `Verificando acceso`, `Pendiente`, `Aprobado`, `Revocado`, and `Acceso no disponible`; provide copy-only handoff for UID-bearing pending/revoked/unavailable states, keep UID hidden, and leave gating/service behavior unchanged.

## Phase 3: RED — Movement Presentation

- [x] 3.1 In `src/app/components/movimientos-producto/movimientos-producto.component.spec.ts`, add failing presentation-contract tests for retained surface hooks/table scopes, populated and empty readability, badge distinctions, focus/disabled pagination, narrow overflow/stacking, and unchanged filtering/pagination/navigation/teardown; add no active styling or `aria-current` to `listar.component.html`.

## Phase 4: GREEN — Movement Presentation

- [x] 4.1 Update only `src/app/components/movimientos-producto/movimientos-producto.component.css` for dark header/search/table/empty/pagination surfaces, borders/text/interactions, explicit focus/disabled states, and contrast-safe badges; preserve DOM, data/filter/pagination semantics, responsive behavior, global CSS, and routes.

## Phase 5: Regression, Refactor, and Manual Proof

- [x] 5.1 After each GREEN slice, run `npm test` for focused proof; after both pass, run the full `npm test`, then refactor only stale expectations/comments without changing behavior.
- [x] 5.2 In native Windows Electron, validate desktop and ≤640px branding/title, every access state, copy success/failure, menu wrapping, populated/empty/filtered movement, overflow, hover/focus, badge contrast, disabled pagination, and no persistent `Movimientos` active style/`aria-current`; do not use WSLg as visual proof.
- [x] 5.3 Confirm `angular.json` and `package-lock.json` remain byte-for-byte untouched; perform no Firebase deployment or mutation.
