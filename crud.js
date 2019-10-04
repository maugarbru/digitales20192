const { Client } = requiere('pg')
const express = require("express")
const router = express.Router()
const connectionString = 'postgres://postgres:postgres@localhost:5432/database'
const client = new Client({
    connectionString: connectionString
});
client.connect();

router.get("/pacientes/", async function (req, res) {
    res.status(200).send({ success: true, message: "Se ha realizado la peticion con exito" })

})