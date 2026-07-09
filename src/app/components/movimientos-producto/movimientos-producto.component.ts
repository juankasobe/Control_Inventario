import { Component, effect, inject, input } from '@angular/core';
import { InventarioService } from '../../service/inventario.service';
import { Inventario } from '../../interface/inventario';
import { MovimientoStock } from '../../interface/movimientoStock';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-movimientos-producto',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './movimientos-producto.component.html',
  styleUrl: './movimientos-producto.component.css',
})
export class MovimientosProductoComponent {
  producto: Inventario | undefined;
  cambiosStock: MovimientoStock[] = [];
  productosPorPagina: number = 10;
  paginaActual: number = 1;
  terminoBusqueda: string = '';


  id = input.required<string>();
  constructor(private _inventarioService: InventarioService) {
    effect(() => {
      const id = this.id();
      if (id) {
        this.getCambiosStock(id);
        this.getProducto(id);
      }
    });
  }
  private toastr: ToastrService = inject(ToastrService);

  async getCambiosStock(id: string) {
    (await this._inventarioService.getCambiosStockDeProductoOrdenados(id)).subscribe({
      next: (data) => {
        this.cambiosStock = data;
        this.ajustarPaginaPorTotalMovimientos(this.cambiosStockFiltrados.length);
      },
      error: () => {
        this.toastr.error('Error al obtener los productos');
      },
    });
  }

  get cambiosStockFiltrados(): MovimientoStock[] {
    const termino = this.terminoBusqueda.trim().toLowerCase();

    if (!termino) return this.cambiosStock;

    return this.cambiosStock.filter(
      (movimiento) =>
        movimiento.numeroFactura.toLowerCase().includes(termino) ||
        movimiento.descripcion.toLowerCase().includes(termino) ||
        movimiento.tipo.toLowerCase().includes(termino) ||
        movimiento.fecha.toLowerCase().includes(termino)
    );
  }

  get cambiosStockPaginados(): MovimientoStock[] {
    const cambiosStockFiltrados = this.cambiosStockFiltrados;
    const pagina = this.paginaValida(this.paginaActual, this.totalPaginas);
    const inicio = (pagina - 1) * this.productosPorPagina;
    return cambiosStockFiltrados.slice(inicio, inicio + this.productosPorPagina);
  }

  get totalPaginas(): number {
    return this.calcularTotalPaginas(this.cambiosStockFiltrados.length);
  }

  private ajustarPaginaPorTotalMovimientos(totalMovimientos: number) {
    this.ajustarPaginaActual(this.calcularTotalPaginas(totalMovimientos));
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  cambiarBusqueda(termino: string) {
    this.terminoBusqueda = termino;
    this.paginaActual = 1;
    this.ajustarPaginaPorTotalMovimientos(this.cambiosStockFiltrados.length);
  }

  get hayMovimientos(): boolean {
    return this.cambiosStock.length > 0;
  }

  get hayBusquedaSinResultados(): boolean {
    return this.hayMovimientos && this.terminoBusqueda.trim().length > 0 && this.cambiosStockFiltrados.length === 0;
  }

  get sinMovimientos(): boolean {
    return !this.hayMovimientos;
  }

  tipoMovimientoEtiqueta(tipo: string): string {
    return tipo.toLowerCase() === 'entrada' ? 'Entrada' : 'Salida';
  }

  private calcularTotalPaginas(totalMovimientos: number): number {
    return Math.ceil(totalMovimientos / this.productosPorPagina);
  }

  private paginaValida(pagina: number, totalPaginas: number): number {
    if (pagina < 1) {
      return 1;
    }

    if (totalPaginas > 0 && pagina > totalPaginas) {
      return totalPaginas;
    }

    return pagina;
  }

  private ajustarPaginaActual(totalPaginas: number) {
    this.paginaActual = this.paginaValida(this.paginaActual, totalPaginas);
  }

  async getProducto(id: string) {
    const idProductoSnapShot = await this._inventarioService.getProductoId(id);
    if (!idProductoSnapShot.exists()) return;
    const producto = idProductoSnapShot.data() as Inventario;
    this.producto = producto;
  }
}
