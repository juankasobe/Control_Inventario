import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccessState } from '../../interface/installation-access';
import { AccessBlockComponent } from './access-block.component';

describe('AccessBlockComponent', () => {
  let fixture: ComponentFixture<AccessBlockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccessBlockComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AccessBlockComponent);
  });

  function render(state: AccessState): HTMLElement {
    fixture.componentRef.setInput('accessState', state);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function text(block: HTMLElement, selector: string): string {
    return (block.querySelector(selector) as HTMLElement).textContent ?? '';
  }

  it('uses exact Spanish status labels for every access state', () => {
    const cases: Array<{ state: AccessState; status: string }> = [
      { state: { status: 'initializing', uid: null, instructions: 'Verificando.' }, status: 'Verificando acceso' },
      { state: { status: 'pending', uid: 'pending-installation', instructions: 'Pendiente.' }, status: 'Pendiente' },
      { state: { status: 'approved', uid: 'approved-installation', label: 'Oficina' }, status: 'Aprobado' },
      { state: { status: 'revoked', uid: 'revoked-installation', instructions: 'Revocado.' }, status: 'Revocado' },
      { state: { status: 'unavailable', uid: null, instructions: 'No disponible.', error: 'offline' }, status: 'Acceso no disponible' },
    ];

    for (const testCase of cases) {
      const block = render(testCase.state);

      expect(block.querySelector('[data-testid="access-block"]')).not.toBeNull();
      expect(text(block, '[data-testid="access-status"]')).toBe(`Estado: ${testCase.status}`);
      if (testCase.state.instructions) {
        expect(text(block, '[data-testid="access-instructions"]')).toBe(testCase.state.instructions);
      }
    }
  });

  it('keeps identity private and offers copy only for handoff states', () => {
    const cases: Array<{ state: AccessState; canCopy: boolean }> = [
      { state: { status: 'initializing', uid: null, instructions: 'Verificando.' }, canCopy: false },
      { state: { status: 'pending', uid: 'pending-installation', label: 'Caja principal', instructions: 'Solicita aprobación.' }, canCopy: true },
      { state: { status: 'revoked', uid: 'revoked-installation', instructions: 'Contacta al administrador.' }, canCopy: true },
      { state: { status: 'unavailable', uid: 'unavailable-installation', instructions: 'Reintentá.', error: 'offline' }, canCopy: true },
    ];

    for (const testCase of cases) {
      const block = render(testCase.state);

      expect(Boolean(block.querySelector('[data-testid="copy-uid"]'))).toBe(testCase.canCopy);
      if (testCase.state.uid) expect(block.textContent).not.toContain(testCase.state.uid);
      expect(block.querySelector('[data-testid="access-uid"]')).toBeNull();
      expect(block.querySelector('[data-testid="uid-fallback"]')).toBeNull();
    }

    expect(text(render(cases[1].state), '[data-testid="access-label"]')).toBe('Dispositivo: Caja principal');
  });

  it('announces successful UID copying while keeping the UID hidden', async () => {
    const writeText = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const block = render({
      status: 'revoked',
      uid: 'revoked-installation',
      instructions: 'Contacta al administrador.',
    });

    (block.querySelector('[data-testid="copy-uid"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(writeText).toHaveBeenCalledOnceWith('revoked-installation');
    expectCopyStatus(block, 'UID copiado.');
    expect(block.textContent).not.toContain('revoked-installation');
  });

  it('announces clipboard failure without revealing the UID', async () => {
    const writeText = jasmine.createSpy('writeText').and.returnValue(Promise.reject(new Error('denied')));
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const block = render({
      status: 'pending',
      uid: 'pending-installation',
      instructions: 'Solicita aprobación.',
    });

    (block.querySelector('[data-testid="copy-uid"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expectCopyStatus(block, 'No se pudo copiar el UID. Intentá nuevamente.');
    expect(block.textContent).not.toContain('pending-installation');
    expect(block.querySelector('[data-testid="access-uid"]')).toBeNull();
  });
});

function expectCopyStatus(block: HTMLElement, message: string): void {
  const status = block.querySelector('[data-testid="copy-status"]') as HTMLElement;
  expect(status.textContent?.trim()).toBe(message);
  expect(status.getAttribute('role')).toBe('status');
  expect(status.getAttribute('aria-live')).toBe('polite');
}
