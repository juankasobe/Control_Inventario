export interface MovimientoStock {
  productoId: string;
  numeroFactura: string;
  fecha: string;
  tipo: 'entrada' | 'salida';
  stockAnterior: number;
  stockNuevo: number;
  descripcion: string;
  timestamp: unknown;
}
