import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import { supabase } from '../config/supabase.js';   
import { crearUsuario, obtenerPorEmail,  } from '../models/User.js';
import { enviarCodigoVerificacion } from '../utils/utils/sendEmail.js';


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

        //se genera un codigo de verificacion de 6 digitos
        const CodigoVerificacion = Math.floor(100000 + Math.random() * 900000).toString();
        const codigoVerificacionExpiracion = new Date(Date.now() + 15 * 60 * 1000); 


        //guardar en la base de datos
        const { data, error } = await crearUsuario(
            nombre,
            email,
            hashedContarsena,
            rolPorDefecto,
            CodigoVerificacion,
            codigoVerificacionExpiracion
        );

        if (error) {
            return res.status(500).json({
                error: 'Error al crear el usuario'
            });
        }

        //enviar correo de verificacion
        const resultadoEnvio = await enviarCodigoVerificacion(email, nombre, CodigoVerificacion);
        
        const usuarioCreado = Array.isArray(data) ? data[0] : data;

        const usuarioRespuesta = {
                id: usuarioCreado.id,
                nombre: usuarioCreado.nombre,
                email: usuarioCreado.email,
                rol: usuarioCreado.rol
        };


        if (!resultadoEnvio.exito) {
        return res.status(200).json({
            message: 'Usuario registrado con exito, pero no se pudo enviar el correo de verificacion',
            emailEnviado: false,
            usuario: usuarioRespuesta,
        });
        }

        return res.status(201).json({
            message: 'Usuario registrado con exito, correo de verificacion enviado',
            emailEnviado: true,
            usuario: usuarioRespuesta
        });

    } catch (error) {
        console.error('Error en registro:', error);
        return res.status(500).json({
            error: error.message
        });
    }
};  

//crear login
// LOGIN

export const login = async (req, res) => {
    try {
        const { email, contrasena } = req.body;

        if (!email || !contrasena) {
            return res.status(400).json({
                error: 'El email y la contraseña son requeridos'
            });
        }

        const { data: usuario } = await obtenerPorEmail(email);

        if (!usuario) {
            return res.status(401).json({
                error: 'Credenciales incorrectas'
            });
        }

        const contrasenaValido = await bcrypt.compare(contrasena, usuario.contrasena);

        if (!contrasenaValido) {
            return res.status(401).json({
                error: 'Credenciales incorrectas'
            });
        }

        // Verificar si el usuario ha sido verificado
        if (!usuario.isVerified) {
            return res.status(403).json({
                error: 'Tu cuenta no ha sido verificada. Por favor ingresa el código enviado a tu correo antes de iniciar sesión.'
            });
        }

        const token = jwt.sign(
            {
                id: usuario.id,
                rol: usuario.rol
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1d'
            }
        );

        return res.status(200).json({
            message: 'Inicio de sesión exitoso',
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({
            error: error.message
        });
    }
};

// VERIFICAR CUENTA CON CODIGO DE 6 DIGITOS
export const verificarCuenta = async (req, res) => {
    try {
        const { email, codigo } = req.body;

        if (!email || !codigo) {
            return res.status(400).json({
                error: 'El email y el codigo de verificacion son requeridos'
            });
        }

        // 1. Buscar al usuario en Supabase
        const { data: usuario, error: errorUsuario } = await supabase
            .from('usuarios')
            .select('id, email, isVerified, CodigoVerificacion, codigoVerificacionExpiracion')
            .eq('email', email)
            .single();

        if (errorUsuario || !usuario) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        // 2. Verificar si ya esta activo
        if (usuario.isVerified) {
            return res.status(400).json({
                error: 'La cuenta ya se encuentra verificada'
            });
        }

        // 3. Comparar el codigo
        if (String(usuario.CodigoVerificacion).trim() !== String(codigo).trim()) {
            return res.status(400).json({
                error: 'El codigo de verificacion es incorrecto'
            });
        }

        // 4. Validar expiracion (15 minutos)
        const ahora = new Date();
        const codigoExpiracion = new Date(usuario.codigoVerificacionExpiracion);

        if (ahora > codigoExpiracion) {
            return res.status(400).json({
                error: 'El codigo ha expirado. Por favor solicita uno nuevo'
            });
        }

        // 5. Activar la cuenta
        const { error: errorUpdate } = await supabase
            .from('usuarios')
            .update({
                isVerified: true,
                CodigoVerificacion: null,
                codigoVerificacionExpiracion: null
            })
            .eq('id', usuario.id);

        if (errorUpdate) {
            return res.status(500).json({
                error: 'Error al actualizar el estado de verificacion'
            });
        }

        return res.status(200).json({
            message: 'Cuenta verificada exitosamente. Ya puede iniciar sesion en Mimos.'
        });

    } catch (error) {
        console.error('Error en verificacion:', error);
        return res.status(500).json({
            error: error.message
        });
    }
};