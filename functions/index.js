const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.enviarCodigoRecuperacion = functions.https.onCall(async (data) => {
  const email = data.email;
  const codigo = data.codigo;

  if (!email || !codigo) {
    throw new functions.https.HttpsError('invalid-argument', 'Faltan datos');
  }

  return { ok: true, message: `Código listo para enviar a ${email}` };
});

exports.cambiarPasswordConCodigo = functions.https.onCall(async (data) => {
  const email = data.email;
  const codigo = data.codigo;
  const nuevaPassword = data.nuevaPassword;

  if (!email || !codigo || !nuevaPassword) {
    throw new functions.https.HttpsError('invalid-argument', 'Faltan datos');
  }

  const userRecord = await admin.auth().getUserByEmail(email);
  await admin.auth().updateUser(userRecord.uid, { password: nuevaPassword });

  return { ok: true };
});
