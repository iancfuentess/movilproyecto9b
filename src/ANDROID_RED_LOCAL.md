# Uso en Android por red local

1. PC y Android deben estar en la misma red Wi-Fi/LAN.
2. En Windows ejecuta `ipconfig` y localiza la IPv4 del adaptador activo, por ejemplo `192.168.1.120`.
3. XAMPP: Apache debe estar iniciado en puerto 80 y MySQL en 3306. El teléfono NO se conecta directamente a MySQL: Android llama a PHP por Apache (`http://IP:80/ionic-api/...`) y PHP se conecta localmente a MySQL.
4. Permite Apache/httpd en el Firewall de Windows para redes privadas.
5. Prueba desde el navegador del teléfono: `http://192.168.1.120/ionic-api/users.php`. Si responde (aunque indique falta de token), la ruta de red funciona.
6. En el login escribe `192.168.1.120:80` en el nuevo campo Servidor. La app guarda ese host en Capacitor Preferences y login, usuarios, gestionar usuarios y actividad construyen sus endpoints desde él.
7. Como usas HTTP (no HTTPS), Android puede bloquear tráfico cleartext. En el proyecto Android, revisa `android/app/src/main/AndroidManifest.xml` y en `<application ...>` agrega `android:usesCleartextTraffic="true"` para desarrollo local. Mantén también el permiso `android.permission.INTERNET`.
8. Desde la raíz del proyecto ejecuta `npx ionic build` y después `npx cap sync android`. Para compilar/ejecutar usa `npx ionic cap run android`. Si solo quieres abrir Android Studio: `npx cap open android` o `npx ionic cap open android`.

Nota: el comando correcto es `android`, no `andorid`. `ionic cap build android` puede usarse si tu CLI lo admite, pero `npx ionic build` + `npx cap sync android` + `npx ionic cap run android` hace explícito el flujo.
