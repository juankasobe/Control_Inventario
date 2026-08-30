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

  it('shows a blocking status and instructions for every non-approved state', () => {
    const cases: Array<{ state: AccessState; status: string }> = [
      { state: { status: 'initializing', uid: null, instructions: 'Verificando.' }, status: 'Verificando' },
      { state: { status: 'pending', uid: 'pending-installation', instructions: 'Pendiente.' }, status: 'Pendiente' },
      { state: { status: 'revoked', uid: 'revoked-installation', instructions: 'Revocado.' }, status: 'revocado' },
      { state: { status: 'unavailable', uid: null, instructions: 'No disponible.', error: 'offline' }, status: 'no disponible' },
    ];

    for (const testCase of cases) {
      const block = render(testCase.state);

      expect(block.querySelector('[data-testid="access-block"]')).not.toBeNull();
      expect(text(block, '[data-testid="access-status"]')).toContain(testCase.status);
      expect(text(block, '[data-testid="access-instructions"]')).toContain('.');
    }
  });

  it('shows the device label, UID, and a copy action when identity is available', () => {
    const block = render({
      status: 'pending',
      uid: 'pending-installation',
      label: 'Caja principal',
      instructions: 'Solicita aprobación.',
    });

    expect(text(block, '[data-testid="access-label"]')).toContain('Caja principal');
    expect(text(block, '[data-testid="access-uid"]')).toContain('pending-installation');
    expect(block.querySelector('[data-testid="copy-uid"]')).not.toBeNull();
  });

  it('uses a safe fallback when no UID is available', () => {
    const block = render({ status: 'initializing', uid: null });

    expect(block.textContent).toContain('No se pudo obtener el UID todavía');
    expect(block.querySelector('[data-testid="copy-uid"]')).toBeNull();
  });

  it('keeps the UID visible for manual copying when clipboard access fails', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    const block = render({
      status: 'revoked',
      uid: 'revoked-installation',
      instructions: 'Contacta al administrador.',
    });

    (block.querySelector('[data-testid="copy-uid"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(text(block, '[data-testid="access-uid"]')).toContain('revoked-installation');
    expect(text(block, '[data-testid="copy-status"]')).toContain('Copiá el UID manualmente');
  });
});
