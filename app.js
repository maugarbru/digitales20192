
const cors = require("cors")
var express = require("express")
var path = require("path")
var bodyParser = require("body-parser");
var { Client } = require('pg')
var connectionString = 'postgres://equipo1:digitales123@localhost:5432/equipo1'
var client = new Client({
    connectionString: connectionString
});
client.connect();
var app = express();
app.use(cors())
app.use(bodyParser.json({ limit: "50mb" }));
//support parsing of application/x-www-form-urlencoded post data
app.use(
    bodyParser.urlencoded({
      extended: true,
      limit: "50mb",
      parameterLimit: 50000
    })
  );

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + "/front/index.html"))
})
app.get('/about/', (req, res) => {
    res.sendFile(path.join(__dirname + "/front/about.html"))
})
/**
 * uri con las opciones de traer todos los registros
 */
app.get("/datos/", async function (req, res) {
    client.query('SELECT * FROM registros', function (err, result) {
        if (err) {
            console.log(err);
            res.status(400).send(err);
        }
        res.status(200).send(result.rows);
    });
});
app.get("/hola",  function (req, res) {
	res.status(200).send("Hola familia");
});
/**
 * uri que tiene la posibilidad de enviar los datos
 */
app.post("/insertRegistro", function (req, res) {
    let body =  req.body
    let query =`insert  into  registros (uid_maquina,consumo,hora_inicio,hora_fin)  
    values (${body.uid_maquina},${body.consumo},'${body.hora_inicio}', '${body.hora_fin}')`
    client.query(query, function (err, result) {
        if (err) {
            console.log(err);
            res.status(400).send(err);
        }
        res.status(200).send("Se han agregado los datos satisfactoriamente");
    });
});
port = 8080
app.listen(port, () => {
    console.log(`Node is running in: http://localhost:${port}`);

})
