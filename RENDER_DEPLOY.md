# Despliegue en Render

Este documento proporciona instrucciones para desplegar el backend de Pirata Tecnológico en Render.

## Requisitos Previos

1. **Cuenta de Render**: Regístrate en [render.com](https://render.com)
2. **MongoDB Atlas**: Crea una base de datos en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
3. **Cloudinary**: Configura una cuenta en [Cloudinary](https://cloudinary.com)

## Pasos para el Despliegue

### 1. Preparar Base de Datos en MongoDB Atlas

1. Crea un nuevo cluster en MongoDB Atlas
2. Configura un usuario y contraseña
3. Agrega tu dirección IP a la lista de IPs permitidas (o `0.0.0.0/0` para permitir todas)
4. Obtén la cadena de conexión URI

### 2. Configurar Variables de Entorno en Render

En el dashboard de Render, cuando crees tu servicio web, agrega las siguientes variables de entorno:

| Variable | Descripción |
|----------|-------------|
| `NODE_ENV` | Establece como `production` |
| `PORT` | Render asignará uno automáticamente |
| `MONGODB_URI` | Tu cadena de conexión de MongoDB Atlas |
| `JWT_SECRET` | Una cadena larga y segura para firmar tokens |
| `CORS_ORIGIN` | URL de tu frontend (ej: https://mi-frontend.com) |
| `BASE_URL` | La URL de tu backend en Render |
| `CLOUDINARY_CLOUD_NAME` | Tu cloud name de Cloudinary |
| `CLOUDINARY_API_KEY` | Tu API key de Cloudinary |
| `CLOUDINARY_API_SECRET` | Tu API secret de Cloudinary |

### 3. Desplegar en Render

1. Inicia sesión en [Render](https://dashboard.render.com)
2. Haz clic en "New" > "Web Service"
3. Conecta tu repositorio de GitHub/GitLab
4. Configura:
   - **Name**: pirata-backend (o el nombre que prefieras)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Selecciona el plan que necesites
5. Agrega las variables de entorno mencionadas anteriormente
6. Haz clic en "Create Web Service"

### 4. Verificar el Despliegue

1. Espera a que se complete el despliegue (puede tomar unos minutos)
2. Verifica que la API está funcionando correctamente haciendo una solicitud a la URL proporcionada por Render

## Solución de Problemas

- **Error de conexión a MongoDB**: Verifica que la cadena de conexión sea correcta y que tu IP esté permitida en Atlas
- **Problemas con archivos estáticos**: Asegúrate de que las rutas estén configuradas correctamente para el entorno de producción
- **Errores de CORS**: Verifica que `CORS_ORIGIN` esté configurado con la URL correcta de tu frontend

## Notas Adicionales

- Render asigna automáticamente una URL para tu servicio (ej: `https://pirata-backend.onrender.com`)
- En el plan gratuito, el servicio puede "dormir" después de períodos de inactividad
- Para evitar esto, considera actualizar a un plan pagado o configurar un servicio de "ping" para mantenerlo activo
