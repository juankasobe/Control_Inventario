import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { InventarioService } from '../../service/inventario.service';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Inventario } from '../../interface/inventario';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';

@Component({
  selector: 'app-agregar',
  imports: [CommonModule, ReactiveFormsModule,SweetAlert2Module],
  templateUrl: './agregar.component.html',
  styleUrl: './agregar.component.css',
})
export class AgregarComponent {
  agregarProductoForm: FormGroup;
  producto: Inventario | undefined;
  loading = signal(false);
  mostarBotonBorrar = false;
  private toastr: ToastrService = inject(ToastrService);
  id = input.required<string>();
  constructor(
    private formBuilder: FormBuilder,
    private inventarioService: InventarioService,
    private router: Router
  ) {
    this.agregarProductoForm = this.formBuilder.group({
      idN: ['', Validators.required],
      nombre: ['', Validators.required],
      cantidad: ['', [Validators.required, Validators.min(1)]],
      descripcion: [''],
    });
    effect(() => {
      const id = this.id();
      if (id) {
        this.getProducto(id);
        this.mostarBotonBorrar = true;
        this.agregarProductoForm.get('idN')?.disable();
      } else {
        this.agregarProductoForm.get('idN')?.enable();
      }
    });
  }

  async getProducto(id: string) {
    
    const idProductoSnapShot = await this.inventarioService.getProductoId(id);
    if (!idProductoSnapShot.exists()) return;
    const producto = idProductoSnapShot.data() as Inventario;
    this.agregarProductoForm.patchValue({
      idN: id,
      nombre: producto.nombre,
      cantidad: producto.cantidad,
      descripcion: producto.descripcion,
    });
  }
  async agregarProducto() {
    if (this.agregarProductoForm.invalid) {
      this.toastr.error('Formulario invalido');
      console.log('Formulario invalido');
      return;
    }
    try {
      this.loading.set(true);
      const idNuevo = this.agregarProductoForm.get('idN')?.value;
      const producto = {
        nombre: this.agregarProductoForm.get('nombre')?.value,
        cantidad: this.agregarProductoForm.get('cantidad')?.value,
        descripcion: this.agregarProductoForm.get('descripcion')?.value,
      };
      const id = this.id();
      if (id) {
        await this.inventarioService.updateProducto(producto, id);
        this.router.navigate(['/']);
      } else {
        await this.inventarioService.createProducto(producto, idNuevo);
        console.log('Producto agregado:', producto);
        this.agregarProductoForm.reset();
      }
      this.toastr.success(
        `Producto ${id ? 'Actualizado' : 'Creado'} correctamente`
      );
    } catch (error) {
      this.toastr.success('Producto No agregado');
      console.error('Error al agregar el producto:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async eliminarProducto() {
    const id = this.id();
    if (id) {
      this.inventarioService.deleteProducto(id);
      this.toastr.success('Producto eliminado correctamente');
      this.router.navigate(['/']);
      console.log('Producto eliminado.');
    } else {
      this.toastr.error('No se pudo eliminar el producto');
    }
  }
}
