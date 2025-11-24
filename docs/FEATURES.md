# Características de VaultLocker

## Propuesta de valor
- Simplicidad primero: interfaz minimalista para ver y gestionar credenciales sin complejidad ni ruido.
- Pensado para usuarios con conocimiento básico o personas mayores: flujos cortos, lenguaje claro y pocas decisiones.
- Seguridad de base: cifrado local y permisos mínimos en la extensión (MV3).

## Componentes y partes de la solución
- Extensión MV3 (Chrome/Chromium): popup y dashboard ligeros para listar, crear y borrar credenciales.
- Lógica de bóveda (service worker): almacena credenciales cifradas por usuario en `chrome.storage.local`.
- WebCrypto: cifrado AES-256-GCM con derivación PBKDF2 (IV aleatorio por registro) en `src/utils/crypto.js`.
- Backend NestJS (en desarrollo): API modular para autenticación y futura sincronización de credenciales.
- Manifest y permisos: MV3 con `storage` y `tabs`; recursos acotados a la extensión; sin código remoto.

## Funcionalidades actuales
- Guardado de credenciales: sitio, usuario y contraseña cifrada (mensajes `SAVE_CREDENTIAL`).
- Listado y consulta: obtiene credenciales y, bajo petición, descifra para sugerir autocompletar.
- Eliminación segura: borra registros individuales manteniendo aislamiento por usuario.
- Aislamiento por usuario: la bóveda se segmenta con claves por ID normalizado.
- Validaciones y seguridad backend: `ValidationPipe` con `whitelist`, `helmet`, CORS configurable y Swagger protegido (en `vaultlocker-backend/src/main.ts`).

## Tipos de usuario
- Usuario regular: acceso al servicio con anuncios ligeros en la interfaz gratuita.
- Usuario premium: mismas funciones sin anuncios; suscripción de 50 pesos mensuales.
- Proveedores: terceros de infraestructura o integraciones (correo, nube) con acceso mínimo y contractual; no ven credenciales.
- Gobierno: acceso solo ante requerimientos legales formales; no es un rol de uso diario dentro de la app.

## Limitaciones conocidas
- Clave temporal: la derivación usa una clave fija; falta migrar a passphrase del usuario (Argon2id/PBKDF2 con salt único).
- Permisos amplios del content script: `matches: <all_urls>`; se debe acotar o pedir permisos bajo demanda.
- Sin sincronización ni recuperación: las credenciales viven en el dispositivo; no hay copia en la nube ni recuperación de cuenta.
- Cobertura de pruebas de seguridad: aún no hay SAST/DAST automatizado ni CSP explícita en el frontend.

## Casos de uso principales
- “Ver y copiar rápido” credenciales guardadas.
- Guardar accesos de sitios frecuentes sin complejidad de cofres avanzados.
- Usuarios que priorizan claridad y pocos pasos sobre funcionalidades avanzadas.

## Referencia al anexo
- Para más detalle ver Anexo N: capturas de flujo de la interfaz y ejemplos de uso (añadir o enlazar cuando esté disponible).
