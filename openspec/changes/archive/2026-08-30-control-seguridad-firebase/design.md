# Design: Firebase Device Access Control

## Technical Approach

Add AngularFire anonymous Auth and a root-scoped state machine. `AppComponent` renders navigation and `RouterOutlet` only when approved; otherwise it renders a blocker. Firestore independently enforces default-deny approval.

## Architecture Decisions

| Option | Tradeoff | Decision |
|---|---|---|
| Shell gate vs route guards | Prevents eager route components and Firestore reads from existing | Gate in `AppComponent`; preserve every route |
| Anonymous Auth vs privileged secret | Revocable UID; profile data can be copied | Restore local Auth; sign in anonymously only without a principal |
| `deviceAccess/{uid}` vs embedded permissions | One lookup per operation | Console-managed per-UID record and shared helpers |
| Node runner vs another framework | No extra runner; emulator tooling remains required | `node:test`, `.mjs`, Emulator, `@firebase/rules-unit-testing` |

## Identity and Sequence

```text
App -> Auth: restore principal
alt principal exists: Auth -> AccessService: UID
else none: AccessService -> Auth: signInAnonymously() -> UID
end
AccessService -> Firestore: listen deviceAccess/{UID}
Firestore -> AccessService: missing/status/error
AccessService -> App: pending/approved/revoked/unavailable
alt approved: App -> Navbar: label + Approved + copyable UID
              App -> RouterOutlet: instantiate route
              Route -> Firestore Rules: inventory request + approval lookup
else:         App -> AccessBlock: blocker; no route instance/read
end
```

`InstallationAccessService` starts `initializing` and subscribes only to the current UID record. Restarts reuse the UID; profile loss creates a new pending UID. Missing records map to `pending`; valid records map by status; malformed data or Auth/read failure maps to `unavailable`. Revocation destroys outlet/navbar; listeners use destroy-scoped teardown.

The blocker shows UID, optional label, status, instructions, and copy fallback. When approved, the navbar shows label, “Approved,” and a non-blocking UID reveal/copy control.

## Interfaces / Contracts

`AccessState` is a read-only discriminated signal: `initializing | pending | approved | revoked | unavailable`, with UID, optional label, and instructions/error.

`deviceAccess/{uid}` contains exactly `uid: string`, non-empty `label: string`, and `status: 'pending' | 'approved' | 'revoked'`. Clients may get only their own absent/non-approved record, but cannot list/write. Console administrators write records. Approval requires embedded `uid == request.auth.uid`.

Rules deny unspecified paths. Approved UIDs may read/create/update/delete `Productos/{productId}`. Products contain exactly non-empty `nombre`, finite numeric `cantidad`, and string `descripcion`; create quantity is `> 0`, update `>= 0`. They may read/create `Productos/{productId}/cambiosStock/{movementId}`; update/delete are denied. New movements accept only eight canonical fields and parent-ID, `YYYY-MM-DD`, type, timestamp, stock constraints. Reads preserve legacy `descipcion`, `timeStamp`, `compra`, `venta`. Shared approval/schema helpers minimize rules reads and cover the two-write transaction. Rules cannot restore audit integrity, couple direct edits to movements, or cascade after product deletion.

Before adjustment, `ListarComponent` validates a real canonical `YYYY-MM-DD`, shows inline “Select a valid date” plus toast, and skips invalid transactions. Local year/month/day construction preserves the selected day; rules remain strict.

## File Changes

| Action | Exact files |
|---|---|
| Create (10) | `src/app/interface/installation-access.ts`; `src/app/service/installation-access.service.ts`; `src/app/service/installation-access.service.spec.ts`; `src/app/components/access-block/access-block.component.ts`; `src/app/components/access-block/access-block.component.html`; `src/app/components/access-block/access-block.component.css`; `src/app/components/access-block/access-block.component.spec.ts`; `firestore.rules`; `tests/firestore.rules.test.mjs`; `docs/firebase-device-access.md` |
| Modify: access/shell (7) | `src/app/app.config.ts`; `src/app/app.component.ts`; `src/app/app.component.html`; `src/app/app.component.spec.ts`; `src/app/components/navbar/navbar.component.ts`; `src/app/components/navbar/navbar.component.html`; `src/app/components/navbar/navbar.component.spec.ts` |
| Modify: inventory (5) | `src/app/components/listar/listar.component.ts`; `src/app/components/listar/listar.component.html`; `src/app/components/listar/listar.component.spec.ts`; `src/app/components/movimientos-producto/movimientos-producto.component.ts`; `src/app/components/movimientos-producto/movimientos-producto.component.spec.ts` |
| Modify: tooling/docs (4) | `firebase.json`; `package.json`; `package-lock.json`; `README.md` |

No route, model, inventory service, Electron/Forge, archived artifact, excluded credential, backend, admin UI, App Check, offline mode, environment split, audit redesign, cascade cleanup, or automatic deployment changes.

## Testing Strategy

| Layer | Coverage |
|---|---|
| Karma/Jasmine | All 14 device scenarios; navbar approved identity/UID copy; gate/revocation; empty, malformed, and valid stock dates; listener teardown |
| Emulator | All 11 policy scenarios: untrusted states, self-write/list denial, product CRUD/schema, transaction, movement immutability/schema, legacy reads, default deny |
| Release | Manual packaged Electron check per target OS: stable UID across two `file://` restarts; new pending UID after profile removal/reinstall |

`test:rules` uses `firebase emulators:exec --only firestore` and `node --test`; implementation deploys nothing.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR, executable classification, or process-integration boundary is added to application behavior. Firebase CLI tests are development tooling.

## Migration / Rollout

Capture the unknown deployed rules as an explicitly **unverified legacy snapshot** with text/hash/date; unknown content blocks deployment. Separately version tested staging and final rule snapshots. First deploy staging rules that deny all inventory, permit only authenticated own-record reads, and deny every client allowlist write. While staging remains active, enable anonymous Auth, controlled-launch clients to collect UIDs, audit/delete every pre-existing `deviceAccess` record, and recreate intended approvals only in Firebase Console. Then activate final tested rules and roll out the gated client; no stale record can open inventory and existing installations remain blocked until approved.

Rollback final to staging rules/client gate first. A full legacy rollback may restore the unverified legacy rules and old client only as an acknowledged weaker posture; deleted unverified records are never restored or treated as approvals. Preserve separately audited Console-created records without trusting them under staging.

## Open Questions

None.
