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
  uidVisible = false;
  copyMessage = '';
  readonly accessState = inject(InstallationAccessService).accessState;

  alternarMenuMovil(): void {
    this.menuMovilAbierto = !this.menuMovilAbierto;
  }

  revelarUid(): void {
    this.uidVisible = true;
  }

  async copiarUid(): Promise<void> {
    const state = this.accessState();
    if (state.status !== 'approved') return;

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(state.uid);
        this.copyMessage = 'UID copiado';
        return;
      } catch {
        // Keep the UID visible so it can be copied manually.
      }
    }

    this.copyMessage = 'Copiá el UID manualmente.';
  }
}
