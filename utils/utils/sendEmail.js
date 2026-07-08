import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const enviarConfirmacionPedido = async (email, nombreUsuario, pedidoId, total) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `✅ Pedido Confirmado - Heladería Minions #${pedidoId}`,
        html: `
        
        Hola ${nombreUsuario},

        Tu pedido ha sido confirmado exitosamente.

        Número de Pedido: #${pedidoId}

        Total: $${total.toLocaleString('es-CO')}

        Pronto nos comunicaremos contigo con los detalles de entrega.

        Saludos,
        Equipo Heladería Minions 🍦
    `
};

try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Correo enviado' };
} catch (error) {
    console.error('Error al enviar correo:', error);
    return { success: false, error: error.message };
}
};
