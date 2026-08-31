import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InstallationAccessService } from '../../service/installation-access.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  menuMovilAbierto = false;
  copyMessage = '';
  readonly accessState = inject(InstallationAccessService).accessState;

  alternarMenuMovil(): void {
    this.menuMovilAbierto = !this.menuMovilAbierto;
  }

  async copiarUid(): Promise<void> {
    const state = this.accessState();
    if (state.status !== 'approved') return;

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable.');
      }

      await navigator.clipboard.writeText(state.uid);
      this.copyMessage = 'UID copiado.';
    } catch {
      this.copyMessage = 'No se pudo copiar el UID. Intentá nuevamente.';
    }
  }
}
