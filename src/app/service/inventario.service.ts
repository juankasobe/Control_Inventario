import { inject, Injectable } from '@angular/core';
import { Inventario } from '../interface/inventario';
import { MovimientoStock } from '../interface/movimientoStock';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
  query,
  orderBy,
  setDoc,
  runTransaction,
} from '@angular/fire/firestore';
import { map, Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

const path = 'Productos';

export type productoCreate = Omit<Inventario, 'id'>;
type MovimientoStockTipo = MovimientoStock['tipo'];

type RawMovimientoStock = Partial<Omit<MovimientoStock, 'tipo'>> & {
  tipo?: MovimientoStockTipo | 'compra' | 'venta';
  descipcion?: string;
  timeStamp?: unknown;
};

type MovimientoStockWriteParams = {
  productoId: string;
  cantidad: number;
  stockActual: number;
  detalle: { numeroFactura: string; fecha: Date; descripcion: string };
  tipo: MovimientoStockTipo;
  timestamp: unknown;
};

type StockAdjustmentParams = {
  transaction: any;
  productoRef: unknown;
  movimientoRef: unknown;
  productoId: string;
  stockActual: number;
  cantidad: number;
  tipo: MovimientoStockTipo;
  detalle: { numeroFactura: string; fecha: Date; descripcion: string };
  timestamp: unknown;
};

@Injectable({
  providedIn: 'root',
})
export class InventarioService {
  private _fireStore = inject(Firestore);
  private _collection = collection(this._fireStore, path);
  private toastr: ToastrService = inject(ToastrService);

  async createProducto(crear: productoCreate, id: string) {
    const productoRef = doc(this._collection, id);
    const productoSnap = await getDoc(productoRef);
    if (productoSnap.exists()) {
      this.toastr.error('Producto repetido');
      throw new Error('Producto repetido');
    }
    return setDoc(productoRef, crear);
  }
  getProductos() {
    return collectionData(this._collection, { idField: 'id' }) as Observable<
      Inventario[]
    >;
  }

  async getCambiosStockDeProducto(id: string) {
    const pathMovs = '/Productos/' + id + '/cambiosStock';
    const _collectionMovs = collection(this._fireStore, pathMovs);
    return collectionData(_collectionMovs, { idField: 'movimientoId' }).pipe(
      map((movimientos) => this.mapAndSortMovimientosStock(movimientos as RawMovimientoStock[]))
    ) as Observable<MovimientoStock[]>;
  }
  async getCambiosStockDeProductoOrdenados(id: string) {
    const pathMovs = '/Productos/' + id + '/cambiosStock';
    const _collectionMovs = collection(this._fireStore, pathMovs);
    return collectionData(_collectionMovs, { idField: 'movimientoId' }).pipe(
      map((movimientos) => this.mapAndSortMovimientosStock(movimientos as RawMovimientoStock[]))
    ) as Observable<MovimientoStock[]>;
  }

  getProductoId(id: string) {
    const productoRef = doc(this._collection, id);
    return getDoc(productoRef);
  }

  getProductosOrdenados() {
    const consultaOrdenada = query(this._collection, orderBy('nombre')); // Ordenar por nombre
    return collectionData(consultaOrdenada, { idField: 'id' }) as Observable<
      Inventario[]
    >;
  }

  async agregarStock(
    productoId: string,
    cantidad: number,
    detalle: { numeroFactura: string; fecha: Date; descripcion: string }
  ) {
    await this.adjustStock(productoId, cantidad, detalle, 'entrada');
    this.toastr.success('Stock actualizado');
  }

  async disminuirStock(
    productoId: string,
    cantidad: number,
    detalle: { numeroFactura: string; fecha: Date; descripcion: string }
  ) {
    await this.adjustStock(productoId, cantidad, detalle, 'salida');
    this.toastr.success('Stock reducido');
  }

  updateProducto(producto: productoCreate, id: string) {
    const productoRef = doc(this._collection, id);
    return updateDoc(productoRef, producto);
  }
  deleteProducto(id: string) {
    const productoRef = doc(this._collection, id);
    return deleteDoc(productoRef);
  }

  private buildMovimientoStockWrite(params: MovimientoStockWriteParams): MovimientoStock {
    const { productoId, cantidad, stockActual, detalle, tipo, timestamp } = params;

    return {
      productoId,
      numeroFactura: detalle.numeroFactura,
      fecha: this.formatFecha(detalle.fecha),
      descripcion: detalle.descripcion,
      stockAnterior: stockActual,
      stockNuevo: tipo === 'entrada' ? stockActual + cantidad : stockActual - cantidad,
      tipo,
      timestamp,
    };
  }

  private async adjustStock(
    productoId: string,
    cantidad: number,
    detalle: { numeroFactura: string; fecha: Date; descripcion: string },
    tipo: MovimientoStockTipo
  ) {
    const productoRef = doc(this._collection, productoId);

    return runTransaction(this._fireStore, async (transaction) => {
      const productoSnap = await transaction.get(productoRef);

      if (!productoSnap.exists()) {
        throw new Error('Producto no encontrado');
      }

      const stockActual = Number(productoSnap.data()['cantidad']);
      const cambiosStockRef = collection(productoRef, 'cambiosStock');
      const movimientoRef = doc(cambiosStockRef);

      return this.applyStockAdjustmentTransaction({
        transaction,
        productoRef,
        movimientoRef,
        productoId,
        stockActual,
        cantidad,
        tipo,
        detalle,
        timestamp: new Date(),
      });
    });
  }

  private async applyStockAdjustmentTransaction(params: StockAdjustmentParams) {
    const {
      transaction,
      productoRef,
      movimientoRef,
      productoId,
      stockActual,
      cantidad,
      tipo,
      detalle,
      timestamp,
    } = params;
    const nuevoStock = this.validateStockAdjustment({ stockActual, cantidad, tipo });
    const movimiento = this.buildMovimientoStockWrite({
      productoId,
      cantidad,
      stockActual,
      detalle,
      tipo,
      timestamp,
    });

    transaction.update(productoRef, { cantidad: nuevoStock });
    transaction.set(movimientoRef, movimiento);
  }

  private validateStockAdjustment(params: {
    stockActual: number;
    cantidad: number;
    tipo: MovimientoStockTipo;
  }): number {
    const { stockActual, cantidad, tipo } = params;

    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      throw new Error('Cantidad no válida');
    }

    if (!Number.isFinite(stockActual)) {
      throw new Error('Stock no válido');
    }

    if (tipo === 'salida' && cantidad > stockActual) {
      throw new Error('Stock insuficiente');
    }

    return tipo === 'entrada' ? stockActual + cantidad : stockActual - cantidad;
  }

  private mapAndSortMovimientosStock(movimientos: RawMovimientoStock[]): MovimientoStock[] {
    return movimientos
      .map((movimiento) => this.mapMovimientoStock(movimiento))
      .sort(
        (first, second) =>
          this.getTimestampMillis(first.timestamp) - this.getTimestampMillis(second.timestamp)
      );
  }

  private mapMovimientoStock(movimiento: RawMovimientoStock): MovimientoStock {
    return {
      productoId: movimiento.productoId ?? '',
      numeroFactura: movimiento.numeroFactura ?? '',
      fecha: movimiento.fecha ?? '',
      descripcion: movimiento.descripcion ?? movimiento.descipcion ?? '',
      stockAnterior: movimiento.stockAnterior ?? 0,
      stockNuevo: movimiento.stockNuevo ?? 0,
      tipo: this.mapMovimientoTipo(movimiento.tipo),
      timestamp: movimiento.timestamp ?? movimiento.timeStamp,
    };
  }

  private mapMovimientoTipo(tipo: RawMovimientoStock['tipo']): MovimientoStockTipo {
    if (tipo === 'compra') return 'entrada';
    if (tipo === 'venta') return 'salida';
    return tipo ?? 'entrada';
  }

  private getTimestampMillis(timestamp: unknown): number {
    if (timestamp instanceof Date) return timestamp.getTime();
    if (typeof timestamp === 'number') return timestamp;

    if (timestamp && typeof timestamp === 'object') {
      const timestampLike = timestamp as { toMillis?: () => number; seconds?: number };
      if (typeof timestampLike.toMillis === 'function') return timestampLike.toMillis();
      if (typeof timestampLike.seconds === 'number') return timestampLike.seconds * 1000;
    }

    return 0;
  }

  private formatFecha(fecha: Date): string {
    return (
      fecha.getFullYear() +
      '-' +
      String(fecha.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(fecha.getDate()).padStart(2, '0')
    );
  }
}
