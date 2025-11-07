# 🔐 VaultLocker

**VaultLocker** es una extensión de **Chrome Web Store** diseñada para la **gestión segura de contraseñas** de usuarios.  
Permite guardar credenciales cifradas, supervisar formularios y ofrecer sincronización futura con un backend escalable.

---

## 📘 Descripción general

VaultLocker conecta el navegador con un sistema seguro que almacena y cifra datos del usuario.  
Está diseñado bajo una arquitectura modular con tres capas principales:

- **Extensión Web (MV3)**: ejecuta la lógica dentro del navegador.
- **Frontend React**: ofrece una interfaz moderna y fluida.
- **Backend NestJS**: gestiona datos, autenticación y sincronización.

---

## 🚀 Stack Tecnológico

### **Extensión (MV3)**

- **MV3 (Manifest Version 3)** → Base oficial de extensiones modernas de Chrome  
- **Google Chrome / Chromium** → Ejecución nativa en el navegador  
- **TypeScript** → Tipado estático y mantenibilidad  
- **Chrome Extension APIs** → Comunicación interna  
- **WebCrypto API** → Encriptación AES-GCM o Argon2id  
- **IndexedDB** → Almacenamiento local cifrado  

---

### **Frontend**

- **React + TypeScript** → Frameworks modernos para UI  
- **TailwindCSS** → Estilos rápidos y consistentes  
- **Vite + @crxjs/vite-plugin** → Empaquetado para extensiones MV3  
- **React Hook Form + Zod** → Validación de formularios  
- **Zustand / Redux Toolkit** → Gestión ligera del estado  
- **Dexie.js** → Simplificación de IndexedDB  

---

### **Backend**

- **NestJS (Node.js + TypeScript)** → Arquitectura modular y escalable  
- **Prisma ORM** → Acceso eficiente a base de datos  
- **PostgreSQL** → Base de datos relacional  
- **Swagger** → Documentación automática  
- **JWT** → Autenticación (futura)  
- **Helmet + CORS** → Seguridad HTTP  
- **Docker Compose** → Contenedorización (Postgres + API)  

---

## ⚙️ Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/Arxxh/VaultLocker.git
cd VaultLocker
