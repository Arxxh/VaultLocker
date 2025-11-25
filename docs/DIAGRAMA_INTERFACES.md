# Diagrama de interfaces – VaultLocker

Texto listo para pegar en Lucidchart AI y generar el diagrama de cómo se conectan extensión, dashboard y backend.

## Prompt para Lucidchart AI

```
Genera un diagrama de arquitectura por capas (Navegador/Extensión, Backend, Persistencia) para el proyecto VaultLocker. Usa colores distintos por capa y flechas dirigidas con etiquetas breves.

Nodos / componentes:
- Usuario del navegador.
- Popup de la extensión (React + Tailwind) [src/popup/index.html|index.js].
- Dashboard en pestaña nueva (React + Tailwind) [src/dashboard/*].
- Content Script que intercepta formularios [src/content/content.js].
- Service Worker de background que gestiona el vault local [src/background/index.js].
- Módulo WebCrypto AES-GCM (cifrado/descifrado) [src/utils/crypto.js].
- Almacenamiento Chrome Storage local (vault cifrada por usuario).
- API Backend NestJS (AuthController, CredentialsController) [vaultlocker-backend/src/*].
- Prisma ORM.
- Base de datos PostgreSQL.
- Swagger UI (documentación) junto al backend.

Flechas / relaciones:
1) Usuario → Popup: abre la extensión y ve credenciales.
2) Usuario → Dashboard: abre pestaña completa para gestionar cuenta.
3) Content Script → Background: mensaje SAVE_CREDENTIAL con {site, username, password} al detectar submit de login.
4) Background → WebCrypto → Chrome Storage: cifra (AES-GCM) y guarda credenciales por usuario (clave credentials_<userId>).
5) Popup → Background: mensajes GET_CREDENTIALS / GET_CREDENTIALS_WITH_PASSWORD para listar desde el vault local.
6) Dashboard ↔ Background: lee y borra credenciales locales (GET_CREDENTIALS, DELETE_CREDENTIAL) y escucha cambios de chrome.storage.onChanged.
7) Popup/Dashboard → API Backend: peticiones HTTP a /auth/register, /auth/login, /auth/profile, /credentials con token JWT.
8) Backend → Prisma → PostgreSQL: persiste usuarios y credenciales. Swagger UI documenta los endpoints.
9) Fallback: Dashboard lee sesión desde Chrome Storage si se abrió fuera del popup (hydrateSessionFromExtensionStorage).

Indicaciones visuales:
- Capa Navegador/Extensión en un color, Backend en otro, Persistencia en otro.
- Etiquetar líneas de Chrome runtime (runtime.sendMessage) y las de HTTP (fetch).
- Mostrar cifrado local antes de escribir en Chrome Storage.
```
