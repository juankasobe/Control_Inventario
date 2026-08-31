## Exploration: polish-inventory-ui

### Current State

This is a bounded presentation and copy polish for the approved inventory shell. It does not require a route, Firestore, authorization, or movement-data change.

The application has a dark outer shell because `src/styles.css` applies `bg-gray-900` to `body`. The Angular shell in `src/app/app.component.html` renders `app-navbar` and the routed page only for an approved installation. Components otherwise own their presentation through component-local HTML/CSS, with a few global helpers such as `.pagination-bar`, `.empty-state`, and the dark body background. There is no shared design-token layer.

The three reported symptoms have different immediate root causes:

| Symptom | Root classification | Evidence | Bounded root cluster |
| --- | --- | --- | --- |
| Brand wording is wrong | Feature/content request (systemic triage bucket D) | `navbar.component.html:11` hard-codes `Variedades Zuny` | Navbar copy |
| Approved identity appears as concatenated text and action | Real UI defect (bucket C) | `navbar.component.html:15-27` places label, status, UID/action, and feedback in one unstyled inline flow; `navbar.component.css` is empty | Approved-identity layout |
| Movements looks light against the dark shell | Real UI defect (bucket C); the reported active-state mechanism is not evidenced | `listar.component.html:89-91` uses a plain `routerLink` with `.action-link`; no `routerLinkActive` or active-state class exists. The destination CSS explicitly uses white/light surfaces and dark text | Movement surface theme |

The identity and movement problems share a broad consistency pattern—local UI styles have drifted from the dark shell—but they do not share one implementation fix. The brand is copy, identity is navbar layout, and movement is route-surface theming. They should remain separate bounded slices inside this named change rather than becoming a global theme rewrite.

#### Navbar and approved-device identity

`NavbarComponent` exposes `accessState` from `InstallationAccessService`. When the state is approved, the template renders the installation label, the literal `Approved`, and either a reveal action (`Ver UID`) or the revealed UID plus `Copiar UID`. `copiarUid()` retains the UID for manual copying when the clipboard API is unavailable, and the copy feedback uses `role="status"`.

The outer navbar uses Tailwind flex-wrap utilities, but the `.approved-identity` element has no local layout rules and its children have no semantic layout groups. The label, status, and action therefore compete in the same inline formatting flow; at narrow widths the outer navbar can wrap without giving the identity content a deliberate hierarchy. The visible symptom is presentation, not an identity-state or clipboard bug.

The current mobile menu behavior is already explicit: the toggle is `type="button"`, has `aria-controls` and bound `aria-expanded`, and the menu has bound `aria-hidden` plus a `hidden` class. The identity improvement must not hide or displace that toggle, change the reveal/copy behavior, or expose the UID by default without product approval. The generic identity container currently has an English `aria-label`, and the status literal is also English in an otherwise Spanish UI; whether those strings should become professional Spanish should be confirmed with the exact copy decision.

#### Movements trigger and destination

The movements action is a declarative anchor in `src/app/components/listar/listar.component.html`:

```html
<a [routerLink]="['./movimientos/', item.id]" class="action-link" [attr.aria-label]="'Ver movimientos de ' + item.nombre">
  Movimientos
</a>
```

`ListarComponent` has no movement-navigation method. `.row-actions` already provides a flex gap, wrapping, and a column layout at `max-width: 640px`; `.action-link` only supplies blue underlined text. No active route styling is attached to this link. The navbar's `Inicio` link has a hard-coded `aria-current="page"`, but that is unrelated to the clicked movement link and is not route-aware. Adding a new active state would be a separate navigation decision, not a diagnosis of the white destination surfaces.

The route is `/movimientos/:id` in `src/app/app.routes.ts`, and `MovimientosProductoComponent` loads the product and movement stream from the route input. Its behavior is currently data-only: filtering, pagination, empty states, and movement badges are implemented in the component class and should remain unchanged.

