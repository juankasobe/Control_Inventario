import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AgregarComponent } from './agregar.component';
import { InventarioService } from '../../service/inventario.service';
import { ToastrService } from 'ngx-toastr';

describe('AgregarComponent', () => {
  let component: AgregarComponent;
  let fixture: ComponentFixture<AgregarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarComponent],
      providers: [
        provideRouter([]),
        {
          provide: InventarioService,
          useValue: {
            getProductoId: jasmine.createSpy('getProductoId'),
            createProducto: jasmine.createSpy('createProducto'),
            updateProducto: jasmine.createSpy('updateProducto'),
            deleteProducto: jasmine.createSpy('deleteProducto'),
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

    fixture = TestBed.createComponent(AgregarComponent);
    fixture.componentRef.setInput('id', '');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
