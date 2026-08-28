# Design: Safe Product Routing

## Technical Approach

Keep the public routes and Firestore service unchanged. The shared standalone product form will accept an absent `id` with a safe empty default and own an explicit resolution state. `/agregar` immediately renders create mode; `/editar/:id` renders pending while `InventarioService.getProductoId` resolves, then renders either the populated edit form or a not-found view. The form is visible only for create and resolved-existing states.

## Architecture Decisions

| Decision | Option / trade-off | Choice and rationale |
|---|---|---|
| Route input | Keep `input.required` and split routes/components; or default the existing input. | Use `input<string>('')`. Angular's existing `withComponentInputBinding()` supplies edit IDs, while the default makes direct `/agregar` safe without changing URLs or duplicating the form. |
| Resolution ownership | Add a router resolver/guard; or resolve inside the current component. | Add a component signal with `create`, `pending`, `found`, and `missing`. This follows the existing effect/service pattern, avoids route and persistence changes, and makes the pending boundary explicit. Set `pending` before awaiting; discard a late result when its captured ID no longer matches the input. |
| Missing-state return | Imperative navigation; or declarative link. | Add a `RouterLink` anchor to `/`, matching the movement-history back link. It is accessible, testable, and leaves the injected `Router` available for existing save/delete flows. |

## Data Flow

```text
/agregar -> id '' -> create -> empty, enabled form
/editar/:id -> id -> pending -> getProductoId(id)
                              |- exists() -> patch form -> found -> edit form
                              `- !exists() -> missing -> RouterLink('/') -> list
```

Only `exists() === false` becomes `missing`; a rejected read is not misrepresented as a missing product and remains outside this approved behavior.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/app/components/agregar/agregar.component.ts` | Modify | Default the route input, manage resolution state, reset/enable create form state, and patch only a current resolved edit ID. Keep existing create, update, delete, and service contracts. |
| `src/app/components/agregar/agregar.component.html` | Modify | Render mutually exclusive pending, form, and not-found branches; the missing branch hides the form and exposes a return link. |
| `src/app/components/agregar/agregar.component.css` | Modify | Add component-local pending/not-found and back-link styling consistent with existing feature CSS. |
| `src/app/components/agregar/agregar.component.spec.ts` | Modify | Add focused route-resolution RED tests while retaining save/delete regressions. |
| `src/app/app.routes.ts` | Verify only | Preserve `agregar` and `editar/:id` exactly. |
| `src/app/app.config.ts` | Verify only | Retain `withComponentInputBinding()`; no provider change. |

## Interfaces / Contracts

```ts
type ProductResolution = 'create' | 'pending' | 'found' | 'missing';
id = input<string>('');
```

`getProductoId(id)` remains the sole read contract: an existing snapshot patches the current form; a non-existing snapshot selects the missing view. The template contract is `showForm === create || found`.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | Direct `/agregar` has an empty enabled form and does not read a product; existing edit is pending before its delayed snapshot resolves, then populated; missing edit shows no form and returns to `/`. | Strict TDD: first add failing Jasmine/Angular TestBed tests in the existing component spec. Use current snapshot spies plus `RouterTestingHarness`, `routes`, and `withComponentInputBinding()`; add a `getProductosOrdenados` observable stub for the returned list route. Keep existing save/delete tests. |
| Integration | N/A | No Firestore emulator/harness exists, and persistence behavior is unchanged. |
| E2E | N/A | No E2E runner exists; do not introduce one for this scoped change. |

## Threat Matrix

The change triggers the matrix because it changes Angular routing behavior. All supplied rows are execution/VCS boundaries, not client-side URL resolution.

| Boundary | Applicability | Safe/failure response | Planned RED tests |
|---|---|---|---|
| Documentation-like paths | N/A — no executable/document classification. | N/A | N/A |
| Git repository selection | N/A — no shell or Git command. | N/A | N/A |
| Commit state | N/A — no commit automation. | N/A | N/A |
| Push state | N/A — no push automation. | N/A | N/A |
| PR commands | N/A — no PR automation. | N/A | N/A |

## Migration / Rollout

No migration required. This is client-side rendering logic only; Firestore documents, service APIs, and route strings remain intact.

## Open Questions

None. A rejected product read is intentionally not classified as not-found because that error outcome is outside the approved scope.
