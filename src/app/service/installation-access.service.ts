import { DestroyRef, inject, Injectable, InjectionToken, Signal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth, authState, signInAnonymously, User } from '@angular/fire/auth';
import { doc, docSnapshots, Firestore } from '@angular/fire/firestore';
import { map, Observable, Subscription } from 'rxjs';

import { AccessState, DeviceAccessRecord } from '../interface/installation-access';

type InstallationUser = Pick<User, 'uid'>;
export interface InstallationAccessRuntime {
  authState(auth: Auth): Observable<InstallationUser | null>;
  signInAnonymously(auth: Auth): Promise<InstallationUser>;
  accessRecord(firestore: Firestore, uid: string): Observable<unknown>;
}
function createInstallationAccessRuntime(): InstallationAccessRuntime {
  return {
    authState: (auth) => authState(auth),
    signInAnonymously: async (auth) => (await signInAnonymously(auth)).user,
    accessRecord: (firestore, uid) => docSnapshots(doc(firestore, `deviceAccess/${uid}`)).pipe(
      map((snapshot) => (snapshot.metadata.fromCache || !snapshot.exists() ? null : snapshot.data()))
    ),
  };
}
export const INSTALLATION_ACCESS_RUNTIME = new InjectionToken<InstallationAccessRuntime>(
  'INSTALLATION_ACCESS_RUNTIME',
  { providedIn: 'root', factory: createInstallationAccessRuntime }
);
const INITIALIZING_INSTRUCTIONS = 'Verificando el acceso de la instalación.';
const PENDING_INSTRUCTIONS = 'Solicita al administrador que apruebe esta instalación.';
const REVOKED_INSTRUCTIONS = 'Contacta al administrador para recuperar el acceso.';
const UNAVAILABLE_INSTRUCTIONS = 'No se pudo verificar el acceso. Comprueba la conexión e inténtalo de nuevo.';
const INVALID_RECORD_ERROR = 'El registro de acceso es inválido.';
const INITIAL_STATE: AccessState = { status: 'initializing', uid: null, instructions: INITIALIZING_INSTRUCTIONS };

@Injectable({ providedIn: 'root' })
export class InstallationAccessService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);
  private readonly runtime = inject(INSTALLATION_ACCESS_RUNTIME);
  private readonly destroyRef = inject(DestroyRef);
  private readonly state = signal<AccessState>(INITIAL_STATE);
  private accessSubscription?: Subscription;
  private activeUid?: string;
  private signInPending = false;

  readonly accessState: Signal<AccessState> = this.state.asReadonly();

  constructor() {
    try {
      this.runtime.authState(this.auth).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (user) => this.handleAuthUser(user),
        error: (error) => this.handleAuthFailure(error),
      });
    } catch (error) {
      this.handleAuthFailure(error);
    }
  }

  private handleAuthUser(user: InstallationUser | null): void {
    if (user === null) return this.startAnonymousSignIn();
    if (typeof user.uid !== 'string' || user.uid.length === 0) {
      return this.handleAuthFailure(new Error('Identity UID is missing.'));
    }
    this.signInPending = false;
    this.listenToAccess(user.uid);
  }

  private startAnonymousSignIn(): void {
    this.stopAccessListener();
    this.state.set(INITIAL_STATE);
    if (this.signInPending) return;
    this.signInPending = true;
    void Promise.resolve()
      .then(() => this.runtime.signInAnonymously(this.auth))
      .then(
        (user) => {
          this.signInPending = false;
          this.handleAuthUser(user);
        },
        (error) => {
          this.signInPending = false;
          this.setUnavailable(null, error);
        }
      );
  }

  private listenToAccess(uid: string): void {
    if (this.activeUid === uid && this.accessSubscription && !this.accessSubscription.closed) return;
    this.stopAccessListener();
    this.activeUid = uid;
    this.state.set({ status: 'initializing', uid, instructions: INITIALIZING_INSTRUCTIONS });
    try {
      this.accessSubscription = this.runtime.accessRecord(this.firestore, uid)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (record) => this.applyAccessRecord(uid, record),
          error: (error) => this.handleAccessFailure(uid, error),
        });
    } catch (error) {
      this.handleAccessFailure(uid, error);
    }
  }

  private applyAccessRecord(uid: string, record: unknown): void {
    if (record === null || record === undefined) {
      this.state.set({ status: 'pending', uid, instructions: PENDING_INSTRUCTIONS });
      return;
    }
    if (!this.isValidRecord(record, uid)) {
      this.setUnavailable(uid, new Error(INVALID_RECORD_ERROR));
      return;
    }
    if (record.status === 'approved') {
      this.state.set({ status: 'approved', uid, label: record.label });
      return;
    }
    this.state.set({
      status: record.status,
      uid,
      label: record.label,
      instructions: record.status === 'pending' ? PENDING_INSTRUCTIONS : REVOKED_INSTRUCTIONS,
    });
  }

  private isValidRecord(record: unknown, uid: string): record is DeviceAccessRecord {
    if (!record || typeof record !== 'object' || Array.isArray(record)) return false;
    if (Object.keys(record).sort().join(',') !== 'label,status,uid') return false;
    const candidate = record as DeviceAccessRecord;
    return candidate.uid === uid && typeof candidate.label === 'string' && candidate.label.trim().length > 0 &&
      (candidate.status === 'pending' || candidate.status === 'approved' || candidate.status === 'revoked');
  }

  private handleAuthFailure(error: unknown): void {
    this.stopAccessListener();
    this.setUnavailable(null, error);
  }

  private handleAccessFailure(uid: string, error: unknown): void {
    this.stopAccessListener();
    this.setUnavailable(uid, error);
  }

  private setUnavailable(uid: string | null, error: unknown): void {
    this.state.set({
      status: 'unavailable',
      uid,
      instructions: UNAVAILABLE_INSTRUCTIONS,
      error: error instanceof Error && error.message ? error.message : UNAVAILABLE_INSTRUCTIONS,
    });
  }

  private stopAccessListener(): void {
    this.accessSubscription?.unsubscribe();
    this.accessSubscription = undefined;
    this.activeUid = undefined;
  }
}
