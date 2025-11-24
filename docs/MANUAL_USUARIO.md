# Manual de Usuario — VaultLocker

Guía rápida para instalar y usar la extensión de gestión de contraseñas VaultLocker en Google Chrome o Microsoft Edge (Chromium).

## 1. Antes de empezar
- Navegador: Chrome o Edge con modo desarrollador para extensiones.
- Backend/API: ejecuta el backend de VaultLocker en `http://localhost:3000` (o la URL definida en `VITE_API_URL`). Si usas este repo, levanta `vaultlocker-backend` antes de probar.
- Código fuente: repositorio clonado en tu equipo.

## 2. Instalar la extensión (modo desarrollador)
1) En la raíz del proyecto ejecuta `npm install` y luego `npm run build` para generar la carpeta `dist/`.
2) Abre `chrome://extensions/` y activa **Modo desarrollador**.
3) Haz clic en **Cargar descomprimida** y selecciona la carpeta `dist/`.
4) (Opcional) Ancla el ícono de VaultLocker junto a la barra de direcciones para acceso rápido.

## 3. Crear cuenta y guardar el kit de recuperación
1) Haz clic en el ícono de la extensión y elige **Crear Cuenta**.
2) Completa **Email**, **Contraseña** y define un **PIN maestro de 6 dígitos** (pide confirmación).
3) Al terminar verás el **Kit de recuperación** con tu PIN y un **código de recuperación**:
   - Usa los botones **Copiar** o **Descargar .txt** y guárdalos en un lugar seguro.
   - Pulsa **Ir al dashboard** para continuar.

## 4. Iniciar sesión
1) Desde el popup selecciona **Iniciar Sesión**.
2) Ingresa tu email y contraseña. La sesión queda almacenada para la extensión y el dashboard.

## 5. Guardado automático de credenciales
- Con sesión iniciada, VaultLocker detecta formularios de login y guarda usuario + contraseña cifrados al enviarlos.
- Verás un toast en la esquina inferior derecha del sitio confirmando el guardado.
- Las credenciales quedan asociadas a tu usuario y se muestran tanto en el popup como en el panel completo.

## 6. Uso rápido del popup
- Muestra el total de credenciales y una lista con sitio y usuario.
- Usa el buscador para filtrar por nombre de sitio o usuario.
- Botones **Panel → / Abrir Panel Completo** llevan al dashboard para ver/gestionar detalles.

## 7. Panel completo (dashboard)
1) Ábrelo desde el popup.
2) Vista principal:
   - **Buscador global** y estadísticas (total y sitios únicos).
   - **Perfil**: correo, fecha de creación y número de credenciales.
   - **Lista de credenciales**: haz clic en cualquiera para abrir el modal de detalle.
3) **Desbloquear y copiar**:
   - Ingresa tu **PIN maestro (6 dígitos)** para revelar usuario y contraseña.
   - Usa **Copiar** para llevarlos al portapapeles.
4) **Eliminar**: dentro del modal, el botón **Eliminar** borra la credencial (extensión y backend).

## 8. Recuperar acceso (olvidé mi contraseña)
1) En la pantalla de login del dashboard pulsa **Recuperar acceso**.
2) Ingresa **Email**, **PIN maestro**, **Código de recuperación** y define la **nueva contraseña**.
3) Si los datos son correctos, verás un mensaje de éxito y podrás iniciar sesión de nuevo.

## 9. Cerrar sesión
- En el dashboard, botón **Cerrar Sesión** (parte inferior de la barra lateral).

## 10. Consejos y solución de problemas
- Guarda fuera de línea tu **PIN maestro** y el **código de recuperación**; sin ellos no se revelan datos ni se recupera la cuenta.
- Si no ves el toast de guardado automático, verifica que la extensión esté activa y que estés logueado.
- Si las credenciales no aparecen:
  - Reabre sesión y refresca la página; confirma que usas el mismo usuario con el que se guardaron.
  - Borra el texto del buscador para mostrar toda la lista.
- Errores de API: asegúrate de que el backend esté corriendo en la URL configurada antes de probar la extensión.
