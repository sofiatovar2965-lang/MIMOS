import express from 'express';
import { listarHelados, obtenerHelado, obtenerPorCat, crear, editar, eliminar } from '../controllers/heladocontrollers.js';

const router = express.Router();

// GET - Obtener todos
router.get('/helados', listarHelados);

// GET - Obtener por ID
router.get('/helados/:id', obtenerHelado);

// GET - Obtener por categoría
router.get('/helados/categoria/:categoria', obtenerPorCat);

// POST - Crear helado
router.post('/heladoscrear', crear);

// PUT - Actualizar helado
router.put('/heladoseditar/:id', editar);

// DELETE - Eliminar helado
router.delete('/heladoseliminar/:id', eliminar);

export default router;