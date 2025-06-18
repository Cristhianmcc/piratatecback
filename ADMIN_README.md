# Panel de Administración para Pirata Tecnológico

Este panel de administración te permite gestionar fácilmente todos los programas en tu sitio web. A continuación, encontrarás instrucciones para configurarlo y utilizarlo.

## Configuración Inicial

1. **Configurar variables de entorno**:
   - Asegúrate de tener configuradas todas las variables en el archivo `.env`:
   ```
   CLOUDINARY_CLOUD_NAME=tu_cloud_name
   CLOUDINARY_API_KEY=tu_api_key
   CLOUDINARY_API_SECRET=tu_api_secret
   ADMIN_EMAIL=tu_email@ejemplo.com
   ADMIN_PASSWORD=tu_contraseña
   ```

2. **Crear una cuenta en Cloudinary**:
   - Ve a [Cloudinary](https://cloudinary.com/) y crea una cuenta gratuita
   - Obtén tus credenciales del Dashboard y colócalas en el archivo `.env`

## Acceso al Panel de Administración

### API Backend

El panel de administración se comunica con el backend a través de una API REST:

- **URL Base**: `http://localhost:8080/api/admin`
- **Autenticación**: JWT (JSON Web Tokens)

### Endpoints Principales

1. **Autenticación**:
   - `POST /api/admin/login`: Iniciar sesión como administrador
   ```json
   {
     "email": "admin@piratatecnologico.com",
     "password": "admin123"
   }
   ```

2. **Gestión de Programas**:
   - `GET /api/admin/programs`: Obtener todos los programas (con paginación)
   - `GET /api/admin/programs/:id`: Obtener un programa específico por ID
   - `POST /api/admin/programs`: Crear un nuevo programa
   - `PUT /api/admin/programs/:id`: Actualizar un programa existente
   - `DELETE /api/admin/programs/:id`: Eliminar un programa

3. **Gestión de Imágenes**:
   - `POST /api/admin/programs/:id/thumbnail`: Actualizar la imagen en miniatura
   - `POST /api/admin/programs/:id/screenshots`: Añadir capturas de pantalla
   - `DELETE /api/admin/screenshots`: Eliminar una captura de pantalla

4. **Importación Masiva**:
   - `POST /api/admin/import/csv`: Importar programas desde un archivo CSV
   - Usa el archivo `ejemplo_import.csv` como plantilla

5. **Estadísticas**:
   - `GET /api/admin/stats/dashboard`: Obtener estadísticas para el dashboard

## Estructura de Datos

### Programa

Los programas tienen la siguiente estructura:

```json
{
  "name": "Nombre del Programa",
  "description": "Descripción corta",
  "fullDescription": "Descripción completa con formato HTML",
  "category": "Productividad",
  "version": "1.0.0",
  "platform": ["Windows", "MacOS"],
  "developer": "Nombre del Desarrollador",
  "license": "Tipo de Licencia",
  "website": "https://ejemplo.com",
  "thumbnail": "URL de la imagen en miniatura",
  "screenshots": ["URL1", "URL2"],
  "downloadLink": "URL de descarga directa",
  "features": ["Característica 1", "Característica 2"],
  "requirements": {
    "minimal": ["Req 1", "Req 2"],
    "recommended": ["Req 1", "Req 2"]
  }
}
```

## Importación Masiva desde CSV

Para importar programas en masa:

1. Prepara un archivo CSV con las columnas necesarias (ver `ejemplo_import.csv`)
2. Envía el archivo a través del endpoint `POST /api/admin/import/csv` 
3. El servidor procesará cada fila y creará los programas correspondientes

## Seguridad

- El acceso al panel de administración está protegido por autenticación JWT
- Solo usuarios con rol "admin" pueden acceder a estas rutas
- Las contraseñas se almacenan encriptadas con bcrypt
- Por defecto, se crea un usuario administrador con las credenciales definidas en `.env`

## Gestión de Imágenes

Las imágenes se almacenan en Cloudinary para mejor rendimiento y escalabilidad:

- **Thumbnails**: Imágenes en miniatura optimizadas (300x300)
- **Screenshots**: Capturas de pantalla optimizadas (ancho máximo 1280px)

## Recomendaciones

- **Imágenes**: Usa formatos modernos como WebP para mejor rendimiento
- **Descripciones**: Puedes usar HTML en el campo `fullDescription` para formatear el texto
- **Categorías**: Utiliza las categorías predefinidas para mantener la consistencia
- **Requisitos**: Separa claramente los requisitos mínimos de los recomendados
