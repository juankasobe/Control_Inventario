## Exploration: inventory-improvement-opportunities

### Current State

**Executive finding:** The application has a coherent small inventory workflow, but its highest-risk gaps are at the boundaries between routing, product editing, stock mutation, and Firestore lifecycle. The strongest user-value addition after those boundaries are protected is low-stock triage.

The current system is an Angular 19 standalone application packaged by Electron. `app.routes.ts` exposes product listing, creation, editing, and per-product movement history. `InventarioService` is the only persistence service: products live at `Productos/{id}`, movements live under `cambiosStock`, and stock adjustments update the product and create an audit document in one Firestore transaction. Product search, movement filtering, and pagination are performed in the renderer after loading collections.

#### Prioritized shortlist

| Rank | Candidate | Class / confidence | Why it matters now |
| --- | --- | --- | --- |
| 1 | Protect the stock ledger and movement date contract | Confirmed repair, with one business-policy decision | Editing a product can silently change stock without an audit movement; an empty date can be persisted as `NaN-NaN-NaN`. |
| 2 | Make the add/edit route input contract safe | Confirmed repair | `/agregar` has no `id` route parameter while `AgregarComponent` declares `id` as required and reads it during initialization. The create workflow is at risk of a runtime failure. |
| 3 | Define safe product deletion/lifecycle behavior | Confirmed application behavior; Firestore consequence should be emulator-verified | `deleteDoc` removes only the product document; movement subcollection handling is absent, so deletion can leave orphaned audit records. |
| 4 | Add low-stock thresholds and triage | Missing capability, value hypothesis | The list exposes current quantities but gives no replenishment signal, threshold, or low-stock filter. |
| 5 | Add structured movement reasons | Missing capability, value hypothesis | The UI distinguishes “Compra/dev” and “Venta/dev”, but persistence stores only `entrada` or `salida` plus free text, limiting audit/reporting quality. |

### Affected Areas

- `src/app/app.routes.ts` — maps `/agregar` and `/editar/:id` to the same component.
- `src/app/app.config.ts` — enables `withComponentInputBinding` and contains the Firebase client configuration.
- `src/app/components/agregar/agregar.component.ts` and `.html` — product create/edit form, direct quantity editing, required route input, and deletion action.
- `src/app/components/listar/listar.component.ts` and `.html` — stock adjustment form, date conversion, current-stock display, search, and pagination.
- `src/app/service/inventario.service.ts` — product writes, stock transaction, movement mapping, date formatting, and product deletion.
- `src/app/interface/inventario.ts` and `src/app/interface/movimientoStock.ts` — current product and movement contracts.
- `src/app/components/*/*.spec.ts` and `src/app/service/inventario.service.spec.ts` — unit coverage and its blind spots.

#### 1. Protect the stock ledger and movement date contract — P0 confirmed repair

- **Evidence:** `AgregarComponent.agregarProducto()` sends `cantidad` to `InventarioService.updateProducto()`, and `updateProducto()` calls `updateDoc()` directly. No movement document is created for that quantity change. The audited path is instead `ListarComponent.registrarAjuste()` → `agregarStock()`/`disminuirStock()` → `adjustStock()` → `applyStockAdjustmentTransaction()`.
- **Current behavior:** The edit form permits changing the current stock as ordinary product metadata. Product creation also writes an opening quantity with `setDoc()` and does not create an opening movement; whether that is acceptable is a business-policy question.
- **Date defect:** `ListarComponent.registrarAjuste()` constructs `new Date(this.fecha)` even when the date input is empty. `InventarioService.formatFecha()` does not reject an invalid `Date`, so an empty date can become `NaN-NaN-NaN`. For a date-only string, using local getters after `new Date('YYYY-MM-DD')` can also shift the displayed calendar date in negative UTC offsets; this was reproduced with the project’s Spanish/Argentina locale context.
- **User impact:** The visible stock can diverge from the movement history, making reconciliation and audit unreliable. Invalid or shifted dates make movement history misleading.
- **Uncertainty:** The direct-edit inconsistency and empty-date path are confirmed from source. The required treatment of opening stock, and whether invoice/description are mandatory, need product-owner confirmation.
- **Risk:** Medium implementation risk because changing the update contract affects the edit form and any future callers. A migration decision is needed if existing silently edited quantities must be reconciled.
- **Initial scope:** Split metadata updates from stock mutations; make quantity read-only or route changes through the transactional adjustment path; preserve a date-only calendar value or parse it without UTC conversion; reject or default missing dates before writing. Add unit tests for direct quantity edits, empty dates, timezone-safe dates, and transaction write plans. Defer opening-balance migration until the policy is approved.

