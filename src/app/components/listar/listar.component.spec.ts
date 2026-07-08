import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ListarComponent } from './listar.component';
import { InventarioService } from '../../service/inventario.service';
import { ToastrService } from 'ngx-toastr';

describe('ListarComponent', () => {
  let component: ListarComponent;
  let fixture: ComponentFixture<ListarComponent>;
  let inventarioService: jasmine.SpyObj<InventarioService>;
  let toastr: jasmine.SpyObj<ToastrService>;

  beforeEach(async () => {
    inventarioService = jasmine.createSpyObj<InventarioService>(
      'InventarioService',
      ['getProductosOrdenados', 'agregarStock', 'disminuirStock']
    );
    inventarioService.getProductosOrdenados.and.returnValue(of([]));
    inventarioService.agregarStock.and.resolveTo();
    inventarioService.disminuirStock.and.resolveTo();
    toastr = jasmine.createSpyObj<ToastrService>('ToastrService', ['error']);

    await TestBed.configureTestingModule({
      imports: [ListarComponent],
      providers: [
        { provide: InventarioService, useValue: inventarioService },
        { provide: ToastrService, useValue: toastr },
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
});
