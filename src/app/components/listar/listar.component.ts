import { Component, inject, signal } from '@angular/core';
import { InventarioService } from '../../service/inventario.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { Inventario } from '../../interface/inventario';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-listar',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './listar.component.html',
  styleUrl: './listar.component.css',
})

export class ListarComponent {
  constructor(private _inventarioService: InventarioService) {}
  ngOnInit() {
    this.listar();
  }

  

  productoSeleccionado: any = null;
  private toastr: ToastrService = inject(ToastrService);
  productos: Inventario[] = [];
  cantidadModificar: number = 0;
  fecha: string = '';
  numeroFactura: string = '';
  detalleDescripcion: string = '';
  terminoBusqueda: string = '';
  paginaActual: number = 1;
  productosPorPagina: number = 10;
  totalPaginas: number = 1;


  listar() {
    this._inventarioService.getProductosOrdenados().subscribe({
      next: (data) => {
        this.productos = data;
       this.totalPaginas = Math.ceil(this.productos.length / this.productosPorPagina);
      },
      error: (err) => {
        this.toastr.error('Error al obtener los productos');
        console.error(err);
      },
    });
  }
  detalle = { numeroFactura: '', fecha: new Date(), descripcion : '' };
  
  async aumentarStock() {
    this.detalle = { numeroFactura: this.numeroFactura, fecha: new Date(this.fecha), descripcion : this.detalleDescripcion };
    if (this.productoSeleccionado && this.cantidadModificar > 0) {
      try {
        await this._inventarioService.agregarStock(
          this.productoSeleccionado.id,
          this.cantidadModificar,
          this.detalle
        );
      } catch (error) {
        this.mostrarErrorAjuste(error);
      }
    } else {
      this.toastr.error('Cantidad no válida');
    }
  }
  async disminuirStock() {
    this.detalle = { numeroFactura: this.numeroFactura, fecha: new Date(this.fecha), descripcion : this.detalleDescripcion };
    if (this.productoSeleccionado && this.cantidadModificar > 0) {
      try {
        await this._inventarioService.disminuirStock(
          this.productoSeleccionado.id,
          this.cantidadModificar,
          this.detalle
        );
      } catch (error) {
        this.mostrarErrorAjuste(error);
      }
    } else {
      this.toastr.error('Cantidad no válida');
    }
  }

  seleccionarProducto(producto: any) {
    this.productoSeleccionado = producto;
    console.log('Producto seleccionado:', this.productoSeleccionado);
    this.cantidadModificar = 0;
  }

  get productosFiltrados(): any[] {
    const productosFiltrados = this.productos.filter(
      (producto) =>
        producto.nombre
          .toLowerCase()
          .includes(this.terminoBusqueda.toLowerCase()) ||
        producto.id.toLowerCase().includes(this.terminoBusqueda.toLowerCase())
    );

    const inicio = (this.paginaActual - 1) * this.productosPorPagina;
    const fin = inicio + this.productosPorPagina;
    return productosFiltrados.slice(inicio, fin);
  }

  cambiarPagina(numeroPagina: number) {
    if (numeroPagina >= 1 && numeroPagina <= this.totalPaginas) {
      this.paginaActual = numeroPagina;
    }
  }

  private mostrarErrorAjuste(error: unknown) {
    const message = error instanceof Error ? error.message : 'No se pudo actualizar el stock';
    this.toastr.error(message);
  }


}
