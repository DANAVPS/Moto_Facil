import nodemailer from 'nodemailer';
import { AppError } from './errorhandler.js';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    }
});

export const sendEmail = async (options) => {
    try {
        const mailOptions = {
            from: `Tienda de Motos <${process.env.EMAIL_FROM}>`,
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: options.html
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        throw new AppError('Error enviando el email', 500);
    }
};

export const sendWelcomeEmail = async (user) => {
    const message = `Bienvenido a nuestra tienda de motos, ${user.name}!`;

    await sendEmail({
        email: user.email,
        subject: 'Bienvenido a Tienda de Motos',
        message,
        html: `<h1>${message}</h1>`
    });
};