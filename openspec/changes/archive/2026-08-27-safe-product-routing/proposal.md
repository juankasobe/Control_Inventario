# Proposal: Safe Product Routing

## Intent

Make product creation and editing predictable. `/agregar` currently supplies no route `id`, while the shared form requires one and reads it during initialization. A nonexistent `/editar/:id` also leaves users in an unexplained edit screen. This change gives each route an explicit, safe outcome without changing public URLs.

## Scope

### In Scope
- Render an empty, usable new-product form at `/agregar` without requiring an `id`.
- Preserve product loading and editing at `/editar/:id` when the product exists.
- Show a clear not-found state for a missing product, with an action back to the product list.
- Add focused route/component coverage under strict TDD during implementation.

### Out of Scope
- Stock mutations, movement audit, product deletion lifecycle, or other inventory features.
- URL changes, redirects for valid routes, data migrations, or Firestore schema changes.

## Capabilities

### New Capabilities
- `safe-product-routing`: Defines create-without-id behavior and existing/missing-product edit outcomes for the shared product form.

### Modified Capabilities
- None. No existing OpenSpec capabilities are defined.

## Approach

Replace the required route input with a safe optional/default input and model create, loading, edit, and not-found states explicitly. Load a product only for edit routes; render the form for create or a resolved existing product, and render a dedicated not-found view otherwise. Keep `/agregar` and `/editar/:id` route definitions unchanged. Drive implementation with focused failing tests first.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/components/agregar/agregar.component.ts` | Modified | Safe input contract and explicit route/product state. |
| `src/app/components/agregar/agregar.component.html` | Modified | Empty create form and edit not-found view with list action. |
| `src/app/components/agregar/agregar.component.spec.ts` | Modified | Create, existing edit, and missing edit coverage. |
| `src/app/app.routes.ts` | Verified | Existing public route paths remain unchanged. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Missing edit is mistaken for create mode | Medium | Separate route mode from product existence and test both outcomes. |
| Async loading briefly exposes the wrong UI | Medium | Use an explicit loading/resolution state before rendering. |
| Existing edit behavior regresses | Low | Preserve URL and service contract; cover successful product loading. |

## Rollback Plan

Revert the component, template, and focused tests together. No persisted data, route path, or schema requires rollback.

## Dependencies

- Existing Angular Router component-input binding and `InventarioService.getProductoId`; no new package or backend dependency.

## Success Criteria

- [ ] Navigating directly to `/agregar` renders an empty enabled form with no runtime required-input error.
- [ ] `/editar/:id` renders the populated edit form when the product exists.
- [ ] A missing `/editar/:id` renders one clear not-found state and a working action to `/`.
- [ ] Automated coverage proves all three outcomes while public URLs remain unchanged.
