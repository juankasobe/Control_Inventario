import { Routes } from '@angular/router';
import { ListarComponent } from './components/listar/listar.component';
import { AgregarComponent } from './components/agregar/agregar.component';
import { MovimientosProductoComponent } from './components/movimientos-producto/movimientos-producto.component';

export const routes: Routes = [
  { path: '', component: ListarComponent },
  { path: 'agregar', component: AgregarComponent },
  { path: 'editar/:id', component: AgregarComponent },
  { path: 'movimientos/:id', component: MovimientosProductoComponent },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
