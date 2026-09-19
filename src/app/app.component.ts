import { Component, inject } from "@angular/core";
import { IonApp, IonRouterOutlet } from "@ionic/angular";
import { Router } from "@angular/router";
import { StorageService } from "./services/storage";

@Component({
  selector: "app-root",
  templateUrl: "app.component.html",
  styleUrls: ["app.component.scss"],
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private router = inject(Router);
  private storage = inject(StorageService);

  constructor() {
    this.comprobarSesion();
  }

  private async comprobarSesion(): Promise<void> {
    const usuario = await this.storage.obtenerUsuario();

    if (usuario) {
      console.log("Usuario encontrado en Preferences:", usuario);

      // Si existe una sesión guardada, ir a usuarios
      await this.router.navigateByUrl("/usuarios");
    } else {
      console.log("No hay usuario guardado en Preferences");
    }
  }
}
