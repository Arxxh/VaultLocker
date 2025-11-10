# 🔐 VaultLocker – Backend

El backend de **VaultLocker** provee la **API segura y escalable** para la extensión de gestión de contraseñas.  
Está construido con una arquitectura modular basada en **NestJS**, siguiendo principios de mantenibilidad, seguridad y despliegue en contenedores.

---

## 🧠 Stack Tecnológico

| Tecnología                                                                                                             | Descripción                                                                                         |
| ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| ![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)                  | Arquitectura modular (Node.js + TypeScript), validaciones con `class-validator` y `pipes` globales. |
| ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)                  | ORM moderno con tipado fuerte y migraciones versionadas.                                            |
| ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)      | Base de datos relacional persistente para usuarios y credenciales.                                  |
| ![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)                 | (Pendiente de integración) Manejo seguro de sesiones mediante tokens.                               |
| ![Helmet](https://img.shields.io/badge/Helmet-3C873A?style=for-the-badge&logo=node.js&logoColor=white)                 | Protección ante cabeceras inseguras y configuración de seguridad HTTP.                              |
| ![CORS](https://img.shields.io/badge/CORS-FF6F00?style=for-the-badge&logo=fastify&logoColor=white)                     | Control de orígenes HTTP permitidos para comunicación frontend-backend.                             |
| ![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)               | Documentación automática de endpoints de la API.                                                    |
| ![Docker Compose](https://img.shields.io/badge/Docker--Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white) | Orquestación de contenedores (API + PostgreSQL).                                                    |
| ![dotenv](https://img.shields.io/badge/.env-000000?style=for-the-badge&logo=dotenv&logoColor=white)                    | Configuración de variables de entorno (credenciales, puertos, claves).                              |

---

## ⚙️ Módulos Principales

- **auth/** → Registro y autenticación de usuarios.
- **credentials/** → Gestión cifrada de credenciales (en desarrollo).
- **prisma/** → Esquema de base de datos y cliente Prisma.
- **config/** → Validación y carga de entorno con `@nestjs/config` y `joi`.

---

## 🚀 Despliegue

El backend corre en un contenedor independiente y se comunica con la base de datos **PostgreSQL**  
a través de la red interna definida en `docker-compose.yml`.  
Los datos persisten en el volumen `postgres_data`.

### Comandos principales:

```bash
# 1️⃣ Levantar los contenedores
docker compose up -d

# 2️⃣ Ejecutar migraciones Prisma dentro del contenedor
docker exec -it vaultlocker-backend npx prisma migrate dev --name init

# 3️⃣ Acceder a la documentación Swagger
http://localhost:3000/api/docs
```
