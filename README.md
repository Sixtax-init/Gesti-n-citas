# 📅 Sistema de Gestión de Citas — TECNL

Aplicación web full-stack para gestionar citas entre alumnos y especialistas (Psicología, Tutorías, Nutrición) del Tecnológico de Nuevo León.

---

## 🗂️ Estructura del Proyecto

```
Gesti-n-citas/
├── project_final/   # Frontend → React + Vite + TypeScript
└── server/          # Backend  → Node.js + Express + Prisma + SQLite
```

---

## 👥 Usuarios de Prueba

| Rol          | Email                          | Contraseña  |
|--------------|--------------------------------|-------------|
| Admin        | admin@instituto.edu.mx         | `admin123`  |
| Alumno       | alumno@instituto.edu.mx        | `alumno123` |
| Psicólogo    | psicologo@instituto.edu.mx     | `esp123`    |
| Tutora       | tutor@instituto.edu.mx         | `esp123`    |
| Nutriólogo   | nutriologo@instituto.edu.mx    | `esp123`    |

---

## 🚀 Puesta en Marcha

Necesitas tener instalado **Node.js 18+** y **npm**.

Abre **dos terminales** de forma simultánea — una para el backend y otra para el frontend.

---

### 🔧 Terminal 1 — Backend (API + Base de Datos)

```bash
# 1. Entrar a la carpeta del servidor
cd server

# 2. Instalar dependencias
npm install

# 3. Crear el archivo de variables de entorno
#    (Solo la primera vez — puedes copiar el ejemplo de abajo)
echo "DATABASE_URL=file:./prisma/dev.db" > .env
echo "JWT_SECRET=super-secret-key-123"  >> .env

# 4. Generar el cliente de Prisma
npx prisma generate

# 5. Crear las tablas en la base de datos SQLite
npx prisma migrate deploy
# Si es la primera vez y no hay migraciones aún, usa:
#   npx prisma db push

# 6. Poblar la base de datos con datos iniciales (solo la primera vez)
npx ts-node src/seed.ts

# 7. Iniciar el servidor en modo desarrollo (puerto 3000)
npm run dev
```

> ✅ El servidor queda corriendo en **http://localhost:3000**

---

### 🌐 Terminal 2 — Frontend (React)

```bash
# 1. Entrar a la carpeta del frontend
cd project_final

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo (puerto 5173)
npm run dev
```

> ✅ La aplicación queda disponible en **http://localhost:5173**

---

## 🏗️ Arquitectura

### Frontend (`project_final/`)

- **Framework**: React 18 + TypeScript
- **Bundler**: Vite
- **Estilos**: TailwindCSS
- **Estado global**: React Context API
  - `AuthContext` — Manejo de sesión y JWT
  - `StoreContext` — Especialistas, citas, eventos, recursos

### Backend (`server/`)

- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Prisma (conexión a SQLite en desarrollo)
- **Auth**: JSON Web Tokens (JWT)
- **Contraseñas**: bcryptjs (hash + salt)

### API REST — Endpoints Disponibles

| Método | Ruta                                          | Descripción                        |
|--------|-----------------------------------------------|------------------------------------|
| POST   | `/api/auth/login`                             | Iniciar sesión                     |
| POST   | `/api/auth/register`                          | Registrar usuario nuevo            |
| GET    | `/api/specialists`                            | Listar especialistas               |
| GET    | `/api/specialists/:id/available-slots?date=`  | Slots disponibles en una fecha     |
| POST   | `/api/specialists/:id/schedules`              | Agregar horario a especialista     |
| DELETE | `/api/specialists/:id/schedules/:slotId`      | Eliminar horario                   |
| GET    | `/api/appointments`                           | Listar citas (con filtros opcionales) |
| POST   | `/api/appointments`                           | Crear cita                         |
| PATCH  | `/api/appointments/:id/status`                | Actualizar estado de cita          |
| PATCH  | `/api/appointments/:id/reschedule`            | Reagendar cita                     |
| GET    | `/api/events`                                 | Listar eventos                     |
| POST   | `/api/events`                                 | Crear evento                       |
| GET    | `/api/resources`                              | Listar recursos                    |
| POST   | `/api/resources`                              | Crear recurso                      |
| GET    | `/api/users`                                  | Listar usuarios (admin)            |

---

## 🗄️ Modelos de Base de Datos

```
User          → Alumno, Especialista o Admin
Specialist    → Perfil del especialista, vinculado a User
ScheduleSlot  → Días y horas disponibles por especialista
Appointment   → Cita entre alumno y especialista
AppEvent      → Evento o taller publicado
Resource      → Material de apoyo (infografías, videos)
Notification  → Alertas internas del sistema
```

---

## 🛠️ Scripts Disponibles

### Backend
| Comando            | Descripción                            |
|--------------------|----------------------------------------|
| `npm run dev`      | Inicia servidor con nodemon            |
| `npm run build`    | Compila TypeScript a JavaScript        |
| `npm start`        | Inicia el servidor de producción       |
| `npx prisma studio`| Abre interfaz visual de la base de datos |
| `npx ts-node src/seed.ts` | Re-pobla la BD con datos iniciales |

### Frontend
| Comando            | Descripción                            |
|--------------------|----------------------------------------|
| `npm run dev`      | Inicia servidor de desarrollo          |
| `npm run build`    | Genera el build de producción          |
| `npm run preview`  | Previsualiza el build de producción    |

---

## ⚙️ Variables de Entorno

Crea un archivo `.env` dentro de `server/` con el siguiente contenido:

```env
DATABASE_URL=file:./prisma/dev.db
JWT_SECRET=super-secret-key-123
PORT=3000
```

> ⚠️ Para producción, agregar este archivo a `.gitignore` y cambiar `JWT_SECRET` por una cadena aleatoria y segura.

---

## 🚀 Despliegue en VPS

Una vez en producción en el servidor Ubuntu/Debian:

1. **Base de datos**: Cambiar SQLite → PostgreSQL (actualizar `DATABASE_URL` y `schema.prisma`)
2. **Frontend**: Correr `npm run build` y servir la carpeta `dist/` con Nginx
3. **Backend**: Usar PM2 para mantener el proceso activo (`pm2 start dist/index.js`)
4. **Proxy**: Configurar Nginx para enrutar `/api/*` al backend y el resto al frontend estático
