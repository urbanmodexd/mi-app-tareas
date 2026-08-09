import { db, auth } from './firebase-init.js';
import {
  collection, addDoc, onSnapshot, doc, updateDoc, query, orderBy, serverTimestamp, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

let tareas = [];
let dibujos = [];
let indiceActual = null;
let usuarioActual = '';
let dibujando = false;
let ctxDibujo = null;
let modoRegistro = false;

const inputTarea = document.getElementById('input-tarea');
const btnAgregar = document.getElementById('btn-agregar');
const listaTareas = document.getElementById('lista-tareas');
const selectorUsuario = document.getElementById('selector-usuario');
const inputEmail = document.getElementById('input-email');
const inputPassword = document.getElementById('input-password');
const inputNombreRegistro = document.getElementById('input-nombre-registro');
const btnGuardarNombre = document.getElementById('btn-guardar-nombre');
const tituloAuth = document.getElementById('titulo-auth');
const textoCambiarModo = document.getElementById('texto-cambiar-modo');
const btnAbrirDibujo = document.getElementById('btn-abrir-dibujo');
const dibujoOverlay = document.getElementById('dibujo-overlay');
const canvasDibujo = document.getElementById('canvas-dibujo');
const colorDibujo = document.getElementById('color-dibujo');
const grosorDibujo = document.getElementById('grosor-dibujo');
const dibujoEnviar = document.getElementById('dibujo-enviar');
const dibujoCancelar = document.getElementById('dibujo-cancelar');
const listaDibujos = document.getElementById('lista-dibujos');
const dibujoPreviewOverlay = document.getElementById('dibujo-preview-overlay');
const dibujoPreviewImg = document.getElementById('dibujo-preview-img');
const dibujoPreviewAutor = document.getElementById('dibujo-preview-autor');
const dibujoPreviewCerrar = document.getElementById('dibujo-preview-cerrar');

const modalOverlay = document.getElementById('modal-overlay');
const modalTitulo = document.getElementById('modal-titulo');
const campoFecha = document.getElementById('campo-fecha');
const modalFecha = document.getElementById('modal-fecha');
const modalHora = document.getElementById('modal-hora');
const modalGuardar = document.getElementById('modal-guardar');
const modalCancelar = document.getElementById('modal-cancelar');

const tareasRef = collection(db, 'tareas');
const dibujosRef = collection(db, 'dibujos');
const usuariosRef = collection(db, 'usuarios');

// ===== AUTENTICACIÓN REAL =====
function mostrarAuth() {
  selectorUsuario.classList.add('activo');
}

function ocultarAuth() {
  selectorUsuario.classList.remove('activo');
}

function cambiarModoAuth() {
  modoRegistro = !modoRegistro;

  if (modoRegistro) {
    tituloAuth.textContent = 'Crea tu cuenta';
    btnGuardarNombre.textContent = 'Registrarme';
    inputNombreRegistro.style.display = 'block';
    textoCambiarModo.textContent = '¿Ya tienes cuenta? Inicia sesión';
  } else {
    tituloAuth.textContent = 'Inicia sesión';
    btnGuardarNombre.textContent = 'Iniciar sesión';
    inputNombreRegistro.style.display = 'none';
    textoCambiarModo.textContent = '¿No tienes cuenta? Regístrate';
  }
}

async function guardarNombreUsuario() {
  const email = inputEmail.value.trim();
  const password = inputPassword.value.trim();
  const nombre = inputNombreRegistro.value.trim();

  if (email === '' || password === '') return;

  try {
    if (modoRegistro) {
      const credencial = await createUserWithEmailAndPassword(auth, email, password);
      const nombreFinal = nombre || email;
      await updateProfile(credencial.user, { displayName: nombreFinal });
      await setDoc(doc(db, 'usuarios', credencial.user.uid), {
        nombre: nombreFinal,
        email: credencial.user.email,
        creado: serverTimestamp()
      });
      usuarioActual = nombreFinal;
      ocultarAuth();
      iniciarApp();
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  } catch (error) {
    alert(error.message);
  }
}

btnGuardarNombre.addEventListener('click', guardarNombreUsuario);
inputPassword.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') guardarNombreUsuario();
});
inputEmail.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') guardarNombreUsuario();
});
textoCambiarModo.addEventListener('click', cambiarModoAuth);

