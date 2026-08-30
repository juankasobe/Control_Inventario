# Firestore Authorization Policy Specification

## Purpose

Define default-deny, installation-scoped Firestore access while preserving approved-device inventory behavior and known stored data.

## Requirements

### Requirement: Default-Deny Authorization

Firestore MUST deny inventory access when a request is unauthenticated or its UID record is missing, pending, revoked, malformed, or not administrator-established. Only a valid approved record MUST authorize access.

#### Scenario: Valid approved request
- GIVEN an authenticated UID has a valid approved allowlist record
- WHEN it requests a permitted inventory operation
- THEN the operation is authorized

#### Scenario: Untrusted authorization state
- GIVEN a request is unauthenticated or its record is missing, pending, revoked, malformed, or self-created
- WHEN it requests inventory access
- THEN the request is denied

### Requirement: Administrator-Managed Allowlist

The allowlist MUST be keyed by installation UID. Records MUST contain the same UID, a human-readable label, and pending, approved, or revoked status. Distributable clients MUST NOT create, update, or delete them.

#### Scenario: Client mutates its record
- GIVEN an authenticated installation targets its own allowlist record
- WHEN it attempts create, update, or delete
- THEN the write is denied

#### Scenario: Reinstalled device
- GIVEN a reinstall authenticates with a new UID
- WHEN the prior UID alone is approved
- THEN the new UID is denied and does not inherit approval

### Requirement: Approved Product Operations

Approved UIDs MUST be allowed to read, create, edit metadata, directly change quantity, adjust stock, and delete `/Productos/{productId}`. Direct quantity edits and deletion MUST remain documented audit and lifecycle limitations.

#### Scenario: Current product workflow
- GIVEN an approved UID and a valid product write
- WHEN it creates, edits, directly changes quantity, adjusts stock, or deletes the product
- THEN the operation is allowed

### Requirement: Immutable Movement History

Approved UIDs MUST be allowed to read and create `/Productos/{productId}/cambiosStock/{movementId}` documents. Movement updates and deletes MUST be denied.

#### Scenario: Read or create movement
- GIVEN an approved UID and a valid movement document
- WHEN it reads movements or creates one
- THEN the operation is allowed

#### Scenario: Alter existing movement
- GIVEN any distributable client targets an existing movement
- WHEN it attempts update or delete
- THEN the operation is denied

### Requirement: Compatible Document Validation

Products MUST contain exactly `nombre`, `cantidad`, and `descripcion`: non-empty string, finite number, and string. Create quantity MUST exceed zero; update quantity MUST be at least zero. New movements MUST contain exactly `productoId`, `numeroFactura`, `fecha`, `tipo`, `stockAnterior`, `stockNuevo`, `descripcion`, and `timestamp`. IDs/text MUST be strings; `productoId` MUST match the parent; `fecha` MUST be `YYYY-MM-DD`; `tipo` MUST be `entrada` or `salida`; stocks MUST be finite and non-negative, with new stock greater for `entrada` and lower for `salida`; `timestamp` MUST be a timestamp. Approved reads MUST support known legacy movement fields and labels.

#### Scenario: Valid current documents
- GIVEN an approved UID submits documents satisfying the product or movement constraints
- WHEN Firestore evaluates the writes
- THEN the writes are allowed

#### Scenario: Invalid shape, type, or range
- GIVEN a write has extra or missing fields, wrong types, invalid stock range or direction, mismatched product ID, or invalid date/type
- WHEN Firestore evaluates it
- THEN the write is denied

#### Scenario: Known legacy movement
- GIVEN stored movement data uses `descipcion`, `timeStamp`, `compra`, or `venta`
- WHEN an approved UID reads it
- THEN the read is allowed without claiming that new writes may use that legacy shape

### Requirement: Predeployment Proof and Secret Exclusion

The policy MUST be emulator-testable before deployment. No service-account, administrator, or signing credential MAY appear in repository or distributable client artifacts.

#### Scenario: Policy verification
- GIVEN the policy is a deployment candidate
- WHEN emulator tests exercise every allow and deny requirement and artifacts are inspected
- THEN deployment proceeds only after tests pass and no privileged credential is present
