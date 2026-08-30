# Device Access Control Specification

## Purpose

Define installation-level identity and approval gating without human login or changed inventory routes.

## Requirements

### Requirement: Silent Installation Identity

The application MUST obtain an installation UID silently, MUST NOT present human login UI, and MUST retain that identity across ordinary restarts. Reinstallation or local identity loss MUST produce a new pending UID without inheriting authorization.

#### Scenario: First launch
- GIVEN an installation has no restorable identity
- WHEN the application starts
- THEN it obtains a UID without human interaction and enters pending state

#### Scenario: Ordinary restart
- GIVEN an installation has retained local identity
- WHEN the application restarts
- THEN it uses the same UID and resolves its current authorization state

#### Scenario: Reinstall or local-state loss
- GIVEN an installation previously had an approved UID
- WHEN its local identity is removed or the application is reinstalled
- THEN a different UID is obtained in pending state

### Requirement: Explicit Access States

The application MUST expose pending, approved, revoked, and unavailable/error states. It MUST display the UID and a human-readable device name or label when available, plus status and actionable instructions where applicable.

#### Scenario: Pending installation
- GIVEN a UID has no approved authorization
- WHEN access status resolves
- THEN the application displays its UID, pending status, device label when available, and approval instructions

#### Scenario: Revoked installation
- GIVEN the current UID is revoked
- WHEN access status resolves
- THEN the application displays its UID, revoked status, device label, and administrator-contact instructions

#### Scenario: Approved installation
- GIVEN the current UID is approved
- WHEN access status resolves
- THEN the application displays its UID, approved status, and device label

#### Scenario: Authorization unavailable
- GIVEN identity or authorization status cannot be established
- WHEN the application evaluates access
- THEN it displays an unavailable/error state and does not treat the installation as approved

### Requirement: Inventory Gate

The application MUST block inventory access unless state is approved. Before approval and after revocation, it MUST NOT load inventory route data, product forms, products, or movement history.

#### Scenario: Block non-approved access
- GIVEN state is pending, revoked, or unavailable/error
- WHEN any inventory route is opened
- THEN no inventory data, form, product, or movement history is loaded

#### Scenario: Permit approved access
- GIVEN state is approved
- WHEN an inventory route is opened
- THEN the requested existing inventory workflow may load

### Requirement: Administrator-Controlled Lifecycle

Approval and revocation MUST occur manually out of band. An installation MUST NOT approve itself. The first secured rollout MUST treat every existing installation as blocked until its UID is approved.

#### Scenario: Manual approval or revocation
- GIVEN an administrator changes the current UID authorization out of band
- WHEN the application observes the new status
- THEN it transitions to approved or revoked accordingly

#### Scenario: Installation attempts self-approval
- GIVEN the current installation is pending
- WHEN it attempts to approve itself
- THEN approval is refused and state remains pending

#### Scenario: Initial secured rollout
- GIVEN an installation predates device authorization
- WHEN the secured policy first applies
- THEN it remains blocked until an administrator approves its UID

### Requirement: Fail-Closed Compatibility

The application MUST fail closed when approval cannot be proven and MUST NOT promise offline access or token restoration. Approved installations MUST retain `/`, `/agregar`, `/editar/:id`, and `/movimientos/:id` paths and their established workflows.

#### Scenario: Approval cannot be restored
- GIVEN the installation is offline or its identity cannot be restored
- WHEN it attempts to open inventory
- THEN access remains blocked

#### Scenario: Existing route on an approved device
- GIVEN the installation is approved
- WHEN a public inventory route is opened
- THEN the same route path and established workflow remain available