onAuthStateChanged(auth, async (usuario) => {
  if (usuario) {
    const perfilDoc = await getDoc(doc(db, 'usuarios', usuario.uid));
    if (perfilDoc.exists()) {
      usuarioActual = perfilDoc.data().nombre || usuario.displayName || usuario.email;
    } else {
      usuarioActual = usuario.displayName || usuario.email;
    }
    ocultarAuth();
    iniciarApp();
  } else {
    mostrarAuth();
  }
});

function iniciarApp() {
  document.getElementById('nombre-usuario-actual').textContent = usuarioActual;

  const q = query(tareasRef, orderBy('creada', 'asc'));
  onSnapshot(q, (snapshot) => {
    tareas = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderTareas();
  });

  const qDibujos = query(dibujosRef, orderBy('creado', 'desc'));
  onSnapshot(qDibujos, (snapshot) => {
    dibujos = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(dibujo => dibujo.autor !== usuarioActual);
    renderDibujos();
  });
}

function formatearFecha(fechaISO) {
  const [year, month, day] = fechaISO.split('-');
  return `${day}/${month}/${year}`;
}

function formatearFechaHora(fecha) {
  if (!fecha) return '';

  const fechaObj = typeof fecha === 'object' && fecha.toDate ? fecha.toDate() : new Date(fecha);

  return `${fechaObj.toLocaleDateString('es-ES')} ${fechaObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
}

function renderTareas() {
  listaTareas.innerHTML = '';

  if (tareas.length === 0) {
    listaTareas.innerHTML = '<li class="tarea-vacia">No tienes pendientes por clasificar</li>';
    return;
  }

  tareas.forEach((tarea) => {
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
            ${tarea.texto} <small style="color:#B0BEC9;">— ${tarea.autor || ''}</small>
          </span>
          <button class="btn-completar ${tarea.completada ? 'hecha' : ''}" data-id="${tarea.id}" data-accion="completar"></button>
        </div>
        <div class="grupo-etiquetas">
          <div class="fila">
            <span class="etiqueta ${tarea.urgencia === 'urgente' ? 'activa-urgente' : ''}" data-id="${tarea.id}" data-accion="urgente">🔴 Urgente (Hoy)</span>
            <span class="etiqueta ${tarea.urgencia === 'no-urgente' ? 'activa-normal' : ''}" data-id="${tarea.id}" data-accion="no-urgente">No urgente (Semana)</span>
          </div>
        </div>
        ${infoTiempo}
      </div>
    `;

    listaTareas.appendChild(li);
  });
}

function renderDibujos() {
  listaDibujos.innerHTML = '';

  if (dibujos.length === 0) {
    listaDibujos.innerHTML = '<div class="tarea-vacia">No hay dibujos para mostrar</div>';
    return;
  }

  dibujos.forEach((dibujo) => {
    const item = document.createElement('div');
    item.className = 'dibujo-item';
    item.innerHTML = `
      <img src="${dibujo.imagen}" alt="Dibujo de ${dibujo.autor}">
      <div class="dibujo-meta">
        <strong>${dibujo.autor}</strong>
        <span>${formatearFechaHora(dibujo.creado)}</span>
      </div>
    `;

    item.addEventListener('click', function() {
      abrirPreviewDibujo(dibujo);
    });

    listaDibujos.appendChild(item);
  });
}

async function agregarTarea() {
  const texto = inputTarea.value.trim();
  if (texto === '') return;

  await addDoc(tareasRef, {
    texto,
    autor: usuarioActual,
    completada: false,
    urgencia: null,
    fecha: null,
    hora: null,
    creada: Date.now()
  });

  inputTarea.value = '';
  inputTarea.focus();
}

