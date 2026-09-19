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
    path: "tabs",
    loadChildren: () => import("./tabs/tabs.routes").then((m) => m.routes),
  },

  {
    path: "",
    redirectTo: "login",
    pathMatch: "full",
  },

  {
    path: "**",
    redirectTo: "login",
  },
];
