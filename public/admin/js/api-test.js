/**
 * Archivo de cliente para realizar pruebas con la API
 */

// Función para verificar el estado de la API
async function checkApi() {
  const apiStatus = document.getElementById('apiStatus');
  apiStatus.innerHTML = '<div class="spinner-border text-primary" role="status"></div> Verificando API...';
  
  try {
    const response = await fetch('/api/check/check');
    const data = await response.json();
    
    if (data.success) {
      apiStatus.innerHTML = `
        <div class="alert alert-success">
          <i class="fas fa-check-circle me-2"></i>
          API funcionando correctamente
          <div class="small mt-1">Timestamp: ${new Date(data.timestamp).toLocaleString()}</div>
        </div>
      `;
    } else {
      throw new Error('La API respondió con un error');
    }
  } catch (error) {
    apiStatus.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-circle me-2"></i>
        Error al conectar con la API
        <div class="small mt-1">${error.message}</div>
      </div>
    `;
  }
}

// Función para verificar los directorios
async function checkDirectories() {
  const dirStatus = document.getElementById('directoryStatus');
  dirStatus.innerHTML = '<div class="spinner-border text-primary" role="status"></div> Verificando directorios...';
  
  try {
    const response = await fetch('/api/check/check-dirs');
    const data = await response.json();
    
    if (data.success) {
      let html = '<div class="list-group">';
      
      data.directories.forEach(dir => {
        const statusClass = dir.exists && dir.writable ? 'success' : 'danger';
        const icon = dir.exists && dir.writable ? 'check-circle' : 'exclamation-circle';
        
        html += `
          <div class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <i class="fas fa-folder me-2 text-warning"></i>
              ${dir.name}
              <div class="small text-muted">${dir.path}</div>
            </div>
            <span class="badge bg-${statusClass} rounded-pill">
              <i class="fas fa-${icon}"></i> 
              ${dir.exists ? (dir.writable ? 'OK' : 'Sin permisos') : 'No existe'}
            </span>
          </div>
        `;
      });
      
      html += '</div>';
      dirStatus.innerHTML = html;
    } else {
      throw new Error('Error al verificar directorios');
    }
  } catch (error) {
    dirStatus.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-circle me-2"></i>
        Error al verificar directorios
        <div class="small mt-1">${error.message}</div>
      </div>
    `;
  }
}

// Función para probar la autenticación
async function testAuth() {
  const authResult = document.getElementById('authResult');
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  if (!email || !password) {
    authResult.innerHTML = `
      <div class="alert alert-warning">
        <i class="fas fa-exclamation-triangle me-2"></i>
        Ingresa email y contraseña
      </div>
    `;
    return;
  }
  
  authResult.innerHTML = '<div class="spinner-border text-primary" role="status"></div> Verificando credenciales...';
  
  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success && data.token) {
      // Guardar token y datos de usuario
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.user));
      
      authResult.innerHTML = `
        <div class="alert alert-success">
          <i class="fas fa-check-circle me-2"></i>
          Autenticación exitosa
          <div class="small mt-1">Usuario: ${data.user.name || data.user.username}</div>
          <div class="small">Token guardado en localStorage</div>
          <div class="mt-2">
            <button class="btn btn-sm btn-primary" onclick="window.location.href='dashboard.html'">
              Ir al Dashboard
            </button>
          </div>
        </div>
      `;
    } else {
      throw new Error(data.message || 'Error de autenticación');
    }
  } catch (error) {
    authResult.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-circle me-2"></i>
        Error de autenticación
        <div class="small mt-1">${error.message}</div>
      </div>
    `;
  }
}

// Cargar resultados al iniciar la página
document.addEventListener('DOMContentLoaded', function() {
  checkApi();
  checkDirectories();
  
  // Si hay un token almacenado, mostrar opción para ir al dashboard
  const token = localStorage.getItem('adminToken');
  const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
  
  if (token && (user.username || user.name)) {
    document.getElementById('savedAuth').innerHTML = `
      <div class="alert alert-info mb-0">
        <i class="fas fa-info-circle me-2"></i>
        Ya tienes una sesión iniciada como <strong>${user.name || user.username}</strong>
        <div class="mt-2">
          <button class="btn btn-sm btn-primary me-2" onclick="window.location.href='dashboard.html'">
            Ir al Dashboard
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="logout()">
            Cerrar Sesión
          </button>
        </div>
      </div>
    `;
  }
});

// Función para cerrar sesión
function logout() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  window.location.reload();
}
