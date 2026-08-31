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

The application MUST expose pending, approved, revoked, and unavailable/error states with professional Spanish status and actionable instructions. It MUST show a device label when available and MUST NOT visibly render the UID. A state needing administrator handoff MUST offer copy-only UID access with accessible Spanish feedback; failure MUST leave the UID hidden. Approved identity MUST separate the device label, `Aprobado` badge, and copy action at desktop and narrow widths. Inventory gating, administrator-controlled lifecycle, and fail-closed behavior MUST remain unchanged.

#### Scenario: Pending installation
- GIVEN a UID lacks approval
- WHEN status resolves
- THEN `Pendiente`, available label, instructions, and copy action appear without the UID

#### Scenario: Revoked installation
- GIVEN the UID is revoked
- WHEN status resolves
- THEN `Revocado`, label, administrator instructions, and copy action appear without the UID

#### Scenario: Approved installation
- GIVEN the UID is approved
- WHEN status renders at desktop or narrow width
- THEN separate label, `Aprobado` badge, and copy action appear without the UID

#### Scenario: Authorization unavailable
- GIVEN identity or authorization status cannot be established
- WHEN access is evaluated
- THEN Spanish error status appears, available UID is copy-only, and approval is denied

#### Scenario: Clipboard copy succeeds
- GIVEN a copy-only action is available
- WHEN clipboard copying succeeds
- THEN accessible Spanish success feedback is announced and the UID stays hidden

#### Scenario: Clipboard copy fails
- GIVEN a copy-only action is available
- WHEN clipboard copying fails
- THEN accessible Spanish failure feedback is announced and the UID stays hidden

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
