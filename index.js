import express from 'express';
import dotev from 'dotenv';
import { conectaDB,supabase } from './config/supabase.js';
import AuthRoutes from "./routes/Auth.js";
import UserRoutes from "./routes/User.js";
import heladosRoutes from "./routes/helados.js";
import pedidosRoutes from "./routes/pedidos.js";

//CARGAR VARIABLES
dotev.config();

//CREAMOS LA APLICACION DE EXPRESS
const app = express();

//LEER EL JSON
app.use(express.json());

//CREAMOS LA RUTA
app.get('/',(req,res)=>{
    res.json({
        Mensaje:"Bienvenido al BACKEND de MIMOS",
        Estado: "En linea",
        Version:"1.0.0"
    })
})

//ruta de autenticacion
app.use('/auth', AuthRoutes);
app.use('/usuarios', UserRoutes);
app.use('/api', heladosRoutes);
app.use('/pedi', pedidosRoutes);


//CONFIGURAMOS EL PUERTO 

const PORT = 3000;

//PONER A ESCUCHAR EL SERVIDOR
app.listen(PORT,()=>{
    console.log(`Servidor escuchando el puerto ${PORT}`);
    console.log(`http://localhost:${PORT}`);
});