import { request, response } from "express";
import Stripe from "stripe";
import { pool } from "../database/db.js";
import nodemailer from "nodemailer";

const stripe = new Stripe(process.env.PUBLIC_STRIPE_KEY);

export const insertSale = async (req = request, res = response) => {
    const { giveawayId, userId } = req.params;
    const { tickets, ticketPrice } = req.body;

    try {
        const [rows] = await pool.query("SELECT ticket_number FROM ticket WHERE giveaway_id = ?", [giveawayId]);

        //Evitar que se vendan boletos dos veces
        let band = true;
        rows.forEach((element) => {
            if(tickets.includes(element.ticket_number)){
                band = false;
            }
        });

        //Si está nuestro boleto elegido en la base de datos retornamos error
        if(!band){
            return res.status(400).json({
                error:
                "Lo sentimos algunos de los boletos seleccionados ya no están disponibles, intenta con otros",
            });
        }else {
            //Obtener fecha
            const date = new Date().toLocaleDateString();
            //Crear elementos para cobrar
            // let line_items = [];
            // let product = {};
            //Colocar código aquí de stripe para generar la compra y recibir un success para continuar
            // stripe.checkout.sessions.create({
            //     line_items: [
            //         {
    
            //         }
            //     ]
            // })
    
    
            //Insertar datos en tabla sales
            const [response] = await pool.query("INSERT INTO sales VALUES(0, ?, ?, ?)", [userId, date, giveawayId]);
    
            //Extraemos el id de compra insertado
            const { insertId } = response;
    
            //Insertar en base de datos los boletos comprados
            for (let i = 0; i < tickets.length; i++) {
                const resp = await pool.query("INSERT INTO ticket VALUES (0, ?, ?, ?, ?, ?)", [
                    giveawayId, tickets[i], userId, ticketPrice, insertId
                ]);
            }


            //Send email
            const config = {
            host: "smtp.gmail.com",
            port: 587,
            auth: {
                user: "paco200032@gmail.com",
                pass: "fgkzarznfcitlirl",
            },
            };

            const message = {
                from: "paco200032@gmail.com",
                to: "francisco.saldivar4081@alumnos.udg.mx",
                subject: "Prueba",
                html: `<p>Gracias por tu compra</p><br/>
                <p style={{margin-top: 20px}}>Detalle de compra</p><br/>
                <p style={{margin-top: 2px}}>ID de tu compra: </p><br/>
                <p style={{margin-top: 2px}}>Fecha de tu compra: </p><br/>
                <p style={{margin-top: 2px}}>Sorteo: </p><br/>
                <p style={{margin-top: 2px}}>Boletos: </p><br/>
                <p style={{margin-top: 2px}}>Lista de boletos.... </p><br/>
                <p style={{margin-top: 2px}}>Total de venta: 1000 </p><br/>
                <p style={{margin-top: 20px}}>Si desconoces esta solicitud ponte en contacto al correo paco200032@gmail.com</p><br/>
                <p style={{margin-top: 40px}}>BLACK DIAMOND SORTEOS</p><br/>`,
            };

            const transport = nodemailer.createTransport(config);
            const info = await transport.sendMail(message);
    
            return res.json({
                message: "Sale succesfully",
                saleId: insertId,
            })
        }


    } catch (error) {
        console.log(error)
        return res.status(400).json({
            message: "Algo salió mal",
        });
    }
}


export const getSaleById = async (req = request, res = response) => {
    const { id } = req.params;
    const [rows] = await pool.query(
        "SELECT sales.id, sales.id_user, sales.sale_date, sales.giveaway_id, giveaway.car, giveaway. description, giveaway.giveaway_date, giveaway.creation_date, giveaway.status FROM sales INNER JOIN giveaway ON giveaway_id = giveaway.id WHERE sales.id = ?", 
        [id]);

    if(rows.length > 0){
        const [data] = await pool.query("SELECT * FROM ticket WHERE sale_id = ?", [id]);

        return res.json({
            saleData: rows[0],
            ticketsData: data,
        })
    }else{
        return res.status(400).json({
            error: "Sale not found",
        })
    }
}


export const getSales = async (req = request, res = response) => {
    const { userId } = req.params;

    try{
        const [rows] = await pool.query(
          "SELECT sales.id, sales.id_user, sales.sale_date, sales.giveaway_id, giveaway.car, giveaway.description, giveaway.giveaway_date, giveaway.status FROM sales INNER JOIN giveaway ON giveaway_id = giveaway.id ORDER BY sales.id DESC",
          [userId]
        );

        res.json({
            data: rows
        })
    }catch(error){
        console.log(error)
        res.status(400).json({
            error,
            msg: "Something was wrong",
        })
    }
}
