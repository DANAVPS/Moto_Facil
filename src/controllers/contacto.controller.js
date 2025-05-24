import nodemailer from 'nodemailer';

export const enviarFormularioContacto = async (req, res) => {
    const { nombre, email, telefono, 'tipo-consulta': tipoConsulta, mensaje } = req.body;

    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp-relay.brevo.com',
            port: 587,
            auth: {
                user: '8dd5dd002@smtp-brevo.com',
                pass: 'LfbxIw4FpMkVnSXD'
            }
        });


        await transporter.sendMail({
            from: `"Formulario MotoFácil" <${email}>`,
            to: 'ddannavvalentina@gmail.com',
            subject: `Nueva consulta: ${tipoConsulta}`,
            html: `
                <h3>Nuevo mensaje de contacto</h3>
                <p><strong>Nombre:</strong> ${nombre}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Teléfono:</strong> ${telefono || 'No proporcionado'}</p>
                <p><strong>Tipo de Consulta:</strong> ${tipoConsulta}</p>
                <p><strong>Mensaje:</strong><br>${mensaje}</p>
            `
        });

        res.redirect('/contacto?exito=1');
    } catch (error) {
        console.error('Error al enviar el formulario:', error);
        res.status(500).render('error', { mensaje: 'Hubo un problema al enviar tu mensaje. Inténtalo más tarde.' });
    }
};

export const mostrarFormularioContacto = (req, res) => {
    res.render('contacto');
};