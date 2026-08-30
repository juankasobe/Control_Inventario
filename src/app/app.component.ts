import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AccessBlockComponent } from './components/access-block/access-block.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { InstallationAccessService } from './service/installation-access.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, AccessBlockComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'inventario';
  readonly accessState = inject(InstallationAccessService).accessState;
}
