import express, { Router, request, response } from 'express';
import nodemailer from "nodemailer";

const router = Router();

router.post("/", async (req = request, res = response) => {
    const { email, subject, message } = req.body;
    console.log(email, subject, message);

    //Send email
    const config = {
      host: "smtp.gmail.com",
      port: 587,
      auth: {
        user: "paco200032@gmail.com",
        pass: "fgkzarznfcitlirl",
      },
    };

    const mail = {
      from: email,
      to: "paco200032@gmail.com",
      subject: subject,
      html:`<div>
        <h3 style="font-weight: bold">BLACK DIAMOND SORTEOS</h3>
        <p>Se ha recibido un correo de ${email}</p>
        <p>Esta es el mensaje: </p>
        <div style="margin-top: 40">
            <p>${message}</p>
        </div>
        </div>`
    };

    try {
        const transport = nodemailer.createTransport(config);
        const info = await transport.sendMail(mail);

        return res.status(200).json({
            msg: "Ya se ha recibido tu mensaje, en breve nuestro equipo se pondrá en contacto contigo",
        });
        
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            msg: "Algo salió mal",
        })
    }
});


export default router;