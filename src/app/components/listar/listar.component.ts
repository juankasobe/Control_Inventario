import { Component, inject } from '@angular/core';
import { InventarioService } from '../../service/inventario.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { Inventario } from '../../interface/inventario';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

const INVALID_DATE_MESSAGE = 'Select a valid date';

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
  ajusteEnCurso: boolean = false;
  ajusteIntentado: boolean = false;
  mensajeAjuste: string = '';
  tipoMensajeAjuste: 'success' | 'error' | '' = '';
  terminoBusqueda: string = '';
  paginaActual: number = 1;
  productosPorPagina: number = 10;


  listar() {
    this._inventarioService.getProductosOrdenados().subscribe({
      next: (data) => {
        this.productos = data;
        this.ajustarPaginaActual();
      },
      error: (err) => {
        this.toastr.error('Error al obtener los productos');
        console.error(err);
      },
    });
  }
  detalle = { numeroFactura: '', fecha: new Date(), descripcion : '' };
  
  async aumentarStock() {
    await this.registrarAjuste('entrada');
  }

  async disminuirStock() {
    await this.registrarAjuste('salida');
  }

  seleccionarProducto(producto: any) {
    this.productoSeleccionado = producto;
    this.limpiarCamposAjuste();
    this.limpiarEstadoAjuste();
  }

  get cantidadAjusteInvalida(): boolean {
    return !this.cantidadModificar || this.cantidadModificar <= 0;
  }

  get mostrarValidacionAjuste(): boolean {
    return this.ajusteIntentado && this.cantidadAjusteInvalida;
  }

  get puedeEnviarAjuste(): boolean {
    return !!this.productoSeleccionado && !this.cantidadAjusteInvalida && !this.ajusteEnCurso;
  }

  get fechaAjusteInvalida(): boolean {
    return this.parseFechaLocal(this.fecha) === null;
  }

  get mostrarValidacionFecha(): boolean {
    return this.ajusteIntentado && this.fechaAjusteInvalida;
  }

  get mensajeValidacionFecha(): string {
    return this.fechaAjusteInvalida ? INVALID_DATE_MESSAGE : '';
  }

  get mensajeValidacionAjuste(): string {
    return this.cantidadAjusteInvalida ? 'Ingresá una cantidad mayor a cero' : '';
  }

  get productosFiltradosCompletos(): Inventario[] {
    const busqueda = this.terminoBusqueda.trim().toLowerCase();

    if (!busqueda) {
      return this.productos;
    }

    return this.productos.filter(
      (producto) =>
        producto.nombre.toLowerCase().includes(busqueda) ||
        producto.id.toLowerCase().includes(busqueda)
    );
  }

  get productosFiltrados(): Inventario[] {
    const inicio = (this.paginaActual - 1) * this.productosPorPagina;
    const fin = inicio + this.productosPorPagina;
    return this.productosFiltradosCompletos.slice(inicio, fin);
  }

  get totalProductosFiltrados(): number {
    return this.productosFiltradosCompletos.length;
  }

  get totalPaginasFiltradas(): number {
    return Math.max(1, Math.ceil(this.totalProductosFiltrados / this.productosPorPagina));
  }

  get totalPaginas(): number {
    return this.totalPaginasFiltradas;
  }

  get hayProductos(): boolean {
    return this.productos.length > 0;
  }

  get hayBusquedaActiva(): boolean {
    return this.terminoBusqueda.trim().length > 0;
  }

  get hayBusquedaSinResultados(): boolean {
    return this.hayProductos && this.hayBusquedaActiva && this.totalProductosFiltrados === 0;
  }

  get puedeIrPaginaAnterior(): boolean {
    return this.paginaActual > 1;
  }

  get puedeIrPaginaSiguiente(): boolean {
    return this.paginaActual < this.totalPaginasFiltradas;
  }

  cambiarBusqueda(termino: string) {
    this.terminoBusqueda = termino;
    this.paginaActual = 1;
    this.ajustarPaginaActual();
  }

  cambiarPagina(numeroPagina: number) {
    this.paginaActual = Math.min(Math.max(numeroPagina, 1), this.totalPaginasFiltradas);
  }

  private ajustarPaginaActual() {
    this.paginaActual = Math.min(Math.max(this.paginaActual, 1), this.totalPaginasFiltradas);
  }

  private mostrarErrorAjuste(error: unknown) {
    const message = error instanceof Error ? error.message : 'No se pudo actualizar el stock';
    this.mensajeAjuste = message;
    this.tipoMensajeAjuste = 'error';
    this.toastr.error(message);
  }

  private async registrarAjuste(tipo: 'entrada' | 'salida') {
    if (this.ajusteEnCurso) {
      return;
    }

    this.ajusteIntentado = true;
    this.mensajeAjuste = '';
    this.tipoMensajeAjuste = '';

    if (!this.puedeEnviarAjuste) {
      this.toastr.error('Cantidad no válida');
      return;
    }

    const fechaAjuste = this.parseFechaLocal(this.fecha);
    if (!fechaAjuste) {
      this.mensajeAjuste = INVALID_DATE_MESSAGE;
      this.tipoMensajeAjuste = 'error';
      this.toastr.error(INVALID_DATE_MESSAGE);
      return;
    }

    this.ajusteEnCurso = true;
    this.detalle = { numeroFactura: this.numeroFactura, fecha: fechaAjuste, descripcion : this.detalleDescripcion };

    try {
      if (tipo === 'entrada') {
        await this._inventarioService.agregarStock(
          this.productoSeleccionado.id,
          this.cantidadModificar,
          this.detalle
        );
      } else {
        await this._inventarioService.disminuirStock(
          this.productoSeleccionado.id,
          this.cantidadModificar,
          this.detalle
        );
      }

      this.mensajeAjuste = 'Stock actualizado correctamente';
      this.tipoMensajeAjuste = 'success';
      this.toastr.success(this.mensajeAjuste);
      this.limpiarCamposAjuste();
      this.ajusteIntentado = false;
    } catch (error) {
      this.mostrarErrorAjuste(error);
    } finally {
      this.ajusteEnCurso = false;
    }
  }

  private limpiarCamposAjuste() {
    this.cantidadModificar = 0;
    this.fecha = '';
    this.numeroFactura = '';
    this.detalleDescripcion = '';
  }

  private limpiarEstadoAjuste() {
    this.ajusteIntentado = false;
    this.mensajeAjuste = '';
    this.tipoMensajeAjuste = '';
  }

  private parseFechaLocal(fecha: string): Date | null {
    if (typeof fecha !== 'string') {
      return null;
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
    if (!match) {
      return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const localDate = new Date(0);
    localDate.setHours(12, 0, 0, 0);
    localDate.setFullYear(year, month - 1, day);
    localDate.setHours(0, 0, 0, 0);

    return localDate.getFullYear() === year &&
      localDate.getMonth() === month - 1 &&
      localDate.getDate() === day
      ? localDate
      : null;
  }

}
