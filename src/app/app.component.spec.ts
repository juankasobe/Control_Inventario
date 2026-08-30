import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { AccessState } from './interface/installation-access';
import { InstallationAccessService } from './service/installation-access.service';

@Component({
  standalone: true,
  template: '<p data-testid="approved-route">Approved inventory route</p>',
})
class ApprovedRouteComponent {}

describe('AppComponent', () => {
  const accessState = signal<AccessState>({
    status: 'pending',
    uid: 'pending-installation',
    instructions: 'Solicita aprobación.',
  });

  beforeEach(async () => {
    accessState.set({
      status: 'pending',
      uid: 'pending-installation',
      instructions: 'Solicita aprobación.',
    });
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([
          { path: '', component: ApprovedRouteComponent },
          { path: 'agregar', component: ApprovedRouteComponent },
          { path: 'editar/:id', component: ApprovedRouteComponent },
          { path: 'movimientos/:id', component: ApprovedRouteComponent },
        ]),
        {
          provide: InstallationAccessService,
          useValue: { accessState: accessState.asReadonly() },
        },
      ],
    }).compileComponents();
  });

  function createFixture(): ComponentFixture<AppComponent> {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'inventario' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('inventario');
  });

  it('blocks every non-approved state before loading the inventory shell', () => {
    const blockedStates: AccessState[] = [
      { status: 'initializing', uid: null, instructions: 'Verificando.' },
      { status: 'pending', uid: 'pending-installation', instructions: 'Pendiente.' },
      { status: 'revoked', uid: 'revoked-installation', instructions: 'Revocado.' },
      { status: 'unavailable', uid: null, instructions: 'No disponible.', error: 'offline' },
    ];

    for (const state of blockedStates) {
      accessState.set(state);
      const fixture = createFixture();
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.querySelector('app-access-block')).not.toBeNull();
      expect(compiled.querySelector('app-navbar')).toBeNull();
      expect(compiled.querySelector('router-outlet')).toBeNull();
      fixture.destroy();
    }
  });

  it('permits approved access and keeps an existing route available', async () => {
    accessState.set({ status: 'approved', uid: 'approved-installation', label: 'Oficina' });
    const fixture = createFixture();
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/agregar');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-navbar')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="approved-route"]')).not.toBeNull();
    fixture.destroy();
  });

  it('preserves the established inventory route paths', () => {
    expect(routes.slice(0, 4).map((route) => route.path)).toEqual([
      '',
      'agregar',
      'editar/:id',
      'movimientos/:id',
    ]);
  });

  it('tears down approved navigation when access is revoked live', async () => {
    accessState.set({ status: 'approved', uid: 'approved-installation', label: 'Oficina' });
    const fixture = createFixture();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/agregar');
    fixture.detectChanges();

    accessState.set({
      status: 'revoked',
      uid: 'approved-installation',
      label: 'Oficina',
      instructions: 'Contacta al administrador.',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-access-block')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="approved-route"]')).toBeNull();
    fixture.destroy();
  });
});
