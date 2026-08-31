# Inventory UI Presentation Specification

## Purpose

Define product branding and accessible dark movement-history presentation without changing workflows.

## Requirements

### Requirement: Product Branding

The navbar and document/window title MUST display exactly `Control Inventario`.

#### Scenario: Consistent identity
- GIVEN the application shell is visible
- WHEN its navbar and document title render
- THEN both show exactly `Control Inventario`

### Requirement: Dark Movement Surfaces

The movement route MUST use dark surfaces for its summary/header, search, table, empty states, pagination, borders, and text. Badges MUST retain contrast-safe distinctions. Hover, focus, and disabled states MUST remain visible. Responsive overflow and stacking MUST remain usable.

#### Scenario: Populated movement history
- GIVEN movement records exist
- WHEN the route renders
- THEN every surface and badge is readable against the dark presentation

#### Scenario: Empty movement history
- GIVEN no records match the current state or filter
- WHEN the empty state renders
- THEN it remains readable without changing its message or semantics

#### Scenario: Keyboard focus and disabled pagination
- GIVEN a control has keyboard focus and pagination is unavailable
- WHEN their states render
- THEN focus is visible and the disabled action is distinguishable and inoperative

#### Scenario: Narrow viewport
- GIVEN the route has a narrow viewport
- WHEN its content renders
- THEN existing stacking and horizontal overflow remain usable

### Requirement: Presentation-Only Scope

The presentation MUST NOT change filtering, pagination, data, accessibility semantics, routes, responsive behavior, or inventory behavior. Per-product `Movimientos` links MUST NOT gain persistent active styling or `aria-current`.

#### Scenario: Existing movement workflow
- GIVEN a user filters, paginates, or opens movement history
- WHEN the polished presentation is active
- THEN established data, navigation, responsive, and accessibility behavior remains unchanged

#### Scenario: Product movement link
- GIVEN a per-product `Movimientos` link
- WHEN route state changes
- THEN it gains neither persistent active styling nor `aria-current`
