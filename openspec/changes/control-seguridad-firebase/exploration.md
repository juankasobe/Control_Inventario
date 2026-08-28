## Exploration: control-seguridad-firebase

### Current State

The application is an Angular 19 standalone renderer packaged as an Electron 36 desktop app. `main.js` creates a `BrowserWindow` with `nodeIntegration: false` and `contextIsolation: true`, has no preload bridge, and loads the Angular bundle from `dist/inventario/browser/index.html`. Firebase is initialized in `src/app/app.config.ts` with a hard-coded web configuration for project `inventario-9863a`, but only the Firebase app and Firestore providers are registered. The committed API key is a public client identifier, not an authorization credential.

The new constraint changes the identity model, not the need for identity: “no human login UI” is compatible with silent Firebase Authentication, while “no authentication” cannot provide a revocable `request.auth.uid` for Firestore rules. The confirmed source posture is:

- No `provideAuth`, `getAuth`, `signInAnonymously`, sign-in flow, current-user state, route guard, role, custom-claims check, or App Check provider exists. The presence of `authDomain` in the client configuration does not establish authentication.
- `@angular/fire` is already a dependency, so the existing standalone provider pattern can accommodate `provideAuth(() => getAuth())` in the renderer. A future device-identity service could set browser-local Auth persistence, wait for the Auth state, call `signInAnonymously()` only when no persisted user exists, and expose `pending`, `approved`, `revoked`, and error states without displaying a human login form.
- Browser-local Auth persistence is a reasonable fit for the current renderer: it should survive normal Electron restarts in the same Chromium profile. However, the app loads from `file://` and does not explicitly manage an Electron profile or `userData` path, so packaged persistence must be tested rather than assumed. Clearing the profile, changing the profile, or a reinstall that removes local data loses the locally stored Auth session. The server-side anonymous account remains, but the client cannot recover its session and a later `signInAnonymously()` creates a new UID. The proportional default should therefore treat reinstall or local-data loss as a new installation requiring approval. Auth storage or refresh-token backups must not be copied to another PC because they would duplicate the approved identity.
- `AppComponent` always renders the navbar and router outlet, and `ListarComponent.ngOnInit()` immediately reads products. A silent-auth design must gate those reads and writes behind Auth initialization and the approval check, either at the app shell or through a route/service barrier. That UI is an enrollment/status screen, not a human login UI. The gate improves behavior, but Firestore rules remain the actual authorization boundary.
- `src/app/service/inventario.service.ts` is the only persistence boundary and calls Firestore directly from the renderer. It reads the entire `Productos` collection, reads individual products and `cambiosStock`, creates products with `setDoc`, updates products with `updateDoc`, deletes product documents with `deleteDoc`, and adjusts stock with a transaction that updates the product and creates a movement document.
- Product writes are client-originated. Form validators and `validateStockAdjustment` provide usability and integrity checks, not security. `AgregarComponent` can send `cantidad` through ordinary `updateProducto`, so an edit can change stock without an audit movement. Movement records have no actor identity and use the renderer's `new Date()` rather than a trusted server timestamp. `deleteProducto` removes only the parent document and has no application-level movement retention policy.
- `firebase.json` is `{}`. No `firestore.rules`, `.firebaserc`, emulator configuration, rules test suite, or Firebase deployment script is tracked. The six existing specs use mocks and service helper instances; they do not prove authentication, allowlist enforcement, deployed rules, emulator behavior, real CRUD permissions, malformed-document handling, or revocation.
- The effective deployed posture cannot be classified as open or secure from this clone: no rules are tracked and no Firebase project/deployment access was supplied. What is proven is that the application establishes no authenticated identity and currently relies on unknown deployed rules for every read and write.

### Affected Areas

- `src/app/app.config.ts` — add the renderer-side Auth provider and future Auth initialization; no privileged credential belongs here.
- `src/app/app.component.ts`, `src/app/app.component.html`, and a future device-identity/status service — wait for silent Auth and approved-device state before rendering inventory routes; display the UID and enrollment state for manual approval.
- `src/app/app.routes.ts`, `src/app/components/navbar/*`, `src/app/components/listar/*`, `src/app/components/agregar/*`, and `src/app/components/movimientos-producto/*` — current routes and component initialization assume access without an identity or approval state.
- `src/app/service/inventario.service.ts` — all product and movement reads/writes, direct quantity edits, transaction authorization assumptions, client-created timestamps, and deletion/lifecycle behavior.
- `firebase.json`, absent `firestore.rules`, and absent `.firebaserc`/emulator assets — define default-deny rules, an administrator-maintained device document keyed by UID, and executable emulator tests without shipping an Admin credential.
- `package.json` and the existing `src/**/*.spec.ts` files — add no implementation now, but they are the current testing seam; unit tests must be complemented by rules/emulator tests for approval, revocation, and unauthorized reads/writes.
- `main.js` and `forge.config.js` — the current hardening is useful but does not protect a packaged renderer from its local user. An OS-vault credential alternative would require a narrowly scoped preload/IPC bridge or another secure provisioning path; the current app has neither.
- `README.md` and release/project configuration — document enrollment, revocation, reinstall behavior, target Firebase environment, and the rule deployment owner. The current README only documents Firestore paths and the client configuration location.

