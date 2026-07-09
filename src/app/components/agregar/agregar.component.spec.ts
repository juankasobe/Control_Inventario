import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { AgregarComponent } from './agregar.component';
import { InventarioService } from '../../service/inventario.service';
import { ToastrService } from 'ngx-toastr';

describe('AgregarComponent', () => {
  let component: AgregarComponent;
  let fixture: ComponentFixture<AgregarComponent>;
  let inventarioService: jasmine.SpyObj<InventarioService>;
  let toastr: jasmine.SpyObj<ToastrService>;
  let router: Router;

  const existingProduct = {
    nombre: 'Tornillo Allen',
    cantidad: 12,
    descripcion: 'Caja principal',
  };

  function productSnapshot(product = existingProduct) {
    return {
      exists: () => true,
      data: () => product,
    };
  }

  async function renderWithId(id = '') {
    fixture = TestBed.createComponent(AgregarComponent);
    fixture.componentRef.setInput('id', id);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function pageText(): string {
    return fixture.nativeElement.textContent as string;
  }

  function query(selector: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(selector);
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarComponent],
      providers: [
        provideRouter([]),
        {
          provide: InventarioService,
          useValue: {
            getProductoId: jasmine.createSpy('getProductoId').and.resolveTo(productSnapshot()),
            createProducto: jasmine.createSpy('createProducto').and.resolveTo(undefined),
            updateProducto: jasmine.createSpy('updateProducto').and.resolveTo(undefined),
            deleteProducto: jasmine.createSpy('deleteProducto').and.resolveTo(undefined),
          },
        },
        {
          provide: ToastrService,
          useValue: {
            error: jasmine.createSpy('error'),
            success: jasmine.createSpy('success'),
          },
        },
      ],
    })
    .compileComponents();

    inventarioService = TestBed.inject(InventarioService) as jasmine.SpyObj<InventarioService>;
    toastr = TestBed.inject(ToastrService) as jasmine.SpyObj<ToastrService>;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    await renderWithId('');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows add mode copy and create action without destructive controls', () => {
    expect(pageText()).toContain('Agregar producto');
    expect(pageText()).toContain('Cargá los datos para crear un producto nuevo.');
    expect(pageText()).toContain('Crear producto');
    expect(query('[data-testid="delete-product"]')).toBeNull();
  });

  it('shows edit mode copy, loaded context, and a distinct destructive delete action', async () => {
    await renderWithId('P-001');

    expect(pageText()).toContain('Editar producto');
    expect(pageText()).toContain('Actualizá los datos de Tornillo Allen.');
    expect(pageText()).toContain('Guardar cambios');
    expect(pageText()).toContain('Eliminar producto');
    expect((query('[data-testid="product-id"]') as HTMLInputElement).disabled).toBeTrue();
  });

  it('blocks invalid save attempts and shows field-level feedback', async () => {
    await component.agregarProducto();
    fixture.detectChanges();

    expect(inventarioService.createProducto).not.toHaveBeenCalled();
    expect(query('[data-testid="id-error"]')?.textContent).toContain('Ingresá un ID');
    expect(query('[data-testid="name-error"]')?.textContent).toContain('Ingresá el nombre del producto');
    expect(query('[data-testid="quantity-error"]')?.textContent).toContain('Ingresá una cantidad mayor a cero');
  });

  it('keeps entered add context visible when save fails', async () => {
    inventarioService.createProducto.and.rejectWith(new Error('network'));
    component.agregarProductoForm.setValue({
      idN: 'P-404',
      nombre: 'Rodamiento',
      cantidad: 4,
      descripcion: 'Pendiente de alta',
    });

    await component.agregarProducto();
    fixture.detectChanges();

    expect(query('[data-testid="form-status"]')?.textContent).toContain('No pudimos crear el producto. Revisá los datos e intentá nuevamente.');
    expect(component.agregarProductoForm.getRawValue()).toEqual({
      idN: 'P-404',
      nombre: 'Rodamiento',
      cantidad: 4,
      descripcion: 'Pendiente de alta',
    });
    expect(toastr.error).toHaveBeenCalledWith('No pudimos crear el producto');
  });

  it('awaits delete, shows failed delete feedback, and preserves edit context', async () => {
    inventarioService.deleteProducto.and.rejectWith(new Error('permission'));
    await renderWithId('P-001');

    await component.eliminarProducto();
    fixture.detectChanges();

    expect(inventarioService.deleteProducto).toHaveBeenCalledWith('P-001');
    expect(query('[data-testid="form-status"]')?.textContent).toContain('No pudimos eliminar Tornillo Allen. El producto sigue disponible.');
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.agregarProductoForm.getRawValue()).toEqual({
      idN: 'P-001',
      nombre: 'Tornillo Allen',
      cantidad: 12,
      descripcion: 'Caja principal',
    });
    expect(toastr.error).toHaveBeenCalledWith('No pudimos eliminar el producto');
  });

  it('disables the destructive action while delete is in progress', async () => {
    let resolveDelete!: () => void;
    inventarioService.deleteProducto.and.returnValue(new Promise<void>((resolve) => {
      resolveDelete = resolve;
    }));
    await renderWithId('P-001');

    const deletePromise = component.eliminarProducto();
    fixture.detectChanges();

    expect((query('[data-testid="delete-product"]') as HTMLButtonElement).disabled).toBeTrue();
    expect(pageText()).toContain('Eliminando...');

    resolveDelete();
    await deletePromise;
  });
});
