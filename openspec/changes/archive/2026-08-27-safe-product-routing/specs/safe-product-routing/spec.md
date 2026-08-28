# Safe Product Routing Specification

## Purpose

Define predictable creation and editing outcomes for the shared product form while preserving its public route paths.

## Requirements

### Requirement: Product Creation Without an Identifier

The system MUST render a usable, empty product-creation form when `/agregar` is opened without a product identifier. The form MUST be enabled for product entry and MUST NOT require a route identifier to initialize.

#### Scenario: Open the creation route directly

- GIVEN no product identifier is available
- WHEN the user navigates directly to `/agregar`
- THEN an empty, enabled product-creation form is displayed
- AND no missing-identifier error is presented

### Requirement: Existing Product Editing

The system MUST resolve the identifier supplied by `/editar/:id` and MUST display the existing product in the edit form when that product is found.

#### Scenario: Open an existing product

- GIVEN a product exists for the identifier in `/editar/:id`
- WHEN the route finishes resolving the product
- THEN the edit form is displayed with that product's existing values

#### Scenario: Product resolution is pending

- GIVEN an edit-route identifier has not yet been resolved
- WHEN the edit route is being evaluated
- THEN the system MUST NOT display an empty creation form
- AND the system MUST NOT display a not-found state prematurely

### Requirement: Missing Product State

The system MUST display a clear not-found state when `/editar/:id` identifies no existing product. This state MUST provide a return action to `/` and MUST NOT display the product form as a creation or editing outcome.

#### Scenario: Requested product does not exist

- GIVEN no product exists for the identifier in `/editar/:id`
- WHEN the route finishes resolving the product
- THEN a clear product-not-found state is displayed
- AND no product form is displayed

#### Scenario: Return from the not-found state

- GIVEN the product-not-found state is displayed
- WHEN the user activates its return action
- THEN the user is taken to `/`

### Requirement: Stable Product Route Paths

The system MUST continue to expose product creation at `/agregar` and product editing at `/editar/:id` without requiring replacement paths.

#### Scenario: Use the established product paths

- GIVEN the application exposes product creation and editing
- WHEN a user opens `/agregar` or `/editar/:id`
- THEN the requested capability is available at that same path
