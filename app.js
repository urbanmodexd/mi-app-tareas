import { db, auth, functions } from './firebase-init.js';
import {
  collection, addDoc, onSnapshot, doc, updateDoc, query, orderBy, serverTimestamp, getDoc, getDocs, setDoc, where
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile,
  GoogleAuthProvider, signInWithPopup, sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-functions.js";

let tareas = [];
let dibujos = [];
let contactos = [];
let vinculoActivo = null;
let indiceActual = null;
let usuarioActual = '';
let uidActual = '';
let dibujando = false;
let ctxDibujo = null;
let modoRegistro = false;
let chatContactoActivo = null;
let chatUnsubscribe = null;
let chatParejaUnsubscribe = null;
let retosParejaUnsubscribe = null;
let retosPareja = [];
let ultimoMensajePareja = null;

const inputTarea = document.getElementById('input-tarea');
const btnAgregar = document.getElementById('btn-agregar');
const listaTareas = document.getElementById('lista-tareas');
const selectorUsuario = document.getElementById('selector-usuario');
const inputEmail = document.getElementById('input-email');
const inputPassword = document.getElementById('input-password');
const inputNombreRegistro = document.getElementById('input-nombre-registro');
const recuperacionContainer = document.getElementById('recuperacion-container');
const inputEmailRecuperacion = document.getElementById('input-email-recuperacion');
const inputCodigoRecuperacion = document.getElementById('input-codigo-recuperacion');
const inputNuevaPassword = document.getElementById('input-nueva-password');
const btnEnviarCodigoRecuperacion = document.getElementById('btn-enviar-codigo-recuperacion');
const btnConfirmarRecuperacion = document.getElementById('btn-confirmar-recuperacion');
const inputTelefonoRegistro = document.getElementById('input-telefono-registro');
const btnGuardarNombre = document.getElementById('btn-guardar-nombre');
const btnGoogle = document.getElementById('btn-google');
const tituloAuth = document.getElementById('titulo-auth');
const textoCambiarModo = document.getElementById('texto-cambiar-modo');
const linkRecuperarPassword = document.getElementById('link-recuperar-password');
const btnAbrirDibujo = document.getElementById('btn-abrir-dibujo');
const inputContactoEmail = document.getElementById('input-contacto-email');
const inputContactoTelefono = document.getElementById('input-contacto-telefono');
const btnAgregarContacto = document.getElementById('btn-agregar-contacto');
const listaContactos = document.getElementById('lista-contactos');
const chatOverlay = document.getElementById('chat-overlay');
const chatTitulo = document.getElementById('chat-titulo');
const chatMensajes = document.getElementById('chat-mensajes');
const chatInput = document.getElementById('chat-input');
const chatEnviar = document.getElementById('chat-enviar');
const chatCerrar = document.getElementById('chat-cerrar');
const btnVincularPareja = document.getElementById('btn-vincular-pareja');
const inputCodigoVinculo = document.getElementById('input-codigo-vinculo');
const btnAceptarVinculo = document.getElementById('btn-aceptar-vinculo');
const estadoVinculo = document.getElementById('estado-vinculo');
const selectDestinatarioDibujo = document.getElementById('select-destinatario-dibujo');
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
const navItems = document.querySelectorAll('.nav-item');
const tabPanels = document.querySelectorAll('.tab-panel');
const campoFecha = document.getElementById('campo-fecha');
const parejaVinculoMensaje = document.getElementById('pareja-vinculo-mensaje');
const parejaChatContenido = document.getElementById('pareja-chat-contenido');
const parejaRetosContenido = document.getElementById('pareja-retos-contenido');
const chatParejaMensajes = document.getElementById('chat-pareja-mensajes');
const inputMensajePareja = document.getElementById('input-mensaje-pareja');
const btnEnviarMensajePareja = document.getElementById('btn-enviar-mensaje-pareja');
const inputRetoTexto = document.getElementById('input-reto-texto');
const selectCategoriaReto = document.getElementById('select-categoria-reto');
const btnEnviarReto = document.getElementById('btn-enviar-reto');
const listaRetosRecibidos = document.getElementById('lista-retos-recibidos');
const listaRetosEnviados = document.getElementById('lista-retos-enviados');
const perfilBioInput = document.getElementById('perfil-bio');
const perfilGuardarBtn = document.getElementById('btn-guardar-perfil');
const perfilFotoImg = document.getElementById('perfil-foto');
const perfilNombrePareja = document.getElementById('perfil-nombre-pareja');
const modalFecha = document.getElementById('modal-fecha');
const modalHora = document.getElementById('modal-hora');
const modalGuardar = document.getElementById('modal-guardar');
const modalCancelar = document.getElementById('modal-cancelar');

const tareasRef = collection(db, 'tareas');
const dibujosRef = collection(db, 'dibujos');
const usuariosRef = collection(db, 'usuarios');
const contactosRef = collection(db, 'contactos');
const vinculosRef = collection(db, 'vinculos');
const mensajesRef = collection(db, 'mensajes');
const mensajesParejaRef = collection(db, 'mensajes_pareja');
const retosParejaRef = collection(db, 'retos_pareja');

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
    inputTelefonoRegistro.style.display = 'block';
    textoCambiarModo.textContent = '¿Ya tienes cuenta? Inicia sesión';
  } else {
    tituloAuth.textContent = 'Inicia sesión';
    btnGuardarNombre.textContent = 'Iniciar sesión';
    inputNombreRegistro.style.display = 'none';
    inputTelefonoRegistro.style.display = 'none';
    textoCambiarModo.textContent = '¿No tienes cuenta? Regístrate';
  }
}

function esEmailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function guardarPerfilUsuario(usuario, nombreFinal, telefono = null) {
  try {
    await updateProfile(usuario, { displayName: nombreFinal });
  } catch (error) {
    console.warn('No se pudo actualizar el perfil de Firebase Auth:', error);
  }

  try {
    await setDoc(doc(db, 'usuarios', usuario.uid), {
      nombre: nombreFinal,
      email: usuario.email,
      telefono: telefono || null,
      foto: usuario.photoURL || null,
      bio: '',
      creado: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.warn('No se pudo guardar el perfil en Firestore:', error);
  }
}

async function guardarPerfilEditable() {
  if (!uidActual) return;
  const bio = perfilBioInput?.value?.trim() || '';
  const perfilRef = doc(db, 'usuarios', uidActual);
  await setDoc(perfilRef, { bio }, { merge: true });
  alert('Perfil guardado');
}

async function cargarPerfilEditable() {
  if (!uidActual) return;
  const perfilDoc = await getDoc(doc(db, 'usuarios', uidActual));
  if (perfilDoc.exists()) {
    const datos = perfilDoc.data();
    if (perfilBioInput) perfilBioInput.value = datos.bio || '';
    if (perfilFotoImg) perfilFotoImg.src = datos.foto || 'icon-192.png';
  }

  if (vinculoActivo?.estado === 'activo') {
    const otroUid = vinculoActivo.uidUsuario1 === uidActual ? vinculoActivo.uidUsuario2 : vinculoActivo.uidUsuario1;
    if (otroUid) {
      const otroDoc = await getDoc(doc(db, 'usuarios', otroUid));
      if (otroDoc.exists()) {
        const otroDatos = otroDoc.data();
        if (perfilNombrePareja) perfilNombrePareja.textContent = `Pareja: ${otroDatos.nombre || 'Tu pareja'}`;
      }
    }
  } else if (perfilNombrePareja) {
    perfilNombrePareja.textContent = 'Sin vínculo';
  }
}

function obtenerTareasVisibles(lista) {
  if (!uidActual) return [];

  if (vinculoActivo?.estado === 'activo') {
    return lista.filter((tarea) => {
      return tarea.equipoId === vinculoActivo.id || (!tarea.equipoId && tarea.uidAutor === uidActual);
    });
  }

  return lista.filter((tarea) => !tarea.equipoId && tarea.uidAutor === uidActual);
}

async function calcularRachaRetos(equipoId) {
  const vinculoRef = doc(db, 'vinculos', equipoId);
  const vinculoDoc = await getDoc(vinculoRef);
  if (!vinculoDoc.exists()) return 0;

  const datos = vinculoDoc.data();
  const ultimoMensaje = datos.ultimoMensaje?.toDate ? datos.ultimoMensaje.toDate() : null;
  const ahora = new Date();

  if (!ultimoMensaje) {
    await updateDoc(vinculoRef, { rachaRetos: 0 });
    return 0;
  }

  const diffHoras = (ahora - ultimoMensaje) / (1000 * 60 * 60);
  if (diffHoras > 24) {
    await updateDoc(vinculoRef, { rachaRetos: 0 });
    return 0;
  }

  const nuevaRacha = (datos.rachaRetos || 0) + 1;
  await updateDoc(vinculoRef, { rachaRetos: nuevaRacha });
  return nuevaRacha;
}

async function actualizarEstadisticasEquipo() {
  const rachaEl = document.getElementById('racha-dias');
  const puntosEl = document.getElementById('puntos-equipo');
  const rachaPerfilEl = document.getElementById('racha-dias-perfil');
  const puntosPerfilEl = document.getElementById('puntos-equipo-perfil');
  const rachaRetosEl = document.getElementById('racha-retos');

  const actualizarVista = (rachaTexto, puntosTexto, rachaRetosTexto = '0') => {
    if (rachaEl) rachaEl.textContent = rachaTexto;
    if (puntosEl) puntosEl.textContent = puntosTexto;
    if (rachaPerfilEl) rachaPerfilEl.textContent = rachaTexto;
    if (puntosPerfilEl) puntosPerfilEl.textContent = puntosTexto;
    if (rachaRetosEl) rachaRetosEl.textContent = rachaRetosTexto;
  };

  if (!uidActual) {
    actualizarVista('0 días', '0');
    return;
  }

  try {
    if (vinculoActivo?.estado === 'activo') {
      const vinculoDoc = await getDoc(doc(db, 'vinculos', vinculoActivo.id));
      if (vinculoDoc.exists()) {
        const datos = vinculoDoc.data();
        actualizarVista(`${datos.racha || 0} días`, datos.puntos || 0, `${datos.rachaRetos || 0} días`);
        return;
      }
    }

    const perfilDoc = await getDoc(doc(db, 'usuarios', uidActual));
    if (perfilDoc.exists()) {
      const datos = perfilDoc.data();
      actualizarVista(`${datos.racha || 0} días`, datos.puntos || 0, '0 días');
    } else {
      actualizarVista('0 días', '0', '0 días');
    }
  } catch (error) {
    console.warn('No se pudieron cargar las estadísticas:', error);
  }
}

async function guardarNombreUsuario() {
  const email = inputEmail.value.trim();
  const password = inputPassword.value.trim();
  const nombre = inputNombreRegistro.value.trim();
  const telefono = inputTelefonoRegistro.value.trim();

  if (email === '' || password === '') return;

  if (!esEmailValido(email)) {
    alert('Ingresa un correo electrónico válido');
    return;
  }

  try {
    if (modoRegistro) {
      const credencial = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(credencial.user);
      const nombreFinal = nombre || email.split('@')[0];
      await guardarPerfilUsuario(credencial.user, nombreFinal, telefono);
      usuarioActual = nombreFinal;
      uidActual = credencial.user.uid;
      ocultarAuth();
      iniciarApp();
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  } catch (error) {
    alert(error.message);
  }
}

function mostrarRecuperacion() {
  recuperacionContainer.style.display = 'block';
  inputEmailRecuperacion.value = inputEmail.value.trim();
}

function mostrarCelebracionReto(puntos) {
  const overlay = document.getElementById('celebracion-nube-overlay');
  const nube = document.getElementById('nube-celebracion');
  if (!overlay || !nube) return;
  nube.textContent = `¡Reto cumplido! +${puntos} puntos`;
  overlay.classList.add('activo');
  setTimeout(() => overlay.classList.remove('activo'), 1800);
}

function ocultarRecuperacion() {
  recuperacionContainer.style.display = 'none';
  inputEmailRecuperacion.value = '';
  inputCodigoRecuperacion.value = '';
  inputNuevaPassword.value = '';
}

async function enviarCodigoRecuperacion() {
  const correo = inputEmailRecuperacion.value.trim() || inputEmail.value.trim();
  if (!correo || !esEmailValido(correo)) {
    alert('Ingresa un correo electrónico válido');
    return;
  }

  try {
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiracion = new Date(Date.now() + 15 * 60 * 1000);
    await addDoc(collection(db, 'codigos_recuperacion'), {
      email: correo.toLowerCase(),
      codigo,
      expiracion: expiracion,
      usado: false,
      creado: serverTimestamp()
    });

    try {
      const enviarEmail = httpsCallable(functions, 'enviarCodigoRecuperacion');
      await enviarEmail({ email: correo, codigo });
    } catch (emailError) {
      console.warn('No se pudo enviar el correo con la Cloud Function:', emailError);
      alert('Código generado localmente. Para enviar correos reales necesitas una Cloud Function o un servicio como EmailJS.');
    }

    alert('Se generó un código de recuperación. Revisa la consola o el correo si la función de envío está activa.');
  } catch (error) {
    alert(error.message || 'No se pudo generar el código');
  }
}

async function confirmarRecuperacion() {
  const correo = inputEmailRecuperacion.value.trim() || inputEmail.value.trim();
  const codigo = inputCodigoRecuperacion.value.trim();
  const nuevaPassword = inputNuevaPassword.value.trim();

  if (!correo || !codigo || !nuevaPassword) {
    alert('Completa el correo, el código y la nueva contraseña');
    return;
  }

  try {
    const q = query(collection(db, 'codigos_recuperacion'), where('email', '==', correo.toLowerCase()), where('usado', '==', false));
    const resultado = await getDocs(q);
    const codigoValido = resultado.docs.find(docu => {
      const data = docu.data();
      return data.codigo === codigo && new Date(data.expiracion?.toDate?.() || data.expiracion) > new Date();
    });

    if (!codigoValido) {
      alert('El código es inválido o ya expiró');
      return;
    }

    await updateDoc(doc(db, 'codigos_recuperacion', codigoValido.id), { usado: true });
    const enviarPassword = httpsCallable(functions, 'cambiarPasswordConCodigo');
    await enviarPassword({ email: correo.toLowerCase(), codigo, nuevaPassword });
    alert('Contraseña actualizada correctamente');
    ocultarRecuperacion();
  } catch (error) {
    alert(error.message || 'No se pudo actualizar la contraseña');
  }
}

async function recuperarPassword() {
  const correo = inputEmail.value.trim();
  if (!correo) {
    alert('Ingresa tu correo para recuperar la contraseña');
    return;
  }

  if (!esEmailValido(correo)) {
    alert('Ingresa un correo electrónico válido');
    return;
  }

  mostrarRecuperacion();
}

async function loginConGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const credencial = await signInWithPopup(auth, provider);
    const nombreFinal = credencial.user.displayName || credencial.user.email || 'Usuario';
    await guardarPerfilUsuario(credencial.user, nombreFinal);
    usuarioActual = nombreFinal;
    uidActual = credencial.user.uid;
    ocultarAuth();
    iniciarApp();
  } catch (error) {
    alert(error.message);
  }
}

btnGuardarNombre.addEventListener('click', guardarNombreUsuario);
btnGoogle.addEventListener('click', loginConGoogle);
linkRecuperarPassword.addEventListener('click', recuperarPassword);
btnEnviarCodigoRecuperacion.addEventListener('click', enviarCodigoRecuperacion);
btnConfirmarRecuperacion.addEventListener('click', confirmarRecuperacion);
perfilGuardarBtn.addEventListener('click', guardarPerfilEditable);
inputPassword.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') guardarNombreUsuario();
});
inputEmail.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') guardarNombreUsuario();
});
textoCambiarModo.addEventListener('click', cambiarModoAuth);

