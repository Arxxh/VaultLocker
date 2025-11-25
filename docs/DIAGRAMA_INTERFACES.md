# Diagrama de interfaces (vista usuario) – VaultLocker

```

Nodos / pantallas:
- Popup inicial (extensión, ventana pequeña).
- Botón "Abrir panel" que abre el Dashboard en nueva pestaña.
- Estado "No autenticado" en popup: muestra acciones Login y Register.
- Estado "Autenticado" en popup: muestra listado de credenciales con buscador y contador.
- Dashboard (pestaña completa) con secciones: Login, Register, Recover, Dashboard principal (lista credenciales, perfil).

Flujos / flechas:
1) Usuario abre Popup.
2) Si no autenticado: desde Popup → Login (en Dashboard) o Register (en Dashboard) via botón/CTA.
3) Si autenticado: Popup muestra credenciales y botón para abrir Dashboard; al hacer clic va a Dashboard principal.
4) Dashboard principal permite volver a Popup (opcional) o cerrar pestaña.
5) Desde Dashboard se puede ir a Recover (recuperar cuenta) o a Login/Register si no hay sesión.

Notas visuales:
- Separar con color o contenedor la capa "Popup" y la capa "Dashboard en pestaña".
- Etiquetar flechas con la acción (ej. "Abrir panel", "Login", "Register", "Ir a Recover").
- No dibujar infraestructura backend ni almacenamiento; solo pantallas y enlaces visibles al usuario.
```