#### 2. Make the add/edit route input contract safe — P0 confirmed repair

- **Evidence:** `app.routes.ts` sends `/agregar` to `AgregarComponent` without an `id`, while `/editar/:id` supplies one. `AgregarComponent.id` is `input.required<string>()`; its constructor `effect()` immediately reads `this.id()`, and several getters used by the template read it as well. `app.config.ts` enables router-to-input binding.
- **Current behavior:** Angular required input signals throw when read before a value is available. The no-`id` route does not provide that value, so the add screen can fail during initialization rather than rendering its create form. Existing tests avoid the gap by calling `fixture.componentRef.setInput('id', '')` before change detection.
- **User impact:** Users may be unable to open the primary “Agregar” workflow. The edit route and the direct component tests can still appear healthy.
- **Uncertainty:** The static contract is high-confidence; a browser smoke test should confirm the exact runtime failure after dependencies are available. A missing-product edit route is a related, separate not-found state that is currently also ignored.
- **Risk:** Low code risk, but changing input optionality must not weaken edit-route loading or accidentally treat a missing product as create mode.
- **Initial scope:** Use an optional/default `id` for the create route, keep edit detection explicit, and add a route-level test for `/agregar` plus an edit test for `/editar/:id`. Add a visible not-found state separately if approved.

#### 3. Define safe product deletion/lifecycle behavior — P1 confirmed behavior, consequence to verify

- **Evidence:** `AgregarComponent.eliminarProducto()` awaits `InventarioService.deleteProducto()`, and `deleteProducto()` only executes `deleteDoc(productoRef)`. No code enumerates, archives, or deletes `Productos/{id}/cambiosStock`.
- **Current behavior:** Deleting a product removes the parent product document but has no application-level policy for its movement subcollection. Firestore subcollections are not automatically removed with a parent document; the resulting orphan behavior and deployed security rules are not covered by this repository’s tests.
- **User impact:** Historical movement records can remain as inaccessible/orphaned data, create retention and cost concerns, and undermine the meaning of an audit trail. A later route to the deleted product can show incomplete product context.
- **Uncertainty:** The source-level omission is confirmed. Whether the deployed Firestore rules permit those orphan documents to be read or whether retention requires preservation must be checked with the actual project and an emulator/deployed-rule test.
- **Risk:** High because deletion is destructive and recursive client deletion is unsafe under permissions, failures, and Firestore limits.
- **Initial scope:** Decide on soft archive as the default, or design an authorized server-side cascade if hard deletion is required. Do not begin with an unbounded renderer-side recursive delete. Add an integration test that proves the selected lifecycle behavior and its failure/rollback semantics.

#### 4. Add low-stock thresholds and triage — P1 missing capability

- **Evidence:** `Inventario` contains only `id`, `nombre`, `cantidad`, and `descripcion`. `ListarComponent` displays current stock and supports name/ID search, but has no minimum-stock field, status, or filter.
- **Current behavior:** Users must inspect quantities manually; zero stock is not visually or operationally distinguished from other quantities.
- **User impact:** Replenishment decisions are slower and stockouts can be missed. This is a likely value opportunity, not a confirmed defect because no threshold policy exists today.
- **Uncertainty:** The business must define whether the threshold is per product, whether zero means “no threshold,” and whether the first release needs notifications or only a list signal.
- **Risk:** Low-to-medium schema and UX risk. A client-side filter is simple now, but unbounded collection reads will not scale into scheduled alerts without a query/backend strategy.
- **Initial scope:** Add an optional minimum-stock value, a clear low-stock badge, and a list filter; keep notifications, purchasing workflows, and background jobs out of the first slice. Cover default/zero/threshold-equals-current cases in unit tests.

