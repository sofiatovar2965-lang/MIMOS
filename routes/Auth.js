import express from "express";
import { registro,login,verificarCuenta } from "../controllers/Auth.js";
import { forgotPassword,verifyCode } from "../controllers/Recuperar.js";

const router = express.Router();

//Rutas de autenticacion
router.post('/register', registro);
router.post('/login', login);
router.post('/verify-account', verificarCuenta);

//Ruta de olvido de contraseña
router.post('/forgot-password', forgotPassword);
router.post('/verify-code', verifyCode);

export default router;
