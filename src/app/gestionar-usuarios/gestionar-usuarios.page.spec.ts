import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GestionarUsuariosPage } from './gestionar-usuarios.page';

describe('GestionarUsuariosPage', () => {
  let component: GestionarUsuariosPage;
  let fixture: ComponentFixture<GestionarUsuariosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GestionarUsuariosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
