import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ListarComponent } from './listar.component';
import { InventarioService } from '../../service/inventario.service';
import { ToastrService } from 'ngx-toastr';
import { provideRouter } from '@angular/router';

describe('ListarComponent', () => {
  let component: ListarComponent;
  let fixture: ComponentFixture<ListarComponent>;
  let inventarioService: jasmine.SpyObj<InventarioService>;
  let toastr: jasmine.SpyObj<ToastrService>;

  const productosFixture = [
    { id: 'P-001', nombre: 'Tornillo Allen', cantidad: 12, descripcion: 'Acero inoxidable' },
    { id: 'P-002', nombre: 'Arandela Plana', cantidad: 0, descripcion: 'Caja chica' },
    { id: 'P-003', nombre: 'Tuerca Hexagonal', cantidad: 4, descripcion: 'Bolsa x100' },
  ];

  beforeEach(async () => {
    inventarioService = jasmine.createSpyObj<InventarioService>(
      'InventarioService',
      ['getProductosOrdenados', 'agregarStock', 'disminuirStock']
    );
    inventarioService.getProductosOrdenados.and.returnValue(of([]));
    inventarioService.agregarStock.and.resolveTo();
    inventarioService.disminuirStock.and.resolveTo();
    toastr = jasmine.createSpyObj<ToastrService>('ToastrService', ['error', 'success']);

    await TestBed.configureTestingModule({
      imports: [ListarComponent],
      providers: [
        { provide: InventarioService, useValue: inventarioService },
        { provide: ToastrService, useValue: toastr },
        provideRouter([]),
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('awaits stock increases before resolving the UI action', async () => {
    let resolveAdjustment!: () => void;
    inventarioService.agregarStock.and.returnValue(
      new Promise<void>((resolve) => {
        resolveAdjustment = resolve;
      })
    );
    component.productoSeleccionado = { id: 'product-1' };
    component.cantidadModificar = 3;
    component.numeroFactura = 'FAC-001';
    component.fecha = '2026-01-15';
    component.detalleDescripcion = 'Stock received';

    let completed = false;
    const action = component.aumentarStock().then(() => {
      completed = true;
    });

    await Promise.resolve();
    expect(completed).toBeFalse();
    expect(inventarioService.agregarStock).toHaveBeenCalledOnceWith(
      'product-1',
      3,
      jasmine.objectContaining({
        numeroFactura: 'FAC-001',
        descripcion: 'Stock received',
      })
    );

    resolveAdjustment();
    await action;
    expect(completed).toBeTrue();
  });

  it('surfaces rejected stock decrease validation errors consistently', async () => {
    inventarioService.disminuirStock.and.rejectWith(new Error('Stock insuficiente'));
    component.productoSeleccionado = { id: 'product-1' };
    component.cantidadModificar = 20;
    component.fecha = '2026-01-15';

    await component.disminuirStock();

    expect(toastr.error).toHaveBeenCalledOnceWith('Stock insuficiente');
  });

  it('shows clear product identity, stock and actions for product rows', () => {
    component.productos = productosFixture;

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Tornillo Allen');
    expect(text).toContain('Código: P-001');
    expect(text).toContain('Stock actual: 12');
    expect(text).toContain('Seleccionar');
    expect(text).toContain('Editar');
    expect(text).toContain('Movimientos');
  });

  it('shows a no-products empty state when the inventory list is empty', () => {
    component.productos = [];

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Todavía no hay productos cargados');
    expect(text).toContain('Agregá productos para empezar a gestionar el inventario.');
  });

  it('shows a filtered empty state that preserves the search text', () => {
    component.productos = productosFixture;
    component.cambiarBusqueda('rodamiento');

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('No encontramos productos para "rodamiento"');
    expect(component.totalProductosFiltrados).toBe(0);
  });

  it('resets search pagination to the first valid filtered page', () => {
    component.productos = productosFixture;
    component.productosPorPagina = 1;
    component.cambiarPagina(3);

    component.cambiarBusqueda('arandela');

    expect(component.paginaActual).toBe(1);
    expect(component.totalProductosFiltrados).toBe(1);
    expect(component.productosFiltrados.map((producto) => producto.id)).toEqual(['P-002']);
  });

  it('disables pagination controls that would move outside filtered pages', () => {
    component.productos = productosFixture;
    component.productosPorPagina = 2;
    component.cambiarBusqueda('tornillo');

    fixture.detectChanges();

    const previousButton = fixture.nativeElement.querySelector('[data-testid="previous-page"]') as HTMLButtonElement;
    const nextButton = fixture.nativeElement.querySelector('[data-testid="next-page"]') as HTMLButtonElement;
    expect(previousButton.disabled).toBeTrue();
    expect(nextButton.disabled).toBeTrue();
    expect(component.totalPaginasFiltradas).toBe(1);
  });

  it('shows selected-product context before adjusting stock', () => {
    component.seleccionarProducto(productosFixture[0]);

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Ajustar stock de Tornillo Allen');
    expect(text).toContain('Stock actual: 12');
    expect(text).toContain('Registrá una compra/devolución o una venta/devolución');
    expect(fixture.nativeElement.querySelector('[data-testid="adjustment-amount"]')).not.toBeNull();
  });

  it('blocks invalid adjustment amounts with inline validation feedback', async () => {
    component.seleccionarProducto(productosFixture[0]);
    component.cantidadModificar = 0;

    await component.aumentarStock();
    fixture.detectChanges();

    expect(inventarioService.agregarStock).not.toHaveBeenCalled();
    expect(toastr.error).toHaveBeenCalledOnceWith('Cantidad no válida');
    const validation = fixture.nativeElement.querySelector('[data-testid="adjustment-validation"]') as HTMLElement;
    expect(validation.textContent).toContain('Ingresá una cantidad mayor a cero');
  });

  it('prevents duplicate stock submissions while an adjustment is in progress', async () => {
    let resolveAdjustment!: () => void;
    inventarioService.agregarStock.and.returnValue(
      new Promise<void>((resolve) => {
        resolveAdjustment = resolve;
      })
    );
    component.seleccionarProducto(productosFixture[0]);
    component.cantidadModificar = 2;
    component.fecha = '2026-01-15';
    component.numeroFactura = 'FAC-002';
    component.detalleDescripcion = 'Ingreso inicial';

    const firstSubmit = component.aumentarStock();
    await Promise.resolve();
    fixture.detectChanges();
    await component.aumentarStock();

    const increaseButton = fixture.nativeElement.querySelector('[data-testid="increase-stock"]') as HTMLButtonElement;
    const decreaseButton = fixture.nativeElement.querySelector('[data-testid="decrease-stock"]') as HTMLButtonElement;
    expect(inventarioService.agregarStock).toHaveBeenCalledTimes(1);
    expect(increaseButton.disabled).toBeTrue();
    expect(decreaseButton.disabled).toBeTrue();

    resolveAdjustment();
    await firstSubmit;
  });

  it('shows success feedback and clears transient inputs after successful stock increase', async () => {
    component.seleccionarProducto(productosFixture[0]);
    component.cantidadModificar = 5;
    component.fecha = '2026-02-20';
    component.numeroFactura = 'FAC-003';
    component.detalleDescripcion = 'Reposición semanal';

    await component.aumentarStock();
    fixture.detectChanges();

    expect(toastr.success).toHaveBeenCalledOnceWith('Stock actualizado correctamente');
    expect(component.cantidadModificar).toBe(0);
    expect(component.fecha).toBe('');
    expect(component.numeroFactura).toBe('');
    expect(component.detalleDescripcion).toBe('');
    const status = fixture.nativeElement.querySelector('[data-testid="adjustment-status"]') as HTMLElement;
    expect(status.textContent).toContain('Stock actualizado correctamente');
  });
});
