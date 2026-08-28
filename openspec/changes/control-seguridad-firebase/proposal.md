# Proposal: Firebase Device Access Control

## Intent

Protect inventory with revocable installation access and no human login. Deployed Firestore rules remain a verified uncertainty; establish testable default-deny authorization without claiming full audit integrity.

## Scope

### In Scope
- Initialize silent anonymous Firebase Auth per installation/profile and gate inventory loading by access status.
- Fully block pending/revoked devices with UID, human-readable label, and instructions.
- Add an administrator-only UID allowlist and default-deny rules; clients cannot write allowlist records.
- Approved devices read products/movements; create/edit/delete products, including direct quantity changes; adjust stock; and create movements. Deny movement update/delete.
- Test rules in the Firebase Emulator and document deployment to `inventario-9863a`, enrollment, revocation, reinstall, and rollback.
- Exclude service-account/Admin/signing keys and per-PC privileged secrets from installers, repository, bundles, renderer, and web storage.

### Out of Scope
- Human login/roles, admin UI, custom-token backend, OS-vault credentials, or trusted mutations.
- App Check (later defense in depth, not identity), Storage security, offline support, environment split, or token backup/restore.
- Full audit redesign, quantity-edit removal, product archive/cascade cleanup, or movement lifecycle repair.

## Capabilities

### New Capabilities
- `device-access-control`: Silent installation identity, approval gating, and pending/approved/revoked UX.
- `firestore-authorization-policy`: Default-deny device allowlisting and operation-level product/movement permissions.

### Modified Capabilities
- None. `safe-product-routing` paths and outcomes remain unchanged after approval.

## Approach

Restore/create anonymous Auth, observe the administrator-managed device record, and fail closed until approval. Validate rules locally before manual deployment. Reinstall/local-data loss creates a new UID requiring approval.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `src/app/app.config.ts`, `src/app/app.component.*`, `src/app/service/` | Modified/New | Auth, identity state, gate |
| `firestore.rules`, `firebase.json`, rule tests | New/Modified | Policy and verification |
| `README.md` | Modified | Operations guidance |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Unknown rules or rollout blocks existing installations | High | Capture current rules, emulator-test, approve each UID |
| Copied Auth state impersonates an installation | Medium | Document; revoke UID; protect secrets |
| Direct quantity edits and product deletion leave audit/lifecycle gaps | High | State limitation; defer redesign |

## Rollback Plan

Export current verified rules before deployment. On failure, redeploy them and revert client gating/Auth, restoring the potentially weaker prior posture. Preserve inventory and allowlist records.

## Dependencies

- Anonymous Auth, Firebase CLI/emulator, deployment access, and an approval administrator.

## Success Criteria

- [ ] Pending, revoked, and unauthenticated devices cannot load inventory routes/data/forms; approved devices preserve public workflows.
- [ ] Emulator tests prove self-write denial, product permissions, movement read/create, and update/delete denial.
- [ ] Deployment and rollback require no client-side privileged secret.