### Approaches

1. **Service-account JSON or another privileged credential per PC** — ship a Firebase Admin/service-account key or equivalent privileged credential with each installer and use it from the renderer.
   - Pros: Little initial application work and no visible login flow.
   - Cons: Reject. A packaged client is inspectable, so the private key is extractable and reusable off-device. Admin/service-account access is intended for trusted servers, bypasses Firestore Security Rules, and can expose far more than one PC's inventory. Per-PC keys increase rotation work but do not make distributable private keys safe; a copied key has a large blast radius and rules cannot contain it.
   - Effort: Low to start, unacceptable security.
   - Limit: Service-account credentials may be used only in a trusted provisioning/deployment service, never in the installer, repository, or renderer.

2. **Anonymous Firebase Auth per installation plus an approved-device allowlist** — silently create or restore one anonymous Auth principal, display its UID for enrollment, and require an administrator-maintained document such as `deviceAccess/{uid}` with `approved: true` before allowing inventory data access.
   - Pros: No human login UI, no reusable password or Admin key distributed to PCs, direct compatibility with the current renderer, and per-UID revocation by changing or removing one allowlist document. Rules can require `request.auth != null`, compare the UID, and default-deny all inventory paths until approval.
   - Cons: The UID represents an installation/Auth profile, not cryptographically attested hardware. A user who can copy the local Auth state can reuse the identity, and reinstall/local-data loss creates a new UID. Anonymous accounts can accumulate and anonymous sign-up can be abused unless approval, monitoring, quotas, and optional App Check are treated as controls rather than identity.
   - Bootstrap and revocation: On first launch the app signs in anonymously and shows the UID plus a pending state. The administrator approves that UID out of band; the client must not write its own approval. A future request after revocation is denied by rules, subject to network/cache limitations.
   - Backup and reinstall: Do not restore Auth tokens as a device backup. Treat a missing local session as a new pending installation; retain Firestore data but require a new approval. Clean up stale anonymous accounts/allowlist records as an operational task.
   - Effort: Low to Medium; the smallest coherent first slice for this project.

3. **Per-device Firebase Auth user with random credentials in the OS credential vault/keychain** — manually provision one Firebase Auth account per PC, retrieve its random credentials through a protected Electron main/preload path, and sign in silently.
   - Pros: A non-anonymous Auth user can be disabled or deleted, and a vault can protect credentials at rest better than renderer local storage. If the vault entry survives a reinstall, the same logical device account can be recovered without copying browser Auth state.
   - Cons: Provisioning, credential rotation, account cleanup, and recovery are required for every PC. The current renderer has no preload/IPC or keychain integration; placing credentials in the installer, source, or ordinary web storage makes them extractable. A local administrator or compromised PC can still retrieve/use the credential, so this is not hardware attestation.
   - Effort: Medium to High; appropriate only if anonymous identities are unacceptable or managed endpoint provisioning already exists.

4. **Custom-token provisioning service with device IDs/claims** — keep Admin SDK signing credentials in a trusted service, issue a token for a registered device UID/claims, and have the desktop client exchange it silently.
   - Pros: Centralizes enrollment, claim issuance, rotation, and policy decisions; rules can inspect authenticated UID/claims without exposing the Admin key.
   - Cons: Requires a new trusted backend, a secure bootstrap identity for the device, issuance/revocation/refresh operations, monitoring, and a failure mode when the service is unavailable. Custom tokens expire after one hour, so token minting/re-provisioning remains an operational dependency. A device ID without a protected bootstrap proof is just a client-supplied label.
   - Effort: High; disproportionate for the current small application and not needed for the first slice.

5. **App Check as defense in depth** — add App Check to reduce unauthorized app-client traffic after identity and Firestore authorization exist.
   - Pros: Can make abuse from non-approved app clients harder and provides an additional backend signal.
   - Cons: It is not a device identity, allowlist, or replacement for Firebase Auth and Firestore rules. Web uses reCAPTCHA providers, which require validation in the packaged Electron context; a custom provider requires a server-side proof exchange. It cannot reliably distinguish an approved PC from a copied/modified client by itself.
   - Effort: Low to Medium as a later layer, but not a solution to the requested per-computer authorization.

### Recommendation

Recommend **option 2: anonymous Firebase Auth per installation plus an administrator-maintained UID allowlist**, with no human login UI and no privileged credential in the client. This is authentication without human identity: the app silently obtains a Firebase Auth principal, while Firestore rules use its UID and an approved-device document to authorize data access. It is the smallest design that can revoke one installation without exposing an Admin credential.

The first slice should be explicitly bounded:

