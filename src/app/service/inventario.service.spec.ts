import { InventarioService } from './inventario.service';

describe('InventarioService inventory movement behavior', () => {
  const detail = {
    numeroFactura: 'FAC-001',
    fecha: new Date(2026, 0, 15),
    descripcion: 'Stock adjustment detail',
  };

  let service: InventarioService;

  beforeEach(() => {
    service = Object.create(InventarioService.prototype) as InventarioService;
  });

  it('builds stock increase writes with canonical movement fields only', () => {
    const movement = (service as any).buildMovimientoStockWrite({
      productoId: 'product-1',
      cantidad: 3,
      stockActual: 10,
      detalle: detail,
      tipo: 'entrada',
      timestamp: new Date('2026-01-15T10:00:00.000Z'),
    });

    expect(movement).toEqual({
      productoId: 'product-1',
      numeroFactura: 'FAC-001',
      fecha: '2026-01-15',
      descripcion: 'Stock adjustment detail',
      stockAnterior: 10,
      stockNuevo: 13,
      tipo: 'entrada',
      timestamp: new Date('2026-01-15T10:00:00.000Z'),
    });
    expect(movement.descipcion).toBeUndefined();
    expect(movement.timeStamp).toBeUndefined();
  });

  it('builds stock decrease writes with canonical salida type only', () => {
    const movement = (service as any).buildMovimientoStockWrite({
      productoId: 'product-1',
      cantidad: 4,
      stockActual: 10,
      detalle: detail,
      tipo: 'salida',
      timestamp: new Date('2026-01-15T10:00:00.000Z'),
    });

    expect(movement).toEqual(
      jasmine.objectContaining({
        productoId: 'product-1',
        descripcion: 'Stock adjustment detail',
        stockAnterior: 10,
        stockNuevo: 6,
        tipo: 'salida',
        timestamp: new Date('2026-01-15T10:00:00.000Z'),
      })
    );
    expect(movement.descipcion).toBeUndefined();
    expect(movement.timeStamp).toBeUndefined();
  });

  it('normalizes legacy movement documents into the canonical movement contract', () => {
    const legacyTimestamp = new Date('2026-01-02T00:00:00.000Z');

    const movement = (service as any).mapMovimientoStock({
      productoId: 'legacy-1',
      numeroFactura: 'FAC-LEGACY',
      fecha: '2026-01-02',
      descipcion: 'Legacy movement',
      stockAnterior: 8,
      stockNuevo: 5,
      tipo: 'venta',
      timeStamp: legacyTimestamp,
    });

    expect(movement).toEqual({
      productoId: 'legacy-1',
      numeroFactura: 'FAC-LEGACY',
      fecha: '2026-01-02',
      descripcion: 'Legacy movement',
      stockAnterior: 8,
      stockNuevo: 5,
      tipo: 'salida',
      timestamp: legacyTimestamp,
    });
    expect(movement.descipcion).toBeUndefined();
    expect(movement.timeStamp).toBeUndefined();
  });

  it('orders mixed canonical and legacy movement documents by normalized timestamp', () => {
    const movements = (service as any).mapAndSortMovimientosStock([
      {
        productoId: 'newest',
        descripcion: 'Newest',
        tipo: 'entrada',
        timestamp: new Date('2026-01-03T00:00:00.000Z'),
      },
      {
        productoId: 'oldest',
        descipcion: 'Oldest legacy',
        tipo: 'compra',
        timeStamp: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        productoId: 'middle',
        descripcion: 'Middle',
        tipo: 'salida',
        timestamp: new Date('2026-01-02T00:00:00.000Z'),
      },
    ]);

    expect(movements.map((movement: any) => movement.productoId)).toEqual([
      'oldest',
      'middle',
      'newest',
    ]);
    expect(movements.map((movement: any) => movement.descripcion)).toEqual([
      'Oldest legacy',
      'Middle',
      'Newest',
    ]);
  });

  it('rejects non-positive stock adjustments before creating a write plan', () => {
    expect(typeof (service as any).validateStockAdjustment).toBe('function');

    expect(() =>
      (service as any).validateStockAdjustment({
        stockActual: 10,
        cantidad: 0,
        tipo: 'entrada',
      })
    ).toThrowError(/cantidad|quantity/i);
  });

  it('rejects decreases beyond available stock before creating a write plan', () => {
    expect(typeof (service as any).validateStockAdjustment).toBe('function');

    expect(() =>
      (service as any).validateStockAdjustment({
        stockActual: 10,
        cantidad: 11,
        tipo: 'salida',
      })
    ).toThrowError(/stock/i);
  });

  it('performs stock update and audit write inside the same transaction boundary', async () => {
    const transaction = {
      update: jasmine.createSpy('update'),
      set: jasmine.createSpy('set'),
    };
    const productoRef = { path: 'Productos/product-1' };
    const movimientoRef = { path: 'Productos/product-1/cambiosStock/movement-1' };

    await (service as any).applyStockAdjustmentTransaction({
      transaction,
      productoRef,
      movimientoRef,
      productoId: 'product-1',
      stockActual: 10,
      cantidad: 2,
      tipo: 'entrada',
      detalle: detail,
      timestamp: new Date('2026-01-15T10:00:00.000Z'),
    });

    expect(transaction.update).toHaveBeenCalledOnceWith(productoRef, { cantidad: 12 });
    expect(transaction.set).toHaveBeenCalledOnceWith(
      movimientoRef,
      jasmine.objectContaining({
        productoId: 'product-1',
        descripcion: 'Stock adjustment detail',
        stockAnterior: 10,
        stockNuevo: 12,
        tipo: 'entrada',
        timestamp: new Date('2026-01-15T10:00:00.000Z'),
      })
    );
  });

  it('propagates audit-write failures through the transaction boundary', async () => {
    const transaction = {
      update: jasmine.createSpy('update'),
      set: jasmine.createSpy('set').and.throwError('audit write failed'),
    };

    await expectAsync(
      (service as any).applyStockAdjustmentTransaction({
        transaction,
        productoRef: { path: 'Productos/product-1' },
        movimientoRef: { path: 'Productos/product-1/cambiosStock/movement-1' },
        productoId: 'product-1',
        stockActual: 10,
        cantidad: 2,
        tipo: 'entrada',
        detalle: detail,
        timestamp: new Date('2026-01-15T10:00:00.000Z'),
      })
    ).toBeRejectedWithError('audit write failed');
  });

  it('does not write an audit when quantity validation fails', async () => {
    const transaction = {
      update: jasmine.createSpy('update'),
      set: jasmine.createSpy('set'),
    };

    await expectAsync(
      (service as any).applyStockAdjustmentTransaction({
        transaction,
        productoRef: { path: 'Productos/product-1' },
        movimientoRef: { path: 'Productos/product-1/cambiosStock/movement-1' },
        productoId: 'product-1',
        stockActual: 10,
        cantidad: 0,
        tipo: 'entrada',
        detalle: detail,
        timestamp: new Date('2026-01-15T10:00:00.000Z'),
      })
    ).toBeRejectedWithError(/cantidad|quantity/i);

    expect(transaction.update).not.toHaveBeenCalled();
    expect(transaction.set).not.toHaveBeenCalled();
  });

  it('does not change product stock when the audit write fails', async () => {
    const productState = { cantidad: 10 };
    const transaction = {
      update: jasmine.createSpy('update').and.callFake((_ref: unknown, value: { cantidad: number }) => {
        productState.cantidad = value.cantidad;
      }),
      set: jasmine.createSpy('set').and.callFake(() => {
        productState.cantidad = 10;
        throw new Error('audit write failed');
      }),
    };

    await expectAsync(
      (service as any).applyStockAdjustmentTransaction({
        transaction,
        productoRef: { path: 'Productos/product-1' },
        movimientoRef: { path: 'Productos/product-1/cambiosStock/movement-1' },
        productoId: 'product-1',
        stockActual: productState.cantidad,
        cantidad: 2,
        tipo: 'entrada',
        detalle: detail,
        timestamp: new Date('2026-01-15T10:00:00.000Z'),
      })
    ).toBeRejectedWithError('audit write failed');

    expect(productState.cantidad).toBe(10);
  });
});
