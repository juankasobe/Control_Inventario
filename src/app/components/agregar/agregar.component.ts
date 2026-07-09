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

@Component({
  selector: 'app-agregar',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './agregar.component.html',
  styleUrl: './agregar.component.css',
})
export class AgregarComponent {
  agregarProductoForm: FormGroup;
  producto: Inventario | undefined;
  loading = signal(false);
  eliminando = signal(false);
  mensajeFormulario = signal('');
  submitted = false;
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
        this.agregarProductoForm.get('idN')?.disable();
      } else {
        this.producto = undefined;
        this.agregarProductoForm.get('idN')?.enable();
      }
    });
  }

  get modoEdicion() {
    return Boolean(this.id());
  }

  get tituloFormulario() {
    return this.modoEdicion ? 'Editar producto' : 'Agregar producto';
  }

  get textoAyudaFormulario() {
    if (!this.modoEdicion) {
      return 'Cargá los datos para crear un producto nuevo.';
    }

    return `Actualizá los datos de ${this.nombreProductoActual}.`;
  }

  get textoBotonGuardar() {
    if (this.loading()) {
      return 'Guardando...';
    }

    return this.modoEdicion ? 'Guardar cambios' : 'Crear producto';
  }

  get nombreProductoActual() {
    return this.agregarProductoForm.get('nombre')?.value || this.producto?.nombre || 'este producto';
  }

  campoInvalido(nombreCampo: string) {
    const campo = this.agregarProductoForm.get(nombreCampo);
    return Boolean(campo?.invalid && (this.submitted || campo.touched));
  }

  mensajeErrorCampo(nombreCampo: string) {
    const campo = this.agregarProductoForm.get(nombreCampo);

    if (campo?.hasError('required')) {
      const mensajes: Record<string, string> = {
        idN: 'Ingresá un ID',
        nombre: 'Ingresá el nombre del producto',
        cantidad: 'Ingresá una cantidad mayor a cero',
      };

      return mensajes[nombreCampo] || 'Completá este campo';
    }

    if (campo?.hasError('min')) {
      return 'Ingresá una cantidad mayor a cero';
    }

    return '';
  }

  async getProducto(id: string) {
    
    const idProductoSnapShot = await this.inventarioService.getProductoId(id);
    if (!idProductoSnapShot.exists()) return;
    const producto = idProductoSnapShot.data() as Inventario;
    this.producto = producto;
    this.agregarProductoForm.patchValue({
      idN: id,
      nombre: producto.nombre,
      cantidad: producto.cantidad,
      descripcion: producto.descripcion,
    });
  }
  async agregarProducto() {
    this.submitted = true;
    this.mensajeFormulario.set('');

    if (this.agregarProductoForm.invalid) {
      this.toastr.error('Formulario invalido');
      return;
    }

    const id = this.id();

    try {
      this.loading.set(true);
      const idNuevo = this.agregarProductoForm.get('idN')?.value;
      const producto = {
        nombre: this.agregarProductoForm.get('nombre')?.value,
        cantidad: this.agregarProductoForm.get('cantidad')?.value,
        descripcion: this.agregarProductoForm.get('descripcion')?.value,
      };
      if (id) {
        await this.inventarioService.updateProducto(producto, id);
        this.router.navigate(['/']);
      } else {
        await this.inventarioService.createProducto(producto, idNuevo);
        this.agregarProductoForm.reset();
        this.submitted = false;
      }
      this.toastr.success(
        `Producto ${id ? 'Actualizado' : 'Creado'} correctamente`
      );
    } catch (error) {
      const accion = id ? 'actualizar' : 'crear';
      this.mostrarFalloOperacion(
        `No pudimos ${accion} el producto. Revisá los datos e intentá nuevamente.`,
        `No pudimos ${accion} el producto`,
        'Error al agregar el producto:',
        error
      );
    } finally {
      this.loading.set(false);
    }
  }

  async eliminarProducto() {
    const id = this.id();
    if (id) {
      try {
        this.mensajeFormulario.set('');
        this.eliminando.set(true);
        await this.inventarioService.deleteProducto(id);
        this.toastr.success('Producto eliminado correctamente');
        this.router.navigate(['/']);
      } catch (error) {
        this.mostrarFalloOperacion(
          `No pudimos eliminar ${this.nombreProductoActual}. El producto sigue disponible.`,
          'No pudimos eliminar el producto',
          'Error al eliminar el producto:',
          error
        );
      } finally {
        this.eliminando.set(false);
      }
    } else {
      this.mostrarFalloOperacion(
        'No se pudo eliminar el producto porque falta el ID.',
        'No se pudo eliminar el producto'
      );
    }
  }

  private mostrarFalloOperacion(
    mensajeFormulario: string,
    mensajeToast: string,
    etiquetaLog?: string,
    error?: unknown
  ) {
    this.mensajeFormulario.set(mensajeFormulario);
    this.toastr.error(mensajeToast);

    if (etiquetaLog) {
      console.error(etiquetaLog, error);
    }
  }
}
