// Errores: ninguna peticion se queda colgada y el servidor no se cae

// Ruta que no existe
function rutaNoEncontrada(peticion, respuesta) {
  respuesta.status(404).json({ mensaje: 'Ruta no encontrada: ' + peticion.originalUrl });
}

// Cualquier error que llegue con next(error)
function manejadorErrores(error, peticion, respuesta, siguiente) {
  console.error(error);

  // JSON mal escrito en el cuerpo
  if (error.type === 'entity.parse.failed') {
    respuesta.status(400).json({ mensaje: 'El cuerpo de la peticion no es JSON valido' });
    return;
  }
  // Errores tipicos de MySQL
  if (error.code === 'ER_DUP_ENTRY') {
    respuesta.status(409).json({ mensaje: 'Ese registro ya existe' });
    return;
  }
  if (error.code === 'ER_ROW_IS_REFERENCED_2') {
    respuesta.status(409).json({ mensaje: 'No se puede borrar, hay registros que dependen de este' });
    return;
  }

  respuesta.status(error.estado || 500).json({ mensaje: error.message || 'Error en el servidor' });
}

module.exports = { rutaNoEncontrada, manejadorErrores };
