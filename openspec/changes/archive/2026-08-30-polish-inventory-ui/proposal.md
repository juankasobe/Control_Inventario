# Proposal: Polish Inventory UI

## Intent

Unify product identity, clarify approved-device information, keep UIDs private on screen, and align movement history with the dark shell. This is bounded presentation work, not a theme-system rewrite.

## Scope

### In Scope
- Show `Control Inventario` in the navbar and document/window title.
- Separate device label, `Aprobado` badge, and copy-only UID action; never render the UID, including on clipboard failure, and announce outcomes accessibly.
- Apply dark surfaces across the movement route, including controls, states, borders, interactions, and contrast-safe badges.
- Update focused unit contracts and perform manual responsive/visual validation.

### Out of Scope
- Authentication, access decisions, Firestore, routes, movement data/filter/pagination, and inventory logic.
- Global theme tokens or a design-system migration.
- A persistent active state for per-product `Movimientos` links.

## Capabilities

### New Capabilities
- `inventory-ui-presentation`: Defines product branding and dark movement-route presentation.

### Modified Capabilities
- `device-access-control`: Replaces visible UIDs with copy-only access and defines the approved identity hierarchy and `Aprobado` status.

## Approach

Use component-local markup and CSS while preserving hooks and behavior. Update the access contract and focused tests. Keep global styling unchanged; supplement unit tests with responsive visual validation.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/index.html` | Modified | Set the window title. |
| `src/app/components/navbar/*` | Modified | Brand, identity, copy feedback, tests. |
| `src/app/components/access-block/*` | Modified | Enforce copy-only UID presentation. |
| `src/app/components/movimientos-producto/*` | Modified | Dark route surfaces and focused tests. |
| `openspec/specs/device-access-control/spec.md` | Modified contract | Delta will replace visible-UID requirements. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Copy-only UID impedes administration | Med | Preserve one clear action and accessible failure feedback. |
| Dark states lose contrast or responsiveness | Med | Check interactions, badges, overflow, empty states, and narrow viewports. |
| Unrelated workspace edits are disturbed | Low | Leave existing `angular.json` and `package-lock.json` modifications byte-for-byte untouched. |

## Rollback Plan

Revert the title, presentation, tests, and capability delta together. No data or migration rollback is required.

## Dependencies

- Existing identity state, Clipboard API integration, local CSS, and Angular unit harness.

## Success Criteria

- [ ] Navbar and window title show exactly `Control Inventario`.
- [ ] No access state visibly renders a UID; copy success/failure is accessible and failure reveals nothing.
- [ ] Approved identity clearly separates device label, `Aprobado`, and action at desktop and narrow widths.
- [ ] Every movement-route surface is dark and usable across interaction states; badges retain accessible contrast.
- [ ] Focused unit tests pass, and manual responsive/visual checks confirm no workflow changes.
