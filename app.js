let tareas = JSON.parse(localStorage.getItem('tareas')) || [];
let indiceActual = null;

const inputTarea = document.getElementById('input-tarea');
const btnAgregar = document.getElementById('btn-agregar');
const listaTareas = document.getElementById('lista-tareas');

const modalOverlay = document.getElementById('modal-overlay');
const modalTitulo = document.getElementById('modal-titulo');
const campoFecha = document.getElementById('campo-fecha');
const modalFecha = document.getElementById('modal-fecha');
const modalHora = document.getElementById('modal-hora');
const modalGuardar = document.getElementById('modal-guardar');
const modalCancelar = document.getElementById('modal-cancelar');

function guardarTareas() {
  localStorage.setItem('tareas', JSON.stringify(tareas));
}

function formatearFecha(fechaISO) {
  const [year, month, day] = fechaISO.split('-');
  return `${day}/${month}/${year}`;
}

function renderTareas() {
  listaTareas.innerHTML = '';

  if (tareas.length === 0) {
    listaTareas.innerHTML = '<li class="tarea-vacia">No tienes pendientes por clasificar</li>';
    return;
  }

  tareas.forEach((tarea, index) => {
    const li = document.createElement('li');

    let infoTiempo = '';
    if (tarea.urgencia === 'urgente' && tarea.hora) {
      infoTiempo = `<div style="font-size:12px; color:#5B7A9D; margin-top:4px;">🕐 Hoy a las ${tarea.hora}</div>`;
    } else if (tarea.urgencia === 'no-urgente' && tarea.fecha) {
      infoTiempo = `<div style="font-size:12px; color:#5B7A9D; margin-top:4px;">📅 ${formatearFecha(tarea.fecha)}${tarea.hora ? ' — ' + tarea.hora : ''}</div>`;
    }

    li.innerHTML = `
      <div class="tarea-item">
        <div class="tarea-texto">
          <span style="${tarea.completada ? 'text-decoration: line-through; color: #9AAFC4;' : ''}">
            ${tarea.texto}
          </span>
          <button class="btn-completar ${tarea.completada ? 'hecha' : ''}" data-index="${index}" data-accion="completar"></button>
        </div>
        <div class="grupo-etiquetas">
          <div class="fila">
            <span class="etiqueta ${tarea.urgencia === 'urgente' ? 'activa-urgente' : ''}" data-index="${index}" data-accion="urgente">🔴 Urgente (Hoy)</span>
            <span class="etiqueta ${tarea.urgencia === 'no-urgente' ? 'activa-normal' : ''}" data-index="${index}" data-accion="no-urgente">No urgente (Semana)</span>
          </div>
        </div>
        ${infoTiempo}
      </div>
    `;

    listaTareas.appendChild(li);
  });
}

function agregarTarea() {
  const texto = inputTarea.value.trim();
  if (texto === '') return;

  tareas.push({ texto, completada: false, urgencia: null, fecha: null, hora: null });
  guardarTareas();
  renderTareas();

  inputTarea.value = '';
  inputTarea.focus();
}

function abrirModal(index, tipo) {
  indiceActual = index;
  const tarea = tareas[index];

  if (tipo === 'urgente') {
    modalTitulo.textContent = '¿A qué hora lo harás hoy?';
    campoFecha.style.display = 'none';
  } else {
    modalTitulo.textContent = '¿Qué día y a qué hora?';
    campoFecha.style.display = 'block';
  }

  modalFecha.value = tarea.fecha || '';
  modalHora.value = tarea.hora || '';
  modalOverlay.classList.add('activo');
}

function cerrarModal() {
  modalOverlay.classList.remove('activo');
  indiceActual = null;
}

modalGuardar.addEventListener('click', function() {
  if (indiceActual === null) return;
  const tarea = tareas[indiceActual];

  if (tarea.urgencia === 'no-urgente') {
    tarea.fecha = modalFecha.value || null;
  } else {
    tarea.fecha = null;
  }
  tarea.hora = modalHora.value || null;

  guardarTareas();
  renderTareas();
  cerrarModal();
  programarRecordatorio(tarea);
});

modalCancelar.addEventListener('click', cerrarModal);

listaTareas.addEventListener('click', function(e) {
  const index = e.target.dataset.index;
  const accion = e.target.dataset.accion;
  if (index === undefined) return;

  if (accion === 'completar') {
    tareas[index].completada = !tareas[index].completada;
    guardarTareas();
    renderTareas();
    if (tareas[index].completada) {
      festejarMascota();
    }
  } else if (accion === 'urgente' || accion === 'no-urgente') {
    tareas[index].urgencia = accion;
    guardarTareas();
    renderTareas();
    abrirModal(index, accion);
  }
});

btnAgregar.addEventListener('click', agregarTarea);
inputTarea.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') agregarTarea();
});

// ===== CONFETI MASIVO =====
const colores = ['#2E6FBF', '#FF3B30', '#FFD54F', '#4CAF50', '#FF7A99', '#9C27B0', '#00BCD4'];

function crearConfeti() {
  const contenedor = document.getElementById('confeti-contenedor');
  contenedor.innerHTML = '';

  for (let i = 0; i < 80; i++) {
    const pieza = document.createElement('div');
    pieza.className = 'confeti-pieza';
    pieza.style.left = Math.random() * 100 + 'vw';
    pieza.style.width = (8 + Math.random() * 12) + 'px';
    pieza.style.height = (8 + Math.random() * 12) + 'px';
    pieza.style.background = colores[Math.floor(Math.random() * colores.length)];
    pieza.style.animationDuration = (2 + Math.random() * 2) + 's';
    pieza.style.animationDelay = (Math.random() * 0.5) + 's';
    contenedor.appendChild(pieza);
  }
}

// ===== CELEBRACIÓN ÉPICA =====
function festejarMascota() {
  const totalCompletadas = tareas.filter(t => t.completada).length;

  const titulo = document.getElementById('celebracion-titulo');
  const mensaje = document.getElementById('celebracion-mensaje');
  const mascota = document.querySelector('.celebracion-mascota');

  if (totalCompletadas === 1) {
    titulo.textContent = '¡Lo lograste!';
    mensaje.textContent = 'Completaste tu primera tarea 🎉';
  } else if (totalCompletadas % 5 === 0) {
    titulo.textContent = '¡Imparable!';
    mensaje.textContent = `Ya llevas ${totalCompletadas} tareas completadas 🔥`;
  } else {
    const frases = [
      '¡Excelente trabajo! 🎉',
      '¡Sigue así! 💪',
      '¡Una menos, vas muy bien! ✨',
      '¡Tu mascota está orgullosa! 🐾',
      '¡Eres una bestia! 🚀'
    ];
    titulo.textContent = '¡Bien hecho!';
    mensaje.textContent = frases[Math.floor(Math.random() * frases.length)];
  }

  crearConfeti();

  const overlay = document.getElementById('celebracion-overlay');
  overlay.classList.add('activo');

  mascota.classList.add('fiesta');

  setTimeout(() => {
    overlay.classList.remove('activo');
    mascota.classList.remove('fiesta');
  }, 2500);
}

// Cerrar celebración si le da clic
document.getElementById('celebracion-overlay').addEventListener('click', function() {
  this.classList.remove('activo');
  const mascota = document.querySelector('.celebracion-mascota');
  mascota.classList.remove('fiesta');
});

function pedirPermisoNotificaciones() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function programarRecordatorio(tarea) {
  pedirPermisoNotificaciones();
  // La lógica real de "un día antes" se agrega en el siguiente paso
}

// Inicializar
renderTareas();