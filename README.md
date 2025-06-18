# Pirata Tecnológico - Backend API

Este es el backend para la aplicación "Pirata Tecnológico", un catálogo de programas y software.

## Requisitos

- Node.js (v14.x o superior)
- MongoDB (local o MongoDB Atlas)

## Configuración Inicial

1. Instala las dependencias:

```bash
cd c:\5tociclo\Mi pagina web\pirata-backend
npm install
```

2. Configura las variables de entorno:
   - El archivo `.env` ya está configurado con valores por defecto para desarrollo local
   - Ajusta la conexión a MongoDB según sea necesario

3. Ejecuta la migración de datos (esto importará los programas del frontend al backend):

```bash
node utils/migrateData.js
```

## Ejecutar el Servidor

Para iniciar el servidor en modo desarrollo con recarga automática:

```bash
npm run dev
```

Para iniciar el servidor en modo producción:

```bash
npm start
```

El servidor estará disponible en `http://localhost:5000`.

## Integración con el Frontend

El frontend ya está configurado para comunicarse con esta API a través de los archivos:

- `src/utils/apiConfig.js` - Contiene la URL base de la API
- `src/utils/api.js` - Contiene todas las funciones para consumir la API

Para conectar completamente el frontend con el backend, necesitarás:

1. Asegúrate de que el backend esté ejecutándose
2. Actualiza las importaciones en los componentes relevantes del frontend

Por ejemplo, cambia:

```javascript
import { getPrograms } from '../data/programsData';
```

por:

```javascript
import { getProgramsAPI } from '../utils/api';
```

## Puntos finales de la API

### Programas

- `GET /api/programs` - Obtener todos los programas (con paginación)
- `GET /api/programs/:id` - Obtener un programa por ID
- `GET /api/programs/search` - Buscar programas
- `GET /api/programs/featured` - Obtener programas destacados
- `GET /api/programs/category/:category` - Obtener programas por categoría
- `POST /api/programs` - Crear un nuevo programa (requiere autenticación como admin)
- `PUT /api/programs/:id` - Actualizar un programa (requiere autenticación como admin)
- `DELETE /api/programs/:id` - Eliminar un programa (requiere autenticación como admin)

### Autenticación

- `POST /api/auth/register` - Registrar un nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil del usuario (requiere autenticación)
- `PUT /api/auth/profile` - Actualizar perfil del usuario (requiere autenticación)

### Administración

- `GET /api/admin/dashboard` - Obtener estadísticas para el panel de administración
- `GET /api/admin/activity` - Obtener registro de actividades recientes
- `GET /api/admin/users` - Obtener lista de usuarios (solo administradores)
- `POST /api/admin/import-csv` - Importar programas desde un archivo CSV

## Utilidades

El proyecto incluye varias utilidades para facilitar la administración y el desarrollo:

### resetAdmin.js

Esta utilidad permite crear o restablecer usuarios administradores.

```bash
node utils/resetAdmin.js
```

Ofrece tres opciones:
1. Crear un nuevo administrador (conservando los existentes)
2. Restablecer contraseña de un administrador existente
3. Eliminar todos los usuarios y crear un nuevo administrador

### backup.js

Utilidad para crear respaldos de la base de datos.

```bash
node utils/backup.js
```

Permite crear respaldos en dos formatos:
1. Usando mongodump (requiere herramientas de MongoDB instaladas)
2. Usando respaldo nativo en formato JSON

### healthCheck.js

Verifica la salud del sistema y muestra información relevante.

```bash
node utils/healthCheck.js
```

Muestra:
- Información del sistema operativo y hardware
- Estado de servicios (MongoDB, Node.js)
- Estadísticas de la base de datos
- Estado de archivos críticos

### importCsv.js

Importa programas desde un archivo CSV a la base de datos.

```bash
node utils/importCsv.js <ruta-al-archivo-csv>
```

### generateTestData.js

Genera datos de prueba para desarrollo y testing.

```bash
node utils/generateTestData.js
```

Permite generar:
1. Usuarios de prueba
2. Programas de prueba
3. Ambos

## Notas Importantes

- La base de datos se inicializará con los datos del frontend la primera vez que ejecutes la migración
- La API está configurada para servir archivos estáticos desde la carpeta `uploads`
- Todas las operaciones de administración requieren autenticación con un token JWT válido
- Se registran las actividades de administración en la base de datos

## Próximos Pasos

1. Implementa una pantalla de administración en el frontend para gestionar programas
2. Añade formularios para crear/editar programas con subida de imágenes
3. Crea un sistema de autenticación completo en el frontend
