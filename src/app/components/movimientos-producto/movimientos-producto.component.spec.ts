import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';

import { MovimientosProductoComponent } from './movimientos-producto.component';
import { InventarioService } from '../../service/inventario.service';
import { ToastrService } from 'ngx-toastr';
import { MovimientoStock } from '../../interface/movimientoStock';

describe('MovimientosProductoComponent', () => {
  let component: MovimientosProductoComponent;
  let fixture: ComponentFixture<MovimientosProductoComponent>;
  let movementStream: Subject<MovimientoStock[]>;

  beforeEach(async () => {
    movementStream = new Subject<MovimientoStock[]>();

    await TestBed.configureTestingModule({
      imports: [MovimientosProductoComponent],
      providers: [
        {
          provide: InventarioService,
          useValue: {
            getCambiosStockDeProductoOrdenados: () => Promise.resolve(movementStream.asObservable()),
            getProductoId: () => Promise.resolve({ exists: () => false }),
          },
        },
        { provide: ToastrService, useValue: { error: jasmine.createSpy('error') } },
        provideRouter([]),
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(MovimientosProductoComponent);
    fixture.componentRef.setInput('id', '');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('filters movements before paginating them', () => {
    component.productosPorPagina = 2;
    component.paginaActual = 1;
    component.terminoBusqueda = 'match';
    component.cambiosStock = [
      movement({ numeroFactura: 'skip-1', descripcion: 'other' }),
      movement({ numeroFactura: 'match-1', descripcion: 'first match' }),
      movement({ numeroFactura: 'skip-2', descripcion: 'other' }),
      movement({ numeroFactura: 'match-2', descripcion: 'second match' }),
      movement({ numeroFactura: 'match-3', descripcion: 'third match' }),
    ];

    expect(component.cambiosStockPaginados.map((item) => item.numeroFactura)).toEqual([
      'match-1',
      'match-2',
    ]);
  });

  it('computes total pages from filtered movements', () => {
    component.productosPorPagina = 2;
    component.terminoBusqueda = 'match';
    component.cambiosStock = [
      movement({ numeroFactura: 'match-1', descripcion: 'first match' }),
      movement({ numeroFactura: 'match-2', descripcion: 'second match' }),
      movement({ numeroFactura: 'match-3', descripcion: 'third match' }),
      movement({ numeroFactura: 'skip-1', descripcion: 'other' }),
    ];

    expect(component.totalPaginas).toBe(2);
  });

  it('returns an empty page and no additional pages when the filter has no matches', () => {
    component.productosPorPagina = 2;
    component.terminoBusqueda = 'missing';
    component.cambiosStock = [
      movement({ numeroFactura: 'invoice-1', descripcion: 'first movement' }),
      movement({ numeroFactura: 'invoice-2', descripcion: 'second movement' }),
    ];

    expect(component.cambiosStockPaginados).toEqual([]);
    expect(component.totalPaginas).toBe(0);
  });

  it('filters and renders canonical descripcion values', () => {
    component.terminoBusqueda = 'canonical';
    component.cambiosStock = [
      movement({ numeroFactura: 'invoice-1', descripcion: 'canonical description' }),
    ];

    expect(component.cambiosStockPaginados[0].descripcion).toBe('canonical description');
  });

  it('resets search to the first page and shows only matching movements', () => {
    component.productosPorPagina = 2;
    component.paginaActual = 2;
    component.cambiosStock = [
      movement({ numeroFactura: 'FAC-100', descripcion: 'Compra inicial' }),
      movement({ numeroFactura: 'FAC-200', descripcion: 'Venta mostrador' }),
      movement({ numeroFactura: 'FAC-300', descripcion: 'Compra secundaria' }),
    ];

    component.cambiarBusqueda('compra');

    expect(component.paginaActual).toBe(1);
    expect(component.cambiosStockPaginados.map((item) => item.numeroFactura)).toEqual([
      'FAC-100',
      'FAC-300',
    ]);
  });

  it('uses a valid page for filtered pagination without mutating current page in the getter', () => {
    component.productosPorPagina = 1;
    component.paginaActual = 3;
    component.cambiosStock = [
      movement({ numeroFactura: 'FAC-100', descripcion: 'Compra inicial' }),
      movement({ numeroFactura: 'FAC-200', descripcion: 'Venta mostrador' }),
      movement({ numeroFactura: 'FAC-300', descripcion: 'Compra secundaria' }),
    ];

    component.terminoBusqueda = 'compra';

    expect(component.cambiosStockPaginados.map((item) => item.numeroFactura)).toEqual(['FAC-300']);
    expect(component.totalPaginas).toBe(2);
    expect(component.paginaActual).toBe(3);
  });

  it('renders a filtered empty state that preserves the search context', () => {
    component.terminoBusqueda = 'sin coincidencias';
    component.cambiosStock = [
      movement({ numeroFactura: 'FAC-100', descripcion: 'Compra inicial' }),
    ];
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('[data-testid="movements-filtered-empty"]');

    expect(emptyState?.textContent).toContain('No encontramos movimientos para "sin coincidencias"');
  });

  it('renders distinguishable badges for entrada and salida movements', () => {
    component.cambiosStock = [
      movement({ tipo: 'entrada', numeroFactura: 'FAC-100', descripcion: 'Compra inicial' }),
      movement({ tipo: 'salida', numeroFactura: 'FAC-200', descripcion: 'Venta mostrador' }),
    ];
    fixture.detectChanges();

    const badges = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('[data-testid="movement-type-badge"]'));

    expect(badges.map((badge) => badge.textContent?.trim())).toEqual(['Entrada', 'Salida']);
  });

  it('keeps populated and empty movement surfaces dark and readable', () => {
    component.cambiosStock = [
      movement({ tipo: 'entrada', numeroFactura: 'FAC-100', descripcion: 'Compra inicial' }),
      movement({ tipo: 'salida', numeroFactura: 'FAC-200', descripcion: 'Venta mostrador' }),
    ];
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const header = root.querySelector('.history-header') as HTMLElement;
    const search = root.querySelector('.search-input') as HTMLInputElement;
    const tableWrapper = root.querySelector('.movement-table-wrapper') as HTMLElement;
    const table = root.querySelector('.movement-table') as HTMLTableElement;
    const pagination = root.querySelector('.pagination-bar') as HTMLElement;
    const badges = Array.from<HTMLElement>(root.querySelectorAll('[data-testid="movement-type-badge"]'));

    expect(getComputedStyle(header).backgroundColor).toBe('rgb(17, 24, 39)');
    expect(getComputedStyle(search).backgroundColor).toBe('rgb(30, 41, 59)');
    expect(getComputedStyle(tableWrapper).backgroundColor).toBe('rgb(17, 24, 39)');
    expect(getComputedStyle(table.querySelector('thead th') as HTMLElement).backgroundColor).toBe('rgb(30, 41, 59)');
    expect(getComputedStyle(pagination).backgroundColor).toBe('rgb(17, 24, 39)');
    expect(table.querySelectorAll('th[scope="col"]').length).toBe(6);
    expect(table.textContent).toContain('Compra inicial');
    expect(getComputedStyle(badges[0]).backgroundColor).toBe('rgb(20, 83, 45)');
    expect(getComputedStyle(badges[1]).backgroundColor).toBe('rgb(127, 29, 29)');

    component.cambiosStock = [];
    fixture.detectChanges();

    const empty = root.querySelector('[data-testid="movements-empty"]') as HTMLElement;
    expect(empty.textContent?.trim()).toBe('Todavía no hay movimientos registrados para este producto.');
    expect(getComputedStyle(empty).backgroundColor).toBe('rgb(17, 24, 39)');
    expect(getComputedStyle(empty).color).toBe('rgb(203, 213, 225)');
  });

  it('keeps keyboard focus visible and disabled pagination distinguishable', () => {
    component.cambiosStock = Array.from({ length: 11 }, (_, index) => movement({ numeroFactura: `FAC-${index}` }));
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const search = root.querySelector('.search-input') as HTMLInputElement;
    const buttons = Array.from<HTMLButtonElement>(root.querySelectorAll('.pagination-bar button'));

    search.focus();
    expect(getComputedStyle(search).outlineStyle).toBe('solid');
    expect(buttons[0].disabled).toBeTrue();
    expect(buttons[1].disabled).toBeFalse();
    expect(getComputedStyle(buttons[0]).backgroundColor).toBe('rgb(30, 41, 59)');
    expect(getComputedStyle(buttons[0]).opacity).toBe('1');

    buttons[1].focus();
    expect(getComputedStyle(buttons[1]).outlineStyle).toBe('solid');
  });

  it('retains overflow and wrapping contracts for narrow layouts', () => {
    component.cambiosStock = [movement({ numeroFactura: 'FAC-100' })];
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(getComputedStyle(root.querySelector('.movement-table-wrapper') as HTMLElement).overflowX).toBe('auto');
    expect(getComputedStyle(root.querySelector('.history-header') as HTMLElement).flexWrap).toBe('wrap');
    expect(getComputedStyle(root.querySelector('.pagination-bar') as HTMLElement).display).toBe('flex');
  });

  it('renders a return affordance back to the product list workflow', () => {
    fixture.detectChanges();

    const link: HTMLAnchorElement | null = fixture.nativeElement.querySelector('[data-testid="back-to-products"]');

    expect(link?.textContent).toContain('Volver al listado');
    expect(link?.getAttribute('href')).toBe('/');
  });

  it('stops applying movement updates after the component is destroyed', async () => {
    fixture.componentRef.setInput('id', 'product-1');
    fixture.detectChanges();
    await fixture.whenStable();

    movementStream.next([movement({ numeroFactura: 'before-destroy' })]);
    expect(component.cambiosStock.map((item) => item.numeroFactura)).toEqual(['before-destroy']);

    fixture.destroy();
    movementStream.next([movement({ numeroFactura: 'after-destroy' })]);

    expect(component.cambiosStock.map((item) => item.numeroFactura)).toEqual(['before-destroy']);
  });
});

type CanonicalMovement = MovimientoStock & { descripcion: string };

function movement(overrides: Partial<CanonicalMovement>): MovimientoStock {
  return {
    productoId: 'product-1',
    numeroFactura: 'invoice-1',
    fecha: '2026-07-07',
    tipo: 'entrada',
    stockAnterior: 1,
    stockNuevo: 2,
    descipcion: '',
    descripcion: '',
    timestamp: new Date('2026-07-07T00:00:00.000Z'),
    ...overrides,
  } as MovimientoStock;
}