The destination component explains the screenshot. `movimientos-producto.component.css` sets `.movement-history` and summary text to dark colors, while `.history-header`, `.search-input`, and `.movement-table-wrapper` use `#ffffff`; the table header and empty/pagination surfaces use `#f9fafb`; borders and text are light-theme values. The global dark body remains visible around those surfaces. The result is a dark page background with large light cards/table/search surfaces. This is the whole movement-page palette, not a transient clicked-button state. The CSS was introduced with the movement-history UX slice, while a later list-panel change aligned other list surfaces to dark values; the two components now use different local palettes.

Existing responsive behavior to preserve includes horizontal overflow on `.movement-table-wrapper`, a stacked `.history-header` and `.pagination-bar` below 640px, the labeled full-width search input, and disabled pagination buttons. Existing accessibility behavior includes the search label/`for` pair, table column scopes, the back link, disabled controls, movement-state test hooks, and Spanish empty-state copy.

### Affected Areas

- `src/app/components/navbar/navbar.component.html` — hard-coded brand copy and approved-identity markup; likely add explicit presentation groups while retaining `data-testid` hooks and reveal/copy controls.
- `src/app/components/navbar/navbar.component.css` — currently empty; likely place the identity spacing, hierarchy, wrapping, focus, and narrow-screen rules here rather than in global CSS.
- `src/app/components/navbar/navbar.component.ts` — inspected because it owns reveal/copy behavior; no logic change is indicated unless the final presentation changes the existing interaction contract.
- `src/app/components/navbar/navbar.component.spec.ts` — update the brand/status expectation after copy is confirmed and add a DOM-structure contract for the separated label/status/action; retain reveal, clipboard, fallback, and mobile-menu tests.
- `src/app/components/listar/listar.component.html` — movement trigger at lines 89-91; no change is recommended unless the product explicitly requests a route-active indicator.
- `src/app/components/listar/listar.component.css` — confirms `.row-actions` already handles spacing and mobile stacking and `.action-link` has no active-state rule; no palette fix belongs here.
- `src/app/components/listar/listar.component.ts` — no movement-specific behavior; no change indicated.
- `src/app/components/listar/listar.component.spec.ts` — existing text coverage includes `Movimientos`; optionally add an href/accessible-name assertion for the trigger, but do not add active-state expectations unless that scope is approved.
- `src/app/components/movimientos-producto/movimientos-producto.component.html` — page surface structure, Spanish copy, search, table, empty states, and pagination; likely only needs small semantic class/group additions if the confirmed palette or hierarchy requires them.
- `src/app/components/movimientos-producto/movimientos-producto.component.css` — primary movement fix location; explicit light-theme declarations must be made coherent with the confirmed shell treatment while preserving overflow and mobile rules.
- `src/app/components/movimientos-producto/movimientos-producto.component.ts` — owns loading/filtering/pagination only; no behavior change indicated.
- `src/app/components/movimientos-producto/movimientos-producto.component.spec.ts` — existing tests cover filtering, pagination, empty states, badges, return navigation, and teardown; retain them and add only a small template contract if markup wrappers change. Exact colors and responsive pixels should not be asserted in these unit tests.
- `src/styles.css` — context and coupling point: global dark body plus shared `.pagination-bar`/`.empty-state` rules. Avoid changing it for this bounded fix; note that the movement and list component selectors intentionally override some global properties.
- `src/app/app.component.html` and `src/app/app.routes.ts` — confirm the approved shell and `/movimientos/:id` route; no change indicated.
- `src/app/components/access-block/*` and `src/app/service/installation-access.service.ts` — related identity/access context only. Do not broaden this visual change to blocked-state authorization UI or service behavior without a separate requirement.

### Approaches

1. **Bounded component-local polish** — Confirm the copy and palette, update the navbar template/CSS for explicit identity groups and responsive wrapping, and update the movement component CSS (with only minimal HTML class changes if necessary). Leave routing, global theme configuration, and data behavior alone.
   - Pros: smallest root-level fix; matches the existing component-local architecture; preserves security and movement behavior; avoids introducing theme state, configuration, or an unnecessary active-navigation state.
   - Cons: color values remain local and may need future consolidation; responsive/color verification needs manual visual review because no visual or E2E harness exists.
   - Effort: Low to Medium.

