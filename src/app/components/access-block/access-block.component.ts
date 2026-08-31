import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

import { AccessState } from '../../interface/installation-access';

@Component({
  selector: 'app-access-block',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './access-block.component.html',
  styleUrl: './access-block.component.css',
})
export class AccessBlockComponent {
  readonly accessState = input.required<AccessState>();
  copyMessage = '';

  get statusLabel(): string {
    const labels: Record<AccessState['status'], string> = {
      initializing: 'Verificando acceso',
      pending: 'Pendiente',
      approved: 'Aprobado',
      revoked: 'Revocado',
      unavailable: 'Acceso no disponible',
    };

    return labels[this.accessState().status];
  }

  get canCopyUid(): boolean {
    const state = this.accessState();
    return Boolean(state.uid) && (state.status === 'pending' || state.status === 'revoked' || state.status === 'unavailable');
  }

  get instructions(): string {
    return this.accessState().instructions ?? 'No se pudo obtener el UID todavía.';
  }

  async copyUid(): Promise<void> {
    const uid = this.accessState().uid;
    if (!uid || !this.canCopyUid) return;

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable.');
      }

      await navigator.clipboard.writeText(uid);
      this.copyMessage = 'UID copiado.';
    } catch {
      this.copyMessage = 'No se pudo copiar el UID. Intentá nuevamente.';
    }
  }
}
