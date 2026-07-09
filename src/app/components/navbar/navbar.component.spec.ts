import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [provideRouter([])],
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
});
