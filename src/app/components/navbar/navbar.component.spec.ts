import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AccessState } from '../../interface/installation-access';
import { InstallationAccessService } from '../../service/installation-access.service';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  const accessState = signal<AccessState>({
    status: 'approved',
    uid: 'approved-installation',
    label: 'Oficina',
  });

  beforeEach(async () => {
    accessState.set({
      status: 'approved',
      uid: 'approved-installation',
      label: 'Oficina',
    });
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        {
          provide: InstallationAccessService,
          useValue: { accessState: accessState.asReadonly() },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('uses the exact product brand in the navbar', () => {
    const brand = fixture.nativeElement.querySelector('nav a span') as HTMLElement;

    expect(brand.textContent?.trim()).toBe('Control Inventario');
  });

  it('keeps the mobile menu collapsed until the user opens it', () => {
    const toggle = fixture.nativeElement.querySelector('[data-testid="mobile-menu-toggle"]') as HTMLButtonElement;
    const menu = fixture.nativeElement.querySelector('[data-testid="mobile-menu"]') as HTMLElement;

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(menu.getAttribute('aria-hidden')).toBe('true');

    toggle.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(menu.getAttribute('aria-hidden')).toBe('false');
  });

  it('collapses the mobile menu again when the user toggles it closed', () => {
    const toggle = fixture.nativeElement.querySelector('[data-testid="mobile-menu-toggle"]') as HTMLButtonElement;
    const menu = fixture.nativeElement.querySelector('[data-testid="mobile-menu"]') as HTMLElement;

    toggle.click();
    fixture.detectChanges();
    toggle.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(menu.getAttribute('aria-hidden')).toBe('true');
  });

  it('separates the approved identity label, status, and copy action without exposing the UID', () => {
    const identity = fixture.nativeElement.querySelector('[data-testid="approved-identity"]') as HTMLElement;
    const label = identity.querySelector('[data-testid="approved-label"]') as HTMLElement;
    const status = identity.querySelector('[data-testid="approved-status"]') as HTMLElement;
    const copy = identity.querySelector('[data-testid="copy-uid"]') as HTMLButtonElement;

    expect(label.textContent?.trim()).toBe('Dispositivo: Oficina');
    expect(status.textContent?.trim()).toBe('Aprobado');
    expect(copy.textContent?.trim()).toBe('Copiar UID');
    expect(identity.textContent).not.toContain('approved-installation');
    expect(identity.querySelector('[data-testid="approved-uid"]')).toBeNull();
    expect(identity.querySelector('[data-testid="reveal-uid"]')).toBeNull();
  });

  it('announces successful UID copying without rendering the UID', async () => {
    const writeText = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const copy = fixture.nativeElement.querySelector('[data-testid="copy-uid"]') as HTMLButtonElement;

    copy.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(writeText).toHaveBeenCalledOnceWith('approved-installation');
    expectCopyStatus(fixture.nativeElement, 'UID copiado.');
    expect(fixture.nativeElement.textContent).not.toContain('approved-installation');
    expect(fixture.nativeElement.querySelector('[data-testid="approved-uid"]')).toBeNull();
  });

  it('announces rejection or unavailable clipboard without a visible UID fallback', async () => {
    const writeText = jasmine.createSpy('writeText').and.returnValue(Promise.reject(new Error('denied')));
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const copy = fixture.nativeElement.querySelector('[data-testid="copy-uid"]') as HTMLButtonElement;

    copy.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expectCopyStatus(fixture.nativeElement, 'No se pudo copiar el UID. Intentá nuevamente.');

    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    copy.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expectCopyStatus(fixture.nativeElement, 'No se pudo copiar el UID. Intentá nuevamente.');
    expect(fixture.nativeElement.textContent).not.toContain('approved-installation');
    expect(fixture.nativeElement.querySelector('[data-testid="approved-uid"]')).toBeNull();
  });
});

function expectCopyStatus(block: HTMLElement, message: string): void {
  const status = block.querySelector('[data-testid="copy-status"]') as HTMLElement;
  expect(status.textContent?.trim()).toBe(message);
  expect(status.getAttribute('role')).toBe('status');
  expect(status.getAttribute('aria-live')).toBe('polite');
}
