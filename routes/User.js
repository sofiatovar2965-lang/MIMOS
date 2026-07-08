import express from "express";
import { getUsuarioporId, getUsuarios, putUsuarioporId, deleteUsuario} from "../controllers/User.js";

const router = express.Router();

//ruta para obtener los usuarios 
router.get('/', getUsuarios);

//ruta para obtener un usuario por id
router.get('/:id', getUsuarioporId);

//ruta para actualizar un usuario por id
router.put('/actualizar:id', putUsuarioporId);

//ruta para eliminar usuario por id
router.delete('/eliminar:id', deleteUsuario);

export default router;