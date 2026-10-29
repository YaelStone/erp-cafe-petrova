const express = require('express');
const router = express.Router();
const productoService = require('../services/producto.service');
const { permitirRoles } = require('../middleware/auth.middleware');

// Todos con sesion ven el catalogo; solo comandante y almacenista lo modifican
const soloAlmacen = permitirRoles('comandante', 'almacenista');

// Lista de productos
router.get('/', (peticion, respuesta) => {
  productoService.obtenerProductos((error, productos) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al consultar productos' });
      return;
    }
    respuesta.json(productos);
  });
});

// Productos con stock bajo
router.get('/alertas', (peticion, respuesta) => {
  productoService.obtenerAlertas((error, productos) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al consultar alertas' });
      return;
    }
    respuesta.json(productos);
  });
});

// Un producto
router.get('/:id', (peticion, respuesta) => {
  productoService.obtenerProducto(peticion.params.id, (error, productos) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al consultar el producto' });
      return;
    }
    respuesta.json(productos[0]);
  });
});

// Alta de producto
router.post('/', soloAlmacen, (peticion, respuesta) => {
  productoService.crearProducto(peticion.body, (error, resultado) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al guardar el producto' });
      return;
    }
    respuesta.json({ mensaje: 'Producto guardado', id: resultado.insertId });
  });
});

// Editar producto
router.put('/:id', soloAlmacen, (peticion, respuesta) => {
  productoService.actualizarProducto(peticion.params.id, peticion.body, (error) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al actualizar el producto' });
      return;
    }
    respuesta.json({ mensaje: 'Producto actualizado' });
  });
});

// Borrar producto
router.delete('/:id', soloAlmacen, (peticion, respuesta) => {
  productoService.eliminarProducto(peticion.params.id, (error) => {
    if (error) {
      respuesta.status(error.code === 'ER_ROW_IS_REFERENCED_2' ? 409 : 500).json({ mensaje: 'No se puede borrar: el producto ya tiene ventas o compras' });
      return;
    }
    respuesta.json({ mensaje: 'Producto borrado' });
  });
});

// Entrada de inventario
router.post('/:id/entrada', soloAlmacen, (peticion, respuesta) => {
  productoService.registrarEntrada(peticion.params.id, peticion.body.cantidad, (error) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al registrar la entrada' });
      return;
    }
    respuesta.json({ mensaje: 'Entrada registrada' });
  });
});

// Merma
router.post('/merma', soloAlmacen, (peticion, respuesta) => {
  productoService.registrarMerma(peticion.body, (error) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al registrar la merma' });
      return;
    }
    respuesta.json({ mensaje: 'Merma registrada' });
  });
});

module.exports = router;
