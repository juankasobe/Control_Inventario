# Delta for Device Access Control

## MODIFIED Requirements

### Requirement: Explicit Access States

The application MUST expose pending, approved, revoked, and unavailable/error states with professional Spanish status and actionable instructions. It MUST show a device label when available and MUST NOT visibly render the UID. A state needing administrator handoff MUST offer copy-only UID access with accessible Spanish feedback; failure MUST leave the UID hidden. Approved identity MUST separate the device label, `Aprobado` badge, and copy action at desktop and narrow widths. Inventory gating, administrator-controlled lifecycle, and fail-closed behavior MUST remain unchanged.

(Previously: States displayed the UID and lacked separated Spanish, copy-only approved identity.)

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
- GIVEN identity or authorization is unavailable
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
