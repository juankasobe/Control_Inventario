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
      pending: 'Pendiente de aprobación',
      approved: 'Approved',
      revoked: 'Acceso revocado',
      unavailable: 'Acceso no disponible',
    };

    return labels[this.accessState().status];
  }

  get instructions(): string {
    return this.accessState().instructions ?? 'No se pudo obtener el UID todavía.';
  }

  async copyUid(): Promise<void> {
    const uid = this.accessState().uid;
    if (!uid) return;

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(uid);
        this.copyMessage = 'UID copiado';
        return;
      } catch {
        // Keep the UID visible so it can be copied manually.
      }
    }

    this.copyMessage = 'Copiá el UID manualmente.';
  }
}
