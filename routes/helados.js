import express from 'express';
import { listarHelados, obtenerHelado, obtenerPorCat, crear, editar, eliminar } from '../controllers/heladocontrollers.js';
import {verificarToken, verificarAdmin} from '../middlewares/authmiddleware.js';
const router = express.Router();

// GET - Obtener todos
router.get('/helados', listarHelados);

// GET - Obtener por ID
router.get('/helados/:id', obtenerHelado);

// GET - Obtener por categoría
router.get('/helados/categoria/:categoria', obtenerPorCat);


//Rutas protegidas por token y rol de administrador

// POST - Crear helado
router.post('/heladoscrear',verificarToken, verificarAdmin, crear);

// PUT - Actualizar helado
router.put('/heladoseditar/:id', verificarToken, verificarAdmin, editar);

// DELETE - Eliminar helado
router.delete('/heladoseliminar/:id', verificarToken, verificarAdmin, eliminar);

export default router;