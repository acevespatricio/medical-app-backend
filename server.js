// Importa las dependencias necesarias
const express = require('express');
const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

// Inicializa la aplicación Express y define el puerto
const app = express();
const port = process.env.PORT || 3000;

// Conexión a la base de datos de PostgreSQL
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

client.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err.stack);
    } else {
        console.log('Conexión exitosa a la base de datos de PostgreSQL.');
    }
});

// Middlewares para procesar las solicitudes
app.use(express.json());
app.use(cors());

// Crea la tabla de perfiles médicos si no existe
// Las columnas están en minúsculas para evitar problemas de case-sensitivity con PostgreSQL
client.query(`
    CREATE TABLE IF NOT EXISTS medical_profiles (
        id TEXT PRIMARY KEY,
        name TEXT,
        dob TEXT,
        bloodtype TEXT,
        allergies TEXT,
        conditions TEXT,
        socialsecuritynumber TEXT,
        insurancepolicy TEXT,
        emergencycontactname TEXT,
        emergencycontactphone TEXT,
        url TEXT
    )
`).then(() => {
    console.log('Tabla medical_profiles verificada o creada.');
}).catch(err => {
    console.error('Error al crear la tabla:', err.stack);
});

// Endpoint para guardar la información médica (método POST)
app.post('/save', (req, res) => {
    const profileId = uuidv4();
    const { 
        name, 
        dob, 
        bloodtype, 
        allergies, 
        conditions, 
        socialsecuritynumber, 
        insurancepolicy, 
        emergencycontactname, 
        emergencycontactphone 
    } = req.body;

    const uniqueUrl = `https://acevespatricio.github.io/medical-app/display.html?id=${profileId}`;

    const sql = `INSERT INTO medical_profiles (
        id, name, dob, bloodtype, allergies, conditions, 
        socialsecuritynumber, insurancepolicy, emergencycontactname, emergencycontactphone, url
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;

    const values = [
        profileId, name, dob, bloodtype, allergies, conditions, 
        socialsecuritynumber, insurancepolicy, emergencycontactname, emergencycontactphone, uniqueUrl
    ];

    client.query(sql, values)
        .then(() => {
            res.status(201).json({
                message: 'Datos guardados exitosamente!',
                profileId: profileId,
                url: uniqueUrl
            });
        })
        .catch(err => {
            console.error(err.stack);
            res.status(500).json({ error: 'Fallo al guardar los datos.' });
        });
});

// Endpoint para leer la información médica (método GET)
app.get('/profile/:id', (req, res) => {
    const { id } = req.params;
    const sql = `SELECT * FROM medical_profiles WHERE id = $1`;

    client.query(sql, [id])
        .then(result => {
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Perfil no encontrado.' });
            }
            res.json(result.rows[0]);
        })
        .catch(err => {
            console.error(err.stack);
            res.status(500).json({ error: 'Fallo al recuperar el perfil.' });
        });
});

// Inicia el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});