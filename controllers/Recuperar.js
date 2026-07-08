import { crearCodigoDeRecuperacion, marcarComoUsado, obtenerCodigoValido } from "../models/Recuperar.js";
import { actualizarUsuario, obtenerPorEmail } from "../models/User.js";
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

//configuramos el tranporte de nodemailer

const transporter=nodemailer.createTransport({
    service:'gmail',
    auth:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS
    }

});

//CONFIGURAR LA LOGICA PARA ENVIAR EL CORREO DE RECUPERACION

export const forgotPassword= async (req,res) =>{
    try {
        const { email } = req.body;

        if(!email){
            return res.status(400).json({error: 'El correo electronico es requerido'})
        }

        //verificar si el usuario existe
        const { data:usuario, error:errorUsuario}= await obtenerPorEmail(email);

        if(errorUsuario || !usuario) {
            return res.status(404).json({error: 'Usuario no encontrado'});
        }

        //GENERAMOS LOS CODIGOS DE RECUPERACION

        const codigo =Math.floor(100000 + Math.random() * 900000).toString();

        //GUARDAR EL CODIGO EN LA BASE DE DATOS

        const {error:errorCodigo}=await crearCodigoDeRecuperacion(usuario.id,codigo);

        if(errorCodigo){
            return res.status(500).json({error: 'Error al generar el codigo de recuperacion'});
        }
         //CREAMOS EL EMAIL DEL CODIGO

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: `Tu codigo de recuperacion es: ${codigo}`,
            html: `
            <h2>Recuperacion de contraseña</h2>
            <p> Hola ${usuario.nombre || 'Usuario'}, </p>
            <p> Tu codigo de recuperacion es:</p>
            <h1 style="color: #39a900; font-size: 36px;"> ${codigo} </h1>
            <p> Este codigo es valido por 15 minutos. Si no solicitaste este codigo por favor ignora este correo.
            <p>Gracias,</p>
            <p>El equipo de soporte</p>
            <p>No compartas este codigo con nadie </p>
            `

        });
        return res.status(200).json({error: 'Codigo de recuperacion enviado al correo'});

    }catch (error) {
        console.error('Error en forgotContrasena:', error);
        return res.status(500).json({error: 'Error al enviar el codigo de recuperacion'});
    }
}

//Cambiar contraseña y verificar el codigo recuperacion

export const verifyCode = async (req, res)=>{
    try { 

        const {email, codigo, newPasswords}= req.body;

        //verificamos las entradas
        if(!email || !codigo || !newPasswords){
            return res.status(400).json({error:'Todos los campos son requeridos'});
        }

        //verificar si el usuario esta en la base de datos

        const { data:usuario}= await obtenerPorEmail(email);

        if(!usuario){
            return res.status(404).json({error: 'Usuario no encontrado'});
        }

        //verificamos el codigo de recuperacion

        const { data:codigoRecord} = await obtenerCodigoValido(usuario.id,codigo);

        if(!codigoRecord){
            return res.status(400).json({error:'Codigo de recuperacion invalido o expirado'});
        }

        //Encriptamos la nueva contraseña

        const hashedPassword= await bcrypt.hash(newPasswords,10);

        //actualizamos la contraseña del usuario en la base de datos

        const {error:updateError}= await actualizarUsuario(
            usuario.id,{contrasena:hashedPassword}
        )

        if(updateError) throw updateError;

        // marcamos s en el codigo usado

        await marcarComoUsado(codigoRecord.id);

        //respondemos al cliente que la contraseña se cambio exitosamente 

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject:'Contraseña cambiada exitosamente',
            html:`<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; padding: 20px; border-radius: 5px;">
                  <h2 style="color: #333; ">Notificacion de cambio de contraseña</h2>
                  <p>Hola ${usuario.nombre || 'Usuario'},</p>
                  <p> Te informamos que tu contraseña ha sido cambiada exitosamente.</p>
                  <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px soid #39a900; margin-top: 20px;">
                  <p style="margin: 0; font-size: 14px color: #555;">
                  Si no realizaste este cambio, te rexomendamos que contactes a nuestro equipo de soporte inmediatamente.</p>
                  </div>
                  <p style=color: #555; font-size:  14px; margin-top: 30px"
                  >Gracias,</p>
                   </div>
                   `
        });

    } catch (error) {
        console.error('Error en verifyCode:', error);
        return res.status(500).json({error:'Error al verificar el codigo o cambiar la contraseña'});

    }
};