2. **Introduce shared surface/theme tokens** — Define global CSS variables or shared surface classes, then refactor navbar, list, form, and movement surfaces to consume them.
   - Pros: reduces future palette drift and gives later UI work one vocabulary.
   - Cons: broadens the change beyond the reported symptoms, risks regressions in already-aligned list/form/access screens, and turns a small polish into a theme migration without a confirmed theme contract.
   - Effort: Medium to High.

3. **Treat the trigger as an active-navigation problem** — Add route-aware active styling to the movements link (for example, `routerLinkActive`) and leave the destination palette unchanged.
   - Pros: directly addresses a possible request for persistent navigation feedback and is small if independently desired.
   - Cons: source evidence shows no active-state implementation is causing the white surfaces; it would not fix the reported movement-page contrast, and it would add a new visual state without confirmed product intent. The current hard-coded `aria-current` also needs a separate route-aware accessibility decision.
   - Effort: Low, but incomplete for the reported screenshot.

### Recommendation

Use Approach 1, with the movement palette conditional on the product answer. The smallest implementation boundary is:

1. Replace the single navbar brand literal with the exact confirmed Spanish product copy.
2. Keep the approved UID reveal/copy behavior, but give the device label, approval status, and UID action explicit groups with a flex layout, gap, wrapping, visible keyboard focus, and a narrow-screen stacking rule in `navbar.component.css`.
3. Do not add `routerLinkActive`, a new navigation state, or a theme configuration flag merely because the user clicked `Movimientos`. The evidence identifies the destination component's hard-coded light surfaces as the cause.
4. If the intended treatment is dark, align the movement history background, header, search field, empty states, table, table header, badges, pagination, borders, text, hover, focus, and disabled states to the existing dark shell/list vocabulary in `movimientos-producto.component.css`. If light content cards are intentional, the proposal must instead define that as a coherent contrast treatment; it should not silently choose one.

This keeps fixes at their roots without making three symptoms into three unrelated patches or creating a premature design-system migration.

#### Product questions required before proposal

- What is the exact brand copy: `Control Inventario`, `Control de Inventario`, or another phrase? The user typed `contro Inventario`, so the final spelling and capitalization need confirmation. Should the same copy also update the document/window title, or only the navbar?
- For the approved device, should the visible status remain `Approved` or become the professional Spanish `Aprobado`? Should the label be presented as plain text or a status/badge hierarchy? Should `Ver UID` remain reveal-only with the UID hidden by default, as it is now?
- For movements, should the entire route use dark surfaces consistent with the shell/list, or are white summary/search/table cards intentionally desired on the dark background? Confirm the intended treatment for empty states, pagination, movement badges, hover/focus, and disabled controls.
- Is a persistent active indicator for the `Movimientos` link actually wanted, separate from the palette correction? If yes, define its visual and `aria-current` behavior; otherwise leave navigation state untouched.

### Risks

- Choosing a brand or status string before confirmation would pin the wrong copy in the template and tests.
- Changing `body`, Tailwind dark-mode configuration, or global surface helpers could regress the list, product form, access blocker, and navbar; the bounded recommendation avoids that blast radius.
- The identity block shares horizontal space with the mobile-menu toggle. A layout that only works at desktop widths could recreate the defect on small screens; viewport checks are required later.
- `.pagination-bar` and `.empty-state` are both global and component-local selectors. A palette change must distinguish inherited layout rules from local overrides and preserve the existing mobile flex behavior.
- Unit tests do not prove computed colors, responsive wrapping, or visual hierarchy. The repository has no E2E/visual harness, and tests/builds were intentionally not run during this exploration.
- The workspace already contains tracked modifications in `angular.json` and `package-lock.json`; they must remain byte-for-byte unchanged throughout later work.

### Ready for Proposal

No. The code diagnosis is ready, but proposal work should wait for the exact brand copy, approved-device presentation/status decision, and movement dark/light treatment. Also confirm whether an active movement-link indicator is in scope; current evidence does not support treating it as the cause of the white movement surfaces.