onAuthStateChanged(auth, async (usuario) => {
  if (usuario) {
    uidActual = usuario.uid;
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
  document.getElementById('nombre-usuario-actual-perfil').textContent = usuarioActual || 'Tu perfil';
  document.getElementById('racha-dias').textContent = '0 días';
  document.getElementById('racha-dias-perfil').textContent = '0 días';
  document.getElementById('puntos-equipo').textContent = '0';
  document.getElementById('puntos-equipo-perfil').textContent = '0';
  pedirPermisoNotificaciones();

  if (chatParejaUnsubscribe) chatParejaUnsubscribe();
  if (retosParejaUnsubscribe) retosParejaUnsubscribe();

  const q = query(tareasRef, orderBy('creada', 'asc'));
  onSnapshot(q, (snapshot) => {
    tareas = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderTareas();
  });

  const qDibujos = query(dibujosRef, orderBy('creado', 'desc'));
  onSnapshot(qDibujos, (snapshot) => {
    dibujos = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(dibujo => dibujo.destinatario === uidActual);
    renderDibujos();
  });

  const qContactos = query(contactosRef, orderBy('creado', 'asc'));
  onSnapshot(qContactos, (snapshot) => {
    contactos = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(contacto => contacto.uidUsuario === uidActual);
    renderContactos();
    renderDestinatariosDibujo();
  });

  const qVinculos = query(vinculosRef, orderBy('creado', 'asc'));
  onSnapshot(qVinculos, (snapshot) => {
    const vinculos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    const vinculo = vinculos.find(v => v.uidUsuario1 === uidActual || v.uidUsuario2 === uidActual);
    vinculoActivo = vinculo || null;
    renderVinculo();
    actualizarEstadisticasEquipo();
    cargarPerfilEditable();

    if (chatParejaUnsubscribe) chatParejaUnsubscribe();
    if (retosParejaUnsubscribe) retosParejaUnsubscribe();

    if (vinculoActivo?.estado === 'activo') {
      const qMensajesPareja = query(mensajesParejaRef, orderBy('creado', 'asc'));
      chatParejaUnsubscribe = onSnapshot(qMensajesPareja, (snapshotMensajes) => {
        window.__mensajesPareja = snapshotMensajes.docs
          .map((docu) => ({ id: docu.id, ...docu.data() }))
          .filter((m) => m.equipoId === vinculoActivo.id);
        renderChatPareja();
      });

      const qRetosPareja = query(retosParejaRef, orderBy('creado', 'asc'));
      retosParejaUnsubscribe = onSnapshot(qRetosPareja, (snapshotRetos) => {
        retosPareja = snapshotRetos.docs
          .map((docu) => ({ id: docu.id, ...docu.data() }))
          .filter((reto) => reto.equipoId === vinculoActivo.id);
        renderRetosPareja();
      });
    } else {
      window.__mensajesPareja = [];
      retosPareja = [];
      renderChatPareja();
      renderRetosPareja();
    }
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

  const tareasVisibles = obtenerTareasVisibles(tareas).filter((tarea) => !tarea.completada);

  if (tareasVisibles.length === 0) {
    listaTareas.innerHTML = '<li class="tarea-vacia">No tienes pendientes por ahora</li>';
    return;
  }

  registrarNotificacionesParaTareas();

  tareasVisibles.forEach((tarea) => {
    const li = document.createElement('li');

    let infoTiempo = '';
    if (tarea.urgencia === 'urgente' && tarea.hora) {
      infoTiempo = `<div style="font-size:12px; color:#5B7A9D; margin-top:4px;"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" style="vertical-align:middle; margin-right:4px;"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>Hoy a las ${tarea.hora}</div>`;
    } else if (tarea.urgencia === 'no-urgente' && tarea.fecha) {
      infoTiempo = `<div style="font-size:12px; color:#5B7A9D; margin-top:4px;"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" style="vertical-align:middle; margin-right:4px;"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 9h16"/><path d="M8 3v4"/><path d="M16 3v4"/></svg>${formatearFecha(tarea.fecha)}${tarea.hora ? ' — ' + tarea.hora : ''}</div>`;
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
            <span class="etiqueta ${tarea.urgencia === 'urgente' ? 'activa-urgente' : ''}" data-id="${tarea.id}" data-accion="urgente"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><circle cx="12" cy="12" r="7"/></svg>Urgente (Hoy)</span>
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

function renderContactos() {
  listaContactos.innerHTML = '';

  const aceptados = contactos.filter((contacto) => contacto.estado === 'aceptado');
  const pendientes = contactos.filter((contacto) => contacto.estado === 'pendiente');

  if (aceptados.length === 0 && pendientes.length === 0) {
    listaContactos.innerHTML = '<div class="tarea-vacia">Aún no agregaste contactos</div>';
    return;
  }

  const crearSeccion = (titulo, lista) => {
    const bloque = document.createElement('div');
    bloque.className = 'contactos-seccion';
    const h4 = document.createElement('h4');
    h4.textContent = titulo;
    bloque.appendChild(h4);
    const ul = document.createElement('ul');
    ul.className = 'lista-contactos-items';
    lista.forEach((contacto) => {
      const li = document.createElement('li');
      li.className = 'contacto-item';
      const contenido = document.createElement('div');
      contenido.className = 'contacto-info';
      contenido.textContent = `${contacto.nombreContacto || contacto.emailContacto || 'Contacto'}${contacto.emailContacto ? ` · ${contacto.emailContacto}` : ''}${contacto.telefonoContacto ? ` · ${contacto.telefonoContacto}` : ''}`;
      li.appendChild(contenido);

      if (contacto.estado === 'aceptado') {
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => abrirChatContacto(contacto));
      } else {
        const botones = document.createElement('div');
        botones.className = 'contacto-acciones';
        const btnAceptar = document.createElement('button');
        btnAceptar.textContent = 'Aceptar';
        btnAceptar.className = 'btn-aceptar';
        btnAceptar.addEventListener('click', (event) => {
          event.stopPropagation();
          aceptarSolicitudContacto(contacto);
        });
        const btnRechazar = document.createElement('button');
        btnRechazar.textContent = 'Rechazar';
        btnRechazar.className = 'btn-rechazar';
        btnRechazar.addEventListener('click', (event) => {
          event.stopPropagation();
          rechazarSolicitudContacto(contacto);
        });
        botones.appendChild(btnAceptar);
        botones.appendChild(btnRechazar);
        li.appendChild(botones);
      }
      ul.appendChild(li);
    });
    bloque.appendChild(ul);
    return bloque;
  };

  if (pendientes.length > 0) {
    listaContactos.appendChild(crearSeccion('Solicitudes de contacto', pendientes));
  }
  if (aceptados.length > 0) {
    listaContactos.appendChild(crearSeccion('Contactos', aceptados));
  }
}

function renderMensajes(mensajes) {
  chatMensajes.innerHTML = '';

  if (mensajes.length === 0) {
    chatMensajes.innerHTML = '<div class="tarea-vacia">No hay mensajes aún</div>';
    return;
  }

  const contenedor = document.createElement('div');
  contenedor.style.display = 'flex';
  contenedor.style.flexDirection = 'column';
  contenedor.style.gap = '8px';

  mensajes.forEach((mensaje) => {
    const bubble = document.createElement('div');
    const esMio = mensaje.de === uidActual;
    bubble.style.maxWidth = '80%';
    bubble.style.padding = '8px 10px';
    bubble.style.borderRadius = '12px';
    bubble.style.alignSelf = esMio ? 'flex-end' : 'flex-start';
    bubble.style.background = esMio ? '#2E6FBF' : '#F2F6FA';
    bubble.style.color = esMio ? 'white' : '#2F3B4A';
    bubble.innerHTML = `<div>${mensaje.texto}</div>`;
    contenedor.appendChild(bubble);
  });

  chatMensajes.appendChild(contenedor);
}

function abrirChatContacto(contacto) {
  chatContactoActivo = contacto;
  chatTitulo.textContent = contacto.nombreContacto || contacto.emailContacto || 'Contacto';
  chatOverlay.style.display = 'flex';
  renderMensajes([]);

  if (chatUnsubscribe) {
    chatUnsubscribe();
  }

  const q = query(mensajesRef, orderBy('creado', 'asc'));
  chatUnsubscribe = onSnapshot(q, (snapshot) => {
    const mensajes = snapshot.docs
      .map((docu) => ({ id: docu.id, ...docu.data() }))
      .filter((mensaje) => {
        return (mensaje.de === uidActual && mensaje.para === contacto.uidContacto) ||
          (mensaje.de === contacto.uidContacto && mensaje.para === uidActual);
      });

    renderMensajes(mensajes);
  });
}

function cerrarChatContacto() {
  chatOverlay.style.display = 'none';
  chatContactoActivo = null;
  if (chatUnsubscribe) {
    chatUnsubscribe();
    chatUnsubscribe = null;
  }
  chatInput.value = '';
}

async function enviarMensaje() {
  const texto = chatInput.value.trim();
  if (!texto || !chatContactoActivo || !uidActual) return;

  await addDoc(mensajesRef, {
    de: uidActual,
    para: chatContactoActivo.uidContacto,
    texto,
    creado: serverTimestamp()
  });

  chatInput.value = '';
  chatInput.focus();
}

function renderDestinatariosDibujo() {
  selectDestinatarioDibujo.innerHTML = '';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Elige un contacto';
  selectDestinatarioDibujo.appendChild(placeholder);

  if (uidActual) {
    const optionYo = document.createElement('option');
    optionYo.value = uidActual;
    optionYo.textContent = 'Para mí';
    selectDestinatarioDibujo.appendChild(optionYo);
  }

  contactos.forEach((contacto) => {
    if (!contacto.uidContacto) return;
    const option = document.createElement('option');
    option.value = contacto.uidContacto;
    option.textContent = contacto.nombreContacto || contacto.emailContacto || 'Contacto';
    selectDestinatarioDibujo.appendChild(option);
  });
}

function renderChatPareja() {
  if (!chatParejaMensajes) return;
  chatParejaMensajes.innerHTML = '';

  if (vinculoActivo?.estado !== 'activo' || !uidActual) {
    chatParejaMensajes.innerHTML = '<div class="tarea-vacia">No hay mensajes aún</div>';
    return;
  }

  const mensajes = (window.__mensajesPareja || []).slice().sort((a, b) => (a.creado?.seconds || 0) - (b.creado?.seconds || 0));

  if (mensajes.length === 0) {
    chatParejaMensajes.innerHTML = '<div class="tarea-vacia">Todavía no hay mensajes</div>';
    return;
  }

  const contenedor = document.createElement('div');
  contenedor.className = 'chat-pareja-burbuja-contenedor';

  mensajes.forEach((mensaje) => {
    const burbuja = document.createElement('div');
    burbuja.className = mensaje.de === uidActual ? 'chat-pareja-burbuja yo' : 'chat-pareja-burbuja pareja';
    burbuja.textContent = mensaje.texto;
    contenedor.appendChild(burbuja);
  });

  chatParejaMensajes.appendChild(contenedor);
}

function renderRetosPareja() {
  if (!listaRetosRecibidos || !listaRetosEnviados) return;
  listaRetosRecibidos.innerHTML = '';
  listaRetosEnviados.innerHTML = '';

  const recibidos = retosPareja.filter((reto) => reto.para === uidActual);
  const enviados = retosPareja.filter((reto) => reto.creadoPor === uidActual);

  if (recibidos.length === 0) {
    listaRetosRecibidos.innerHTML = '<div class="tarea-vacia">No tienes retos por responder</div>';
  } else {
    recibidos.forEach((reto) => listaRetosRecibidos.appendChild(crearTarjetaReto(reto, 'recibido')));
  }

  if (enviados.length === 0) {
    listaRetosEnviados.innerHTML = '<div class="tarea-vacia">Aún no has enviado retos</div>';
  } else {
    enviados.forEach((reto) => listaRetosEnviados.appendChild(crearTarjetaReto(reto, 'enviado')));
  }
}

function crearTarjetaReto(reto, tipo) {
  const tarjeta = document.createElement('div');
  tarjeta.className = `reto-card${reto.estado === 'rechazado' ? ' rechazado' : ''}`;

  const color = reto.categoria === 'Romántico' ? '#FF7AA2' : reto.categoria === 'Atrevido' ? '#8E6CE8' : '#2E6FBF';
  tarjeta.innerHTML = `
    <div class="reto-header" style="border-color:${color};">
      <span class="reto-categoria" style="background:${color};">${reto.categoria || 'Divertido'}</span>
      <span class="reto-estado">${reto.estado || 'pendiente'}</span>
    </div>
    <p>${reto.texto}</p>
    <small>De: ${reto.creadoPor === uidActual ? 'tú' : 'tu pareja'}</small>
  `;

  const acciones = document.createElement('div');
  acciones.className = 'reto-acciones';

  if (tipo === 'recibido' && reto.estado === 'pendiente') {
    const aceptar = document.createElement('button');
    aceptar.className = 'btn-primario';
    aceptar.textContent = 'Aceptar';
    aceptar.addEventListener('click', () => aceptarReto(reto));
    acciones.appendChild(aceptar);

    const rechazar = document.createElement('button');
    rechazar.className = 'btn-secundario';
    rechazar.textContent = 'Rechazar';
    rechazar.addEventListener('click', () => rechazarReto(reto));
    acciones.appendChild(rechazar);
  } else if (tipo === 'recibido' && reto.estado === 'aceptado') {
    const completado = document.createElement('button');
    completado.className = 'btn-primario';
    completado.textContent = '¡Ya lo hice!';
    completado.addEventListener('click', () => completarReto(reto));
    acciones.appendChild(completado);
  }

  tarjeta.appendChild(acciones);
  return tarjeta;
}

async function aceptarReto(reto) {
  if (!vinculoActivo?.id) return;
  await updateDoc(doc(db, 'retos_pareja', reto.id), { estado: 'aceptado' });
}

async function rechazarReto(reto) {
  if (!vinculoActivo?.id) return;
  await updateDoc(doc(db, 'retos_pareja', reto.id), { estado: 'rechazado' });
}

async function completarReto(reto) {
  if (!vinculoActivo?.id) return;
  const vinculoRef = doc(db, 'vinculos', vinculoActivo.id);
  const vinculoDoc = await getDoc(vinculoRef);
  if (!vinculoDoc.exists()) return;
  const datos = vinculoDoc.data();
  const confirmadoPor = Array.isArray(reto.confirmadoPor) ? reto.confirmadoPor : [];
  if (!confirmadoPor.includes(uidActual)) {
    confirmadoPor.push(uidActual);
  }
  const yaCompleto = confirmadoPor.includes(reto.creadoPor) && confirmadoPor.includes(reto.para);
  await updateDoc(doc(db, 'retos_pareja', reto.id), {
    estado: yaCompleto ? 'completado' : 'aceptado',
    confirmadoPor
  });
  if (yaCompleto) {
    await updateDoc(vinculoRef, {
      puntos: (datos.puntos || 0) + 20,
      racha: (datos.racha || 0) + 1
    });
    mostrarCelebracionReto(20);
    actualizarEstadisticasEquipo();
  }
}

async function enviarMensajePareja() {
  const texto = inputMensajePareja.value.trim();
  if (!texto || !vinculoActivo?.id || !uidActual) return;
  await addDoc(mensajesParejaRef, {
    equipoId: vinculoActivo.id,
    de: uidActual,
    texto,
    creado: serverTimestamp()
  });
  if (vinculoActivo?.id) {
    const vinculoRef = doc(db, 'vinculos', vinculoActivo.id);
    await updateDoc(vinculoRef, {
      ultimoMensaje: serverTimestamp(),
      rachaRetos: await calcularRachaRetos(vinculoActivo.id)
    });
  }
  inputMensajePareja.value = '';
}

async function enviarRetoPareja() {
  const texto = inputRetoTexto.value.trim();
  const categoria = selectCategoriaReto.value;
  if (!texto || !vinculoActivo?.id || !uidActual) return;

  const otroUid = vinculoActivo.uidUsuario1 === uidActual ? vinculoActivo.uidUsuario2 : vinculoActivo.uidUsuario1;
  await addDoc(retosParejaRef, {
    equipoId: vinculoActivo.id,
    texto,
    categoria,
    creadoPor: uidActual,
    para: otroUid,
    estado: 'pendiente',
    creado: serverTimestamp(),
    confirmadoPor: []
  });
  inputRetoTexto.value = '';
}

function renderVinculo() {
  if (!vinculoActivo) {
    estadoVinculo.textContent = 'Sin vínculo activo';
    if (parejaVinculoMensaje) parejaVinculoMensaje.style.display = 'block';
    if (parejaChatContenido) parejaChatContenido.style.display = 'none';
    if (parejaRetosContenido) parejaRetosContenido.style.display = 'none';
    return;
  }

  const estadoTexto = vinculoActivo.estado === 'activo' ? 'Vínculo activo' : 'Pendiente de confirmación';
  estadoVinculo.textContent = `${estadoTexto} · ${vinculoActivo.codigo || ''}`.trim();

  if (parejaVinculoMensaje) parejaVinculoMensaje.style.display = 'none';
  if (parejaChatContenido) parejaChatContenido.style.display = vinculoActivo.estado === 'activo' ? 'block' : 'none';
  if (parejaRetosContenido) parejaRetosContenido.style.display = vinculoActivo.estado === 'activo' ? 'block' : 'none';
}

async function agregarTarea() {
  const texto = inputTarea.value.trim();
  if (texto === '') return;

  const datos = {
    texto,
    autor: usuarioActual,
    uidAutor: uidActual,
    equipoId: vinculoActivo?.estado === 'activo' ? vinculoActivo.id : null,
    completada: false,
    urgencia: null,
    fecha: null,
    hora: null,
    creada: Date.now()
  };

  await addDoc(tareasRef, datos);

  inputTarea.value = '';
  inputTarea.focus();
}

async function aceptarSolicitudContacto(contacto) {
  const docActual = doc(db, 'contactos', `${uidActual}_${contacto.uidContacto}`);
  const docPareja = doc(db, 'contactos', `${contacto.uidContacto}_${uidActual}`);
  await updateDoc(docActual, { estado: 'aceptado' });
  await updateDoc(docPareja, { estado: 'aceptado' });
}

async function rechazarSolicitudContacto(contacto) {
  const docActual = doc(db, 'contactos', `${uidActual}_${contacto.uidContacto}`);
  const docPareja = doc(db, 'contactos', `${contacto.uidContacto}_${uidActual}`);
  await updateDoc(docActual, { estado: 'rechazado' });
  await updateDoc(docPareja, { estado: 'rechazado' });
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
  const destinatario = selectDestinatarioDibujo.value;

  console.log('[dibujo] destinatario elegido:', destinatario);

  if (!destinatario) {
    alert('Elige un contacto para enviar el dibujo');
    return;
  }

  await addDoc(dibujosRef, {
    imagen,
    autor: usuarioActual,
    autorUid: uidActual,
    destinatario,
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
    if (nuevaCompletada) {
      if (vinculoActivo?.estado === 'activo') {
        const vinculoRef = doc(db, 'vinculos', vinculoActivo.id);
        const vinculoDoc = await getDoc(vinculoRef);
        if (vinculoDoc.exists()) {
          const datos = vinculoDoc.data();
          await updateDoc(vinculoRef, {
            racha: (datos.racha || 0) + 1,
            puntos: (datos.puntos || 0) + 10
          });
        }
      } else {
        const perfilRef = doc(db, 'usuarios', uidActual);
        const perfilDoc = await getDoc(perfilRef);
        if (perfilDoc.exists()) {
          const datos = perfilDoc.data();
          await updateDoc(perfilRef, {
            racha: (datos.racha || 0) + 1,
            puntos: (datos.puntos || 0) + 10
          });
        } else {
          await setDoc(perfilRef, { racha: 1, puntos: 10 }, { merge: true });
        }
      }
      actualizarEstadisticasEquipo();
      festejarMascota();
    }
  } else if (accion === 'urgente' || accion === 'no-urgente') {
    await updateDoc(doc(db, 'tareas', id), { urgencia: accion });
    abrirModal(id, accion);
  }
});

btnAgregar.addEventListener('click', agregarTarea);
inputTarea.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') agregarTarea();
});

btnAgregarContacto.addEventListener('click', async function() {
  const email = inputContactoEmail.value.trim();
  const telefono = inputContactoTelefono.value.trim();
  if ((!email && !telefono) || !uidActual) {
    alert('Ingresa un correo o un teléfono para agregar un contacto');
    return;
  }

  const q = query(usuariosRef);
  const usuarios = [];
  const resultado = await getDocs(q);
  resultado.forEach((docu) => usuarios.push({ id: docu.id, ...docu.data() }));

  let contacto = null;
  if (email) {
    contacto = usuarios.find(u => u.email === email);
  }
  if (!contacto && telefono) {
    contacto = usuarios.find(u => u.telefono === telefono);
  }

  if (!contacto) {
    alert('No existe un usuario con ese correo o teléfono');
    return;
  }

  const yaExiste = contactos.some(c => c.uidContacto === contacto.id || c.emailContacto === email || c.telefonoContacto === telefono);
  if (yaExiste) {
    alert('Ese contacto ya está en proceso o ya fue agregado');
    return;
  }

  await setDoc(doc(db, 'contactos', `${uidActual}_${contacto.id}`), {
    uidUsuario: uidActual,
    uidContacto: contacto.id,
    nombreContacto: contacto.nombre || contacto.email,
    emailContacto: contacto.email || null,
    telefonoContacto: contacto.telefono || null,
    estado: 'pendiente',
    creado: serverTimestamp()
  }, { merge: true });

  await setDoc(doc(db, 'contactos', `${contacto.id}_${uidActual}`), {
    uidUsuario: contacto.id,
    uidContacto: uidActual,
    nombreContacto: usuarioActual || 'Alguien',
    emailContacto: auth.currentUser?.email || null,
    telefonoContacto: null,
    estado: 'pendiente',
    creado: serverTimestamp()
  }, { merge: true });

  inputContactoEmail.value = '';
  inputContactoTelefono.value = '';
});

btnVincularPareja.addEventListener('click', async function() {
  if (!uidActual) return;

  const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();
  await addDoc(vinculosRef, {
    codigo,
    uidUsuario1: uidActual,
    uidUsuario2: null,
    estado: 'pendiente',
    racha: 0,
    puntos: 0,
    creado: serverTimestamp()
  });
  estadoVinculo.textContent = `Código generado: ${codigo}`;
});

btnAceptarVinculo.addEventListener('click', async function() {
  const codigo = inputCodigoVinculo.value.trim().toUpperCase();
  if (!codigo || !uidActual) return;

  const q = query(vinculosRef);
  const resultado = await getDocs(q);
  const vinculo = resultado.docs.find(d => d.data().codigo === codigo && d.data().estado === 'pendiente');

  if (!vinculo) {
    alert('Código no válido');
    return;
  }

  await updateDoc(doc(db, 'vinculos', vinculo.id), {
    uidUsuario2: uidActual,
    estado: 'activo',
    racha: vinculo.data().racha || 0,
    puntos: vinculo.data().puntos || 0
  });

  inputCodigoVinculo.value = '';
  estadoVinculo.textContent = 'Vínculo activo';
});

btnAbrirDibujo.addEventListener('click', abrirDibujo);
dibujoCancelar.addEventListener('click', cerrarDibujo);
dibujoEnviar.addEventListener('click', enviarDibujo);
chatCerrar.addEventListener('click', cerrarChatContacto);
chatEnviar.addEventListener('click', enviarMensaje);
btnEnviarMensajePareja.addEventListener('click', enviarMensajePareja);
btnEnviarReto.addEventListener('click', enviarRetoPareja);
inputMensajePareja.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') enviarMensajePareja();
});
chatInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') enviarMensaje();
});
chatOverlay.addEventListener('click', function(e) {
  if (e.target === this) cerrarChatContacto();
});
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
    mensaje.textContent = 'Completaste tu primera tarea';
  } else if (totalCompletadas % 5 === 0) {
    titulo.textContent = '¡Imparable!';
    mensaje.textContent = `Ya llevas ${totalCompletadas} tareas completadas 🔥`;
  } else {
    const frases = [
      '¡Excelente trabajo!',
      '¡Sigue así!',
      '¡Una menos, vas muy bien!',
      '¡Tu mascota está orgullosa!',
      '¡Eres una bestia!'
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
    Notification.requestPermission().then((permiso) => {
      if (permiso === 'granted') {
        console.log('Permiso de notificaciones concedido');
      }
    });
  }
}

