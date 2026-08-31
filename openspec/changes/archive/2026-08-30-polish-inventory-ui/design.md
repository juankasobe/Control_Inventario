# Design: Polish Inventory UI

## Technical Approach

Make three bounded presentation changes in the existing standalone Angular components: exact branding, copy-only device identity, and a component-local dark movement palette. Keep `InstallationAccessService`, the shell gate, routes, movement logic, and global styles unchanged.

## Architecture Decisions

| Option | Tradeoff | Decision and rationale |
|---|---|---|
| Component-local HTML/CSS | Repeats palette values | Chosen: it matches current ownership and limits regression risk. No global tokens are introduced because this is one route polish, not a validated design-system migration. |
| Copy-only UID actions | Clipboard failure has no manual reveal fallback | Chosen: privacy is invariant across every access state; accessible feedback replaces disclosure. |
| Delete reveal behavior | Removes an existing interaction | Chosen over parallel flags: `uidVisible`, `revelarUid()`, revealed `<code>`, and manual-copy branches become obsolete. |
| Preserve existing movement DOM and logic | CSS carries most visual proof | Chosen: current classes already identify every surface while retaining table semantics, overflow, filtering, pagination, and empty states. |

## Data Flow

```text
InstallationAccessService signal
  ├─ approved → Navbar label + Aprobado + copy action → Clipboard API → live status
  └─ other    → AccessBlock status/instructions + conditional copy action → live status

Route input/service data → existing movement filters/pages → unchanged semantic table → local dark CSS
```

Clipboard success announces `UID copiado.`; rejection or unavailable API announces `No se pudo copiar el UID. Intentá nuevamente.` Both use the existing `data-testid="copy-status"` with `role="status"`, `aria-live="polite"`, and no UID text.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/index.html` | Modify | Set `<title>Control Inventario</title>`. |
| `src/app/components/navbar/navbar.component.{html,ts,css}` | Modify | Exact brand; structured responsive identity; direct copy; delete reveal/manual-fallback state and DOM. |
| `src/app/components/access-block/access-block.component.{html,ts,css}` | Modify | Spanish statuses and copy-only handoff without visible UID; replace obsolete `.uid-details` presentation. |
| `src/app/components/movimientos-producto/movimientos-producto.component.css` | Modify | Dark header, search, table, empty, pagination, borders, text, badges, hover/focus/disabled states. |
| `src/app/components/navbar/navbar.component.spec.ts` | Modify | Branding, identity structure, no UID disclosure, clipboard success/failure, mobile-menu preservation. |
| `src/app/components/access-block/access-block.component.spec.ts` | Modify | State copy, conditional action, no UID disclosure, accessible success/failure. |
| `src/app/components/movimientos-producto/movimientos-producto.component.spec.ts` | Modify | Focused surface/style contract while retaining workflow tests. |

No application or test files are created or deleted (8 application files and 3 tests modified). `angular.json`, `package-lock.json`, Firebase, dependencies, routes, list links, and global CSS remain byte-for-byte untouched.

## Interfaces / DOM Contracts

- Navbar retains `approved-identity`, `mobile-menu-toggle`, and `mobile-menu` test hooks. Identity adds `approved-label`, `approved-status`, and existing `copy-uid`; `.approved-identity` wraps label/badge/actions and stacks below 640px without displacing the menu toggle.
- Access block retains `access-block`, `access-status`, `access-label`, `access-instructions`, `copy-uid`, and `copy-status`; delete `access-uid`. Show copy only for pending/revoked/unavailable when `uid` exists.
- Status labels are `Verificando acceso`, `Pendiente`, `Aprobado`, `Revocado`, and `Acceso no disponible`. Authorization mapping and `AccessState` remain unchanged.
- Movement retains `.movement-history`, `.history-header`, `.search-input`, `.empty-state`, `.movement-table-wrapper`, semantic table scopes, badge modifiers, and `.pagination-bar`. Use local slate surfaces (`#111827`/`#1e293b`), light text, explicit borders/focus rings, and dark contrast-safe green/red badges.

## Testing Strategy

| Layer | Approach |
|---|---|
| Unit/TDD | RED first in navbar/access specs for exact structure, absent UID text/hooks, copy outcomes, and preserved menu/state behavior; then GREEN by deleting reveal branches and implementing copy-only feedback. Add a focused movement computed-style/surface contract, then retain all existing filtering, pagination, badge, empty-state, navigation, and teardown tests. Run `npm test`. |
| Integration/E2E | No harness exists; do not add one. |
| Manual | Desktop and ≤640px: verify brand/title, identity wrapping/menu, every access state, clipboard success/failure, dark populated/empty/filtered movement views, table overflow, hover/focus, badge contrast, and disabled pagination. Confirm `Movimientos` has no persistent active style or `aria-current`. |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable classification, or process-integration boundary changes.

## Migration / Rollout

No migration or flag. Roll back the 11 files together; no data rollback is required. Preserve unrelated workspace modifications exactly.

## Open Questions

None; all implementation-blocking choices are resolved by the proposal and specs.