#### 5. Add structured movement reasons — P2 missing capability

- **Evidence:** `listar.component.html` labels the two actions “Compra/dev” and “Venta/dev”, but `MovimientoStock.tipo` and `InventarioService.buildMovimientoStockWrite()` persist only `entrada` or `salida`; `descripcion` is free text. History search can match the direction but not a reliable reason category.
- **Current behavior:** A purchase and a supplier return are both an `entrada`; a sale and a customer return are both a `salida`. Users must infer the reason from free text.
- **User impact:** Movement review, reconciliation, and future reporting are less precise. This is a missing capability, not a confirmed defect in the current two-direction model.
- **Uncertainty:** The permitted reason taxonomy and legacy mapping need product-owner agreement. Existing legacy documents already require compatibility mapping for `compra`/`venta` and misspelled field names.
- **Risk:** Medium schema-compatibility risk. Adding a required field without a legacy default can break history rendering or filtering.
- **Initial scope:** Add a small reason enum to new movement writes, display and filter it in the existing per-product history, and map legacy records to a safe default. Defer a cross-product report/export until the query and authorization strategy is defined.

### Approaches

1. **Integrity-first sequencing** — Fix the route/input contract and stock-ledger/date boundaries before adding workflow features; resolve deletion and security gates before production use.
   - Pros: Prevents new or hidden data corruption, gives later features trustworthy stock and audit data, and keeps the first change small enough for the 400-line review budget.
   - Cons: Delays visible replenishment/reporting improvements and requires a decision about opening balances and deletion retention.
   - Effort: Medium across several bounded changes; low for the route repair alone.

2. **Capability-first sequencing** — Add low-stock triage or movement reasons while leaving the current mutation and lifecycle boundaries unchanged.
   - Pros: Delivers visible user value quickly and reuses the existing list/history components.
   - Cons: Makes new UI depend on stock values that can be changed without audit, and can increase migration/rework cost when security or query limits are addressed.
   - Effort: Medium.

### Recommendation

Use integrity-first sequencing. The first approved SDD change should be one bounded repair, not a combined feature bundle: the stock-ledger/date boundary is the highest business-risk repair, while the route input repair is the smallest high-confidence unblocker and should be verified immediately. Treat deletion policy and Firestore authorization as release gates rather than hiding them inside a low-stock feature. Once the core workflow is trustworthy, low-stock thresholds are the strongest first user-value addition; structured movement reasons can follow.

Verification should begin with focused failing unit tests under strict TDD, then add a Firestore emulator/integration layer for transaction rollback and deletion behavior. No implementation, proposal, spec, design, or task list was created in this exploration.

### Risks

- **Testing availability:** `node_modules/` is absent, so `npm test`, the configured typecheck, and the build were not executed; dependency installation was intentionally not performed. Six unit-spec files exist, but there is no Firestore emulator or E2E harness.
- **Coverage blind spots:** Tests mock the service or construct `InventarioService` with `Object.create()` and exercise private helpers; they do not prove real router input binding, Firestore rules, transaction rollback, create/update/delete persistence, malformed product documents, or date/timezone behavior.
- **Authorization and configuration:** `app.config.ts` contains the Firebase web configuration, `firebase.json` is empty, no Firestore rules file is tracked, and no authentication provider or user identity is present. A Firebase web API key is not itself a secret, but data exposure depends on deployed rules that cannot be verified from this clone; this is a production gate, not proof that the deployed database is open.
- **Scale and cost:** Both product listing and movement history load collections into the renderer, then filter/sort/page locally. Long histories, global reporting, and alerting may require bounded queries, indexes, or a backend rather than expanding the current client-side pattern.
- **Destructive lifecycle changes:** Any hard-delete repair needs an explicit rollback/retention plan and integration evidence before it is proposed.

### Ready for Proposal

No — the exploration is ready, but the user must approve one prioritized candidate before `sdd-propose` starts. Keep this interactive session stopped at exploration; do not create a proposal, spec, design, task list, or application-code change yet.