function mostrarNotificacionLocal(titulo, opciones = {}) {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.ready) return;

  navigator.serviceWorker.ready.then((registration) => {
    registration.showNotification(titulo, {
      body: opciones.body || 'Tienes una tarea pendiente',
      icon: '/icon-192.png',
      tag: opciones.tag || 'tarea-notificacion'
    });
  });
}

let temporizadoresNotificaciones = [];

function programarNotificacionTarea(tarea) {
  if (!tarea || (!tarea.fecha && !tarea.hora)) return;

  const ahora = new Date();
  const fechaObjetivo = new Date();
  const fechaTexto = tarea.fecha ? tarea.fecha : ahora.toISOString().split('T')[0];
  const [anio, mes, dia] = fechaTexto.split('-').map(Number);
  fechaObjetivo.setFullYear(anio, mes - 1, dia);

  if (tarea.hora) {
    const [horas, minutos] = tarea.hora.split(':').map(Number);
    fechaObjetivo.setHours(horas, minutos, 0, 0);
  } else {
    fechaObjetivo.setHours(23, 59, 0, 0);
  }

  const demora = fechaObjetivo.getTime() - ahora.getTime();
  if (demora <= 0) return;

  const temporizador = setTimeout(() => {
    if (!tarea.completada) {
      mostrarNotificacionLocal('⏰ Recordatorio', { body: tarea.texto });
    }
  }, demora);

  temporizadoresNotificaciones.push(temporizador);
}

