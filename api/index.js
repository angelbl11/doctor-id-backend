import fetch from 'node-fetch';
import express from 'express';
import path from 'path';
import { JSDOM } from 'jsdom'; // Reemplazo de Cheerio
const app = express();
const port = 3000;

// Middleware para parsear el cuerpo de la solicitud como JSON
app.use(express.json());
// Middleware para parsear el cuerpo de la solicitud codificado en URL
app.use(express.urlencoded({ extended: true }));

// Función para obtener los datos de membresía para un idmemb dado
async function obtenerDatosMembresia(idmemb) {
    const myHeaders = {
        "Accept": "*/*",
        "Host": "consulta.vhs.com.mx:81",
        "Connection": "keep-alive"
    };

    const requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };

    try {
        const response = await fetch(`http://consulta.vhs.com.mx:81/galaxia/relumia_web/modules/mod-datos-membresias/datos-membresia.php?idmemb=${idmemb}`, requestOptions);
        const htmlResponse = await response.text();
        const { document } = new JSDOM(htmlResponse).window; // Parsear el HTML sin Cheerio
        const strongTags = document.querySelectorAll('strong');
        let especialidad = null;
        let folio = null;
        strongTags.forEach(tag => {
            const text = tag.textContent.trim();
            if (text === 'ESPECIALIDAD') {
                especialidad = tag.nextElementSibling.textContent.trim();
            } else if (text === 'FOLIO:') {
                folio = tag.nextElementSibling.textContent.trim();
            }
        });
        return { especialidad, folio };
    } catch (error) {
        console.error(`Error al obtener los datos de la membresía para idmemb ${idmemb}:`, error);
        return null;
    }
}

// Ruta para la página HTML
app.get('/', (req, res) => {
    res.send('¡Hola, mundo!');
});

// Ruta para manejar el envío del formulario
app.post('/buscar', async (req, res) => {
    const idsMembresia = req.body.ids.split(',').map(id => id.trim());
    const datosPromesas = idsMembresia.map(idmemb => obtenerDatosMembresia(idmemb));
    const datos = await Promise.all(datosPromesas);
    res.json(datos);
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
