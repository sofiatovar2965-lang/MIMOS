import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import { crearUsuario, obtenerPorEmail, obtenerUsuarioPorId } from '../models/User.js';

//Registro

export const registro = async (req, res)=>{
    try {
        const {nombre,email,contrasena}=req.body

        //validar datos
        if(!nombre || !email || !contrasena){
            return res.status (400).json({
                error: 'Faltan usuarios'
            });
        }

        //Verificamos si el gmail existe

        const {data: usuarioExiste}= await obtenerPorEmail(email);
        if(usuarioExiste){
            return res.status (400).json({
                error:'el email ya existe'
            });
        }

        //encriptar la contrasena

        const hashedContarsena= await bcrypt.hash(contrasena,10);

        //rol por defecto
        const rolPorDefecto = 'usuario';

        //guardar en la base de datos
        const { data, error } = await crearUsuario(
            nombre,
            email,
            hashedContarsena,
            rolPorDefecto
        );

        if (error) {
            return res.status(500).json({
                error: 'Error al crear el usuario'
            });
        }

        return res.status(201).json({
            message: 'Usuario registrado con exito',
            usuario: {
                id: data[0].id,
                nombre: data[0].nombre,
                email: data[0].email,
                rol: data[0].rol
            }
        });
        
    } catch (error) {
        console.error ('Error en registro:', error);
        return res.status(500).json({
            error: error.message
        });
    }
};

//crear login

export const login = async(req,res)=>{
    try {
        const {email,contrasena} = req.body;

        //validamos que todos los campos esten llenos
        if(!email || !contrasena){
            return res.status(400).json({
                error: 'Todos los campos son requeridos: email y contraseña'
            });
        }

        //validamos si el correo existe
        const {data: usuario} = await obtenerPorEmail(email);
        if(!usuario){
            return res.status(400).json({
                error: 'El email no esta registrado'
            });
        }
        //VALIDAMOS LA CONTRASEÑA
        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
        if(!contrasenaValida){
            return res.status(400).json({
                error: 'Contrasena incorrecta'
            });
        }

        //Generamos el token JWT
        const token = jwt.sign(
            {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h'}
        );

        return res.status(200).json({
            message: 'login exitoso',
            token
        });
    } catch (error) {
        console.error('Error en el login:', error);
        return res.status(500).json({
            error: error.message
        });
    }
};