function registrarNotificacionesParaTareas() {
  temporizadoresNotificaciones.forEach((timer) => clearTimeout(timer));
  temporizadoresNotificaciones = [];
  tareas.filter((tarea) => !tarea.completada).forEach((tarea) => programarNotificacionTarea(tarea));
}

navItems.forEach((item) => {
  item.addEventListener('click', () => {
    navItems.forEach((nav) => nav.classList.remove('activo'));
    tabPanels.forEach((panel) => panel.classList.remove('activo'));
    item.classList.add('activo');
    document.getElementById(`panel-${item.dataset.tab}`)?.classList.add('activo');
  });
});

function actualizarNombresPerfil() {
  const perfilNombre = document.getElementById('nombre-usuario-actual-perfil');
  if (perfilNombre) perfilNombre.textContent = usuarioActual || 'Tu perfil';
}

document.getElementById('btn-cerrar-sesion').addEventListener('click', async function() {
  await signOut(auth);
  usuarioActual = '';
  uidActual = '';
  vinculoActivo = null;
  mostrarAuth();
});

document.getElementById('btn-cerrar-sesion-perfil').addEventListener('click', async function() {
  await signOut(auth);
  usuarioActual = '';
  uidActual = '';
  vinculoActivo = null;
  mostrarAuth();
});
