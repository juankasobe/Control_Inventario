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

  it('shows the approved label and status', () => {
    const identity = fixture.nativeElement.querySelector('[data-testid="approved-identity"]') as HTMLElement;

    expect(identity.textContent).toContain('Oficina');
    expect(identity.textContent).toContain('Approved');
  });

  it('reveals and copies the approved UID', async () => {
    const writeText = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const reveal = fixture.nativeElement.querySelector('[data-testid="reveal-uid"]') as HTMLButtonElement;

    reveal.click();
    fixture.detectChanges();
    const uid = fixture.nativeElement.querySelector('[data-testid="approved-uid"]') as HTMLElement;
    const copy = fixture.nativeElement.querySelector('[data-testid="copy-uid"]') as HTMLButtonElement;
    copy.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(uid.textContent).toContain('approved-installation');
    expect(writeText).toHaveBeenCalledWith('approved-installation');
    expect(fixture.nativeElement.querySelector('[data-testid="copy-status"]').textContent).toContain('copiado');
  });

  it('keeps the UID available for manual copying when the clipboard is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    const reveal = fixture.nativeElement.querySelector('[data-testid="reveal-uid"]') as HTMLButtonElement;

    reveal.click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[data-testid="copy-uid"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="approved-uid"]').textContent).toContain('approved-installation');
    expect(fixture.nativeElement.querySelector('[data-testid="copy-status"]').textContent).toContain('Copiá el UID manualmente');
  });
});
