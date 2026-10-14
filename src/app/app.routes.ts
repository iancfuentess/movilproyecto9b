import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "login",
    loadComponent: () => import("./login/login.page").then((m) => m.LoginPage),
  },

  {
    path: "usuarios",
    loadComponent: () =>
      import("./usuarios/usuarios.page").then((m) => m.UsuariosPage),
  },

  {
    path: "gestionar-usuarios",
    loadComponent: () =>
      import("./gestionar-usuarios/gestionar-usuarios.page").then(
        (m) => m.GestionarUsuariosPage,
      ),
  },

  {
    path: "actividad",
    loadComponent: () =>
      import("./actividad/actividad.page").then((m) => m.ActividadPage),
  },

  {
    path: "mis-lecturas",
    loadComponent: () =>
      import("./mis-lecturas/mis-lecturas.page").then((m) => m.MisLecturasPage),
  },

  // NUEVA PÁGINA: BIBLIOTECA
  {
    path: "biblioteca",
    loadComponent: () =>
      import("./biblioteca/biblioteca.page").then((m) => m.BibliotecaPage),
  },

  {
    path: "tabs",
    loadChildren: () => import("./tabs/tabs.routes").then((m) => m.routes),
  },

  {
    path: "",
    redirectTo: "login",
    pathMatch: "full",
  },

  // SIEMPRE DEBE IR AL FINAL
  {
    path: "**",
    redirectTo: "login",
  },
];