- Configure Auth in the AngularFire renderer and persist the Auth session locally; wait for Auth initialization before any inventory read/write.
- Show the current UID, target project/environment, and `pending`, `approved`, or `revoked` status. Use a manual administrator workflow to create/update the UID allowlist; never allow the client to approve itself.
- Default-deny all `Productos` and `cambiosStock` access unless the request is authenticated and the corresponding allowlist record is approved. Rules must independently constrain paths, fields, types, ranges, and permitted operations; Angular validation and `runTransaction` are not authorization.
- Test the rules in the Firestore emulator with approved, pending, revoked, unauthenticated, malformed, direct-write, and transaction cases. The app shell should avoid normal data reads before approval, but rule tests must remain authoritative.
- For the initial rollout, fail closed when Auth, approval, or Firestore cannot be confirmed and do not promise offline writes. Already downloaded data and a compromised local renderer cannot be retroactively protected by revocation; cache/offline behavior must be tested and documented.
- Decide explicitly whether stock changes are allowed only through the audited transaction, whether movement documents are immutable, and whether product deletion is denied or replaced by an archive/lifecycle policy. Do not silently preserve the current direct-quantity and parent-delete behavior under stricter rules.
- Never place a service-account key, Admin SDK credential, custom-token signing key, or per-PC privileged secret in the installer, repository, Angular bundle, or Electron renderer. App Check may be added later as defense in depth.

This recommendation provides one logical identity per installation/profile, not a guaranteed one-physical-PC identity. If the owner requires an identity that survives local Auth-data loss or rejects anonymous accounts, option 3 is the proportional fallback, but it adds secure provisioning and Electron vault integration. A stronger fleet identity through option 4 is a later architecture, not a first slice.

### Risks

- **Unknown deployed authorization (critical):** the repository cannot prove which rules are deployed. A permissive production database remains possible, but it is not a source-confirmed fact; deployment access and emulator evidence are still required.
- **Install identity is not hardware attestation:** anonymous UIDs and local Auth tokens can be copied by a local attacker, and one PC can have multiple profiles/identities. The allowlist limits normal requests but cannot defend a compromised host or data already downloaded.
- **Reinstall and revocation behavior:** local-data loss creates a new UID and requires manual reapproval. Revocation affects future server-authorized requests, not data already displayed or copied; offline/cache policy must fail closed or be explicitly bounded.
- **Bootstrap misconfiguration:** if a client can write its own allowlist record, or if rules check only `request.auth != null` without the approved document, every anonymous account becomes authorized. Emulator tests must cover the default-deny path and allowlist self-write denial.
- **Renderer trust boundary:** Electron hardening prevents easy Node access but does not prevent inspection or modification of a packaged Angular bundle. Client validation, client timestamps, and client-supplied movement fields cannot establish audit integrity without rules or a trusted service.
- **Legacy/data lifecycle compatibility:** strict field validation may reject malformed or legacy documents, while parent deletion can leave movement subcollections. Migration, opening balances, movement retention, and archive behavior need an explicit policy.
- **Packaged runtime uncertainty:** Auth persistence and anonymous sign-in have not been exercised in the `file://` Electron package, and no runtime/emulator harness is present. This is a verification task, not evidence that silent Auth will fail.
- **Abuse and operational load:** anonymous sign-up can create stale accounts or consume quotas. Manual approval, monitoring, rate/abuse controls, optional App Check, and stale-account cleanup are required limitations of this model.
- **CodeGraph constraint:** `.codegraph/` exists but is empty/unusable. No initialization was performed because the project constraint forbids creating an index; findings were confirmed through direct source inspection.

### Ready for Proposal

Yes, conditionally. The technical direction is now concrete enough for `sdd-propose`: **silent anonymous Auth + per-UID administrator approval + default-deny emulator-tested rules**, with no human login UI and no service-account key. The proposal should carry these exact remaining product/operational choices rather than reopening the identity exploration:

1. **Identity acceptance and approval owner:** accept an anonymous UID as the installation identity, and confirm that an administrator can approve/revoke it out of band (for example, Firebase Console or a trusted admin tool). Recommended default: all approved installations share one inventory policy; no human roles in this slice.
2. **Reinstall policy:** confirm that clearing local data or reinstalling creates a new pending UID requiring approval, with no Auth-token backup/restore. If continuity across reinstall is mandatory, stop and choose the OS-vault credential approach instead.
3. **Initial Firestore permissions:** confirm that an approved device may read all products and movement history, create/edit product metadata, and adjust stock only through an audited transaction. Recommended defaults: movement update/delete denied; direct quantity edits denied; product deletion denied until archive/retention behavior is chosen.
4. **Connectivity and target ownership:** confirm fail-closed/online-only behavior for the first slice, the target Firebase project (`inventario-9863a` or a separate environment), and the administrator responsible for rules deployment and emulator/CI verification.

Once those choices are confirmed, proceed to `sdd-propose`; do not create a proposal or implementation as part of this corrective exploration.
