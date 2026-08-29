import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { Observable, Subject } from 'rxjs';

import { AccessState, DeviceAccessStatus } from '../interface/installation-access';
import { INSTALLATION_ACCESS_RUNTIME, InstallationAccessService } from './installation-access.service';

type TestUser = { uid: string };

class FakeRuntime {
  readonly auth$ = new Subject<TestUser | null>();
  readonly records = new Map<string, Subject<unknown>>();
  readonly accessUids: string[] = [];
  readonly unsubscribedUids: string[] = [];
  signInCalls = 0;
  signInResult: TestUser = { uid: 'fresh-installation' };
  signInError: unknown;

  authState(): Observable<TestUser | null> {
    return this.auth$.asObservable();
  }

  signInAnonymously(): Promise<TestUser> {
    this.signInCalls += 1;
    return this.signInError ? Promise.reject(this.signInError) : Promise.resolve(this.signInResult);
  }

  accessRecord(_firestore: Firestore, uid: string): Observable<unknown> {
    this.accessUids.push(uid);
    const record$ = this.record(uid);
    return new Observable((subscriber) => {
      const subscription = record$.subscribe(subscriber);
      return () => {
        this.unsubscribedUids.push(uid);
        subscription.unsubscribe();
      };
    });
  }

  record(uid: string): Subject<unknown> {
    let record$ = this.records.get(uid);
    if (!record$) {
      record$ = new Subject<unknown>();
      this.records.set(uid, record$);
    }
    return record$;
  }
}

@Component({ standalone: true, template: '', providers: [InstallationAccessService] })
class AccessHostComponent {
  readonly service = inject(InstallationAccessService);
}

describe('InstallationAccessService', () => {
  let runtime: FakeRuntime;

  beforeEach(() => {
    runtime = new FakeRuntime();
    TestBed.configureTestingModule({
      imports: [AccessHostComponent],
      providers: [
        { provide: Auth, useValue: {} },
        { provide: Firestore, useValue: {} },
        { provide: INSTALLATION_ACCESS_RUNTIME, useValue: runtime },
        InstallationAccessService,
      ],
    });
  });

  async function settle(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  }

  function createService(): InstallationAccessService {
    return TestBed.inject(InstallationAccessService);
  }

  function connect(uid: string): { service: InstallationAccessService; record: Subject<unknown> } {
    const service = createService();
    runtime.auth$.next({ uid });
    return { service, record: runtime.record(uid) };
  }

  function access(uid: string, status: DeviceAccessStatus, label = 'Device'): object {
    return { uid, label, status };
  }

  function expectStatus(service: InstallationAccessService, status: AccessState['status'], uid: string | null): void {
    expect(service.accessState()).toEqual(jasmine.objectContaining({ status, uid }));
  }

  it('silently creates a first-launch identity and maps a missing record to pending', async () => {
    const service = createService();
    expectStatus(service, 'initializing', null);
    runtime.auth$.next(null);
    await settle();
    runtime.record('fresh-installation').next(undefined);

    expect(runtime.signInCalls).toBe(1);
    expect(runtime.accessUids).toEqual(['fresh-installation']);
    expectStatus(service, 'pending', 'fresh-installation');
    expect(service.accessState().label).toBeUndefined();
    expect(service.accessState().instructions).toContain('administrador');
  });

  it('uses the returned anonymous identity to resolve an approved record', async () => {
    const service = createService();
    runtime.signInResult = { uid: 'approved-new-installation' };
    runtime.auth$.next(null);
    await settle();
    runtime.record('approved-new-installation').next(access('approved-new-installation', 'approved', 'New office'));

    expectStatus(service, 'approved', 'approved-new-installation');
    expect(service.accessState().label).toBe('New office');
  });

  it('reuses a restored identity across an ordinary restart', () => {
    const { service, record } = connect('restored-installation');
    record.next(access('restored-installation', 'approved', 'Office computer'));

    expect(runtime.signInCalls).toBe(0);
    expectStatus(service, 'approved', 'restored-installation');
    expect(service.accessState().label).toBe('Office computer');
  });

  it('treats reinstall as a new pending identity and stops the old listener', () => {
    const { service, record: oldRecord } = connect('old-installation');
    oldRecord.next(access('old-installation', 'approved', 'Old'));
    runtime.auth$.next({ uid: 'new-installation' });
    runtime.record('new-installation').next(null);
    oldRecord.next(access('old-installation', 'approved', 'Old'));

    expect(runtime.accessUids).toEqual(['old-installation', 'new-installation']);
    expect(runtime.unsubscribedUids).toEqual(['old-installation']);
    expectStatus(service, 'pending', 'new-installation');
  });

  it('reflects manual pending, approval, and revocation changes from its own record', () => {
    const { service, record } = connect('managed-installation');
    record.next(access('managed-installation', 'pending', 'Warehouse'));
    expectStatus(service, 'pending', 'managed-installation');
    record.next(access('managed-installation', 'approved', 'Warehouse'));
    expectStatus(service, 'approved', 'managed-installation');
    record.next(access('managed-installation', 'revoked', 'Warehouse'));

    expectStatus(service, 'revoked', 'managed-installation');
    expect(service.accessState().label).toBe('Warehouse');
    expect(service.accessState().instructions).toContain('administrador');
  });

  it('fails closed for malformed authorization data', () => {
    const { service, record } = connect('current-installation');
    record.next(access('different-installation', 'approved', 'Copied record'));

    expectStatus(service, 'unavailable', 'current-installation');
    expect(service.accessState().error).toContain('inválido');
  });

  it('fails closed when Auth cannot establish an identity', () => {
    const service = createService();
    runtime.auth$.error(new Error('Auth unavailable'));

    expectStatus(service, 'unavailable', null);
    expect(service.accessState().error).toContain('Auth unavailable');
  });

  it('fails closed when an access listener cannot restore approval', () => {
    const { service, record } = connect('offline-installation');
    record.error(new Error('offline'));

    expectStatus(service, 'unavailable', 'offline-installation');
    expect(service.accessState().error).toContain('offline');
  });

  it('keeps a pre-existing installation blocked during the initial secured rollout', () => {
    const { service, record } = connect('legacy-installation');
    record.next(null);

    expectStatus(service, 'pending', 'legacy-installation');
    expect(service.accessState().status).not.toBe('approved');
  });

  it('keeps access unavailable when anonymous identity approval cannot be restored', async () => {
    const service = createService();
    runtime.signInError = new Error('offline approval unavailable');
    runtime.auth$.next(null);
    await settle();

    expect(runtime.signInCalls).toBe(1);
    expectStatus(service, 'unavailable', null);
    expect(service.accessState().error).toContain('offline approval unavailable');
  });

  it('does not expose client approval or token-restoration operations', () => {
    const service = createService() as unknown as Record<string, unknown>;

    expect(service['approve']).toBeUndefined();
    expect(service['approveInstallation']).toBeUndefined();
    expect(service['restoreToken']).toBeUndefined();
    expect(service['restoreAuthToken']).toBeUndefined();
  });

  it('tears down the Auth-to-access listeners with the host injector', () => {
    const fixture = TestBed.createComponent(AccessHostComponent);
    runtime.auth$.next({ uid: 'teardown-installation' });
    fixture.destroy();

    expect(runtime.unsubscribedUids).toEqual(['teardown-installation']);
  });
});