function abrirModal(id, tipo) {
  indiceActual = id;
  const tarea = tareas.find(t => t.id === id);

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

function ajustarCanvasDibujo() {
  if (!canvasDibujo) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvasDibujo.getBoundingClientRect();
  canvasDibujo.width = rect.width * dpr;
  canvasDibujo.height = rect.height * dpr;

  ctxDibujo = canvasDibujo.getContext('2d');
  ctxDibujo.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctxDibujo.lineCap = 'round';
  ctxDibujo.lineJoin = 'round';
  actualizarEstiloDibujo();
}

function actualizarEstiloDibujo() {
  if (!ctxDibujo) return;

  ctxDibujo.strokeStyle = colorDibujo.value;
  ctxDibujo.lineWidth = Number(grosorDibujo.value);
}

function limpiarCanvasDibujo() {
  if (!ctxDibujo) return;

  ctxDibujo.clearRect(0, 0, canvasDibujo.width, canvasDibujo.height);
}

function obtenerPosicionCanvas(event) {
  const rect = canvasDibujo.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function empezarDibujo(event) {
  dibujando = true;
  actualizarEstiloDibujo();
  const posicion = obtenerPosicionCanvas(event);
  ctxDibujo.beginPath();
  ctxDibujo.moveTo(posicion.x, posicion.y);
  canvasDibujo.setPointerCapture(event.pointerId);
}

function moverDibujo(event) {
  if (!dibujando) return;

  const posicion = obtenerPosicionCanvas(event);
  ctxDibujo.lineTo(posicion.x, posicion.y);
  ctxDibujo.stroke();
}

function terminarDibujo(event) {
  if (!dibujando) return;

  dibujando = false;
  if (event?.pointerId != null) {
    canvasDibujo.releasePointerCapture(event.pointerId);
  }
}

function abrirDibujo() {
  dibujoOverlay.classList.add('activo');
  ajustarCanvasDibujo();
  limpiarCanvasDibujo();
}

function cerrarDibujo() {
  dibujoOverlay.classList.remove('activo');
  limpiarCanvasDibujo();
}

function abrirPreviewDibujo(dibujo) {
  dibujoPreviewImg.src = dibujo.imagen;
  dibujoPreviewAutor.textContent = dibujo.autor;
  dibujoPreviewOverlay.classList.add('activo');
}

function cerrarPreviewDibujo() {
  dibujoPreviewOverlay.classList.remove('activo');
}

async function enviarDibujo() {
  const imagen = canvasDibujo.toDataURL('image/png');

  await addDoc(dibujosRef, {
    imagen,
    autor: usuarioActual,
    creado: serverTimestamp()
  });

  cerrarDibujo();
}

modalGuardar.addEventListener('click', async function() {
  if (indiceActual === null) return;
  const tarea = tareas.find(t => t.id === indiceActual);

  const datos = {
    hora: modalHora.value || null,
    fecha: tarea.urgencia === 'no-urgente' ? (modalFecha.value || null) : null
  };

  await updateDoc(doc(db, 'tareas', indiceActual), datos);
  cerrarModal();
});

modalCancelar.addEventListener('click', cerrarModal);

listaTareas.addEventListener('click', async function(e) {
  const id = e.target.dataset.id;
  const accion = e.target.dataset.accion;
  if (!id) return;

  const tarea = tareas.find(t => t.id === id);

  if (accion === 'completar') {
    const nuevaCompletada = !tarea.completada;
    await updateDoc(doc(db, 'tareas', id), { completada: nuevaCompletada });
    if (nuevaCompletada) festejarMascota();
  } else if (accion === 'urgente' || accion === 'no-urgente') {
    await updateDoc(doc(db, 'tareas', id), { urgencia: accion });
    abrirModal(id, accion);
  }
});

btnAgregar.addEventListener('click', agregarTarea);
inputTarea.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') agregarTarea();
});

btnAbrirDibujo.addEventListener('click', abrirDibujo);
dibujoCancelar.addEventListener('click', cerrarDibujo);
dibujoEnviar.addEventListener('click', enviarDibujo);
colorDibujo.addEventListener('input', actualizarEstiloDibujo);
grosorDibujo.addEventListener('input', actualizarEstiloDibujo);
dibujoPreviewCerrar.addEventListener('click', cerrarPreviewDibujo);
canvasDibujo.addEventListener('pointerdown', empezarDibujo);
canvasDibujo.addEventListener('pointermove', moverDibujo);
canvasDibujo.addEventListener('pointerup', terminarDibujo);
canvasDibujo.addEventListener('pointerleave', terminarDibujo);
canvasDibujo.addEventListener('pointercancel', terminarDibujo);
dibujoPreviewOverlay.addEventListener('click', function(e) {
  if (e.target === this) cerrarPreviewDibujo();
});
window.addEventListener('resize', ajustarCanvasDibujo);

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

document.getElementById('btn-cerrar-sesion').addEventListener('click', async function() {
  await signOut(auth);
  usuarioActual = '';
  mostrarAuth();
});
