import { Component, effect, inject, input } from '@angular/core';
import { InventarioService } from '../../service/inventario.service';
import { Inventario } from '../../interface/inventario';
import { MovimientoStock } from '../../interface/movimientoStock';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-movimientos-producto',
  imports: [CommonModule, FormsModule],
  templateUrl: './movimientos-producto.component.html',
  styleUrl: './movimientos-producto.component.css',
})
export class MovimientosProductoComponent {
  producto: Inventario | undefined;
  cambiosStock: MovimientoStock[] = [];
  totalPaginas: number = 1;
  productosPorPagina: number = 10;
  paginaActual: number = 1;
  terminoBusqueda: string = '';


  id = input.required<string>();
  constructor(private _inventarioService: InventarioService) {
    effect(() => {
      const id = this.id();
      if (id) {
        this.getCambiosStock(id); // Reemplazar con el ID del producto deseado
        this.getProducto(id);
      }
    });
  }
  private toastr: ToastrService = inject(ToastrService);

  async getCambiosStock(id: string) {
    (await this._inventarioService.getCambiosStockDeProductoOrdenados(id)).subscribe({
      next: (data) => {
        this.cambiosStock = data;
        this.updateTotalPaginas(this.cambiosStockFiltrados.length);
        console.log('Cambios de stock:', this.cambiosStock);
      },
      error: (err) => {
        this.toastr.error('Error al obtener los productos');
        console.error(err);
      },
    });
  }

  get cambiosStockFiltrados(): MovimientoStock[] {
    const termino = this.terminoBusqueda.toLowerCase();

    return this.cambiosStock.filter(
      (movimiento) =>
        movimiento.numeroFactura.toLowerCase().includes(termino) ||
        movimiento.descripcion.toLowerCase().includes(termino)
    );
  }

  get cambiosStockPaginados(): MovimientoStock[] {
    const cambiosStockFiltrados = this.cambiosStockFiltrados;
    this.updateTotalPaginas(cambiosStockFiltrados.length);

    const inicio = (this.paginaActual - 1) * this.productosPorPagina;
    return cambiosStockFiltrados.slice(inicio, inicio + this.productosPorPagina);
  }

  private updateTotalPaginas(totalMovimientos: number) {
    this.totalPaginas = Math.ceil(totalMovimientos / this.productosPorPagina);
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }
  async getProducto(id: string) {
    const idProductoSnapShot = await this._inventarioService.getProductoId(id);
    if (!idProductoSnapShot.exists()) return;
    const producto = idProductoSnapShot.data() as Inventario;
    this.producto = producto; // Asigna el producto para mostrarlo en el HTML
    console.log('Producto:', producto);
  }
}
