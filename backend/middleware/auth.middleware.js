// Seguridad: revisa la sesion y el rol antes de entrar a cada ruta
const jwt = require('jsonwebtoken');

// Solo deja pasar si la cookie trae un token valido
function requiereSesion(peticion, respuesta, siguiente) {
  const token = peticion.cookies.sesion;
  if (!token) {
    respuesta.status(401).json({ mensaje: 'Inicia sesion para continuar' });
    return;
  }

  try {
    peticion.usuario = jwt.verify(token, process.env.JWT_SECRETO);
    siguiente();
  } catch (error) {
    respuesta.status(401).json({ mensaje: 'La sesion vencio, vuelve a entrar' });
  }
}

// Solo deja pasar a los roles indicados. Se usa despues de requiereSesion
function permitirRoles(...roles) {
  return (peticion, respuesta, siguiente) => {
    if (!roles.includes(peticion.usuario.rol)) {
      respuesta.status(403).json({ mensaje: 'Tu rol no tiene acceso a este modulo' });
      return;
    }
    siguiente();
  };
}

module.exports = { requiereSesion, permitirRoles };

// Maximo 5 intentos de login por minuto desde la misma IP
const intentos = {};
function limitarIntentos(peticion, respuesta, siguiente) {
  const ahora = Date.now();
  const ip = peticion.ip;
  intentos[ip] = (intentos[ip] || []).filter(t => ahora - t < 60000);

  if (intentos[ip].length >= 5) {
    respuesta.status(429).json({ mensaje: 'Demasiados intentos, espera un minuto' });
    return;
  }
  intentos[ip].push(ahora);
  siguiente();
}

module.exports.limitarIntentos = limitarIntentos;
