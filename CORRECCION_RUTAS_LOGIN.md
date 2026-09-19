# Corrección realizada

## Problema encontrado

El proyecto arrancaba en `/tabs/tab1` porque `app.routes.ts` estaba mal configurado.
Además, la vista visual del login seguía dentro de `src/app/tab1/`, mientras que
`src/app/login/` seguía siendo la vista vacía original.

## Corrección

- Se copió la vista y estilos de `Tab1` a `Login`.
- Se agregó el consumo del API PHP mediante Axios en `LoginPage`.
- Se corrigió `src/app/app.routes.ts`.
- La ruta inicial ahora es `/login`.
- `/tabs` sigue disponible para el resto de la aplicación.

## Antes de ejecutar

Desde la raíz del proyecto ejecuta:

```bash
npm install axios
```

Luego:

```bash
ionic serve
```

La URL inicial esperada es:

`http://localhost:8100/login`
