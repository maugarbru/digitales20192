
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
/**
 * uri que tiene la posibilidad de enviar los datos
 */
app.post("/insertRegistro", function (req, res) {
    let body = req.body
    let query = `insert  into  registros (uid_maquina,consumo,hora_inicio,hora_fin)  
    values (${body.uid_maquina},${body.consumo},'${body.hora_inicio}', '${body.hora_fin}')`
    client.query(query, function (err, result) {
        if (err) {
            console.log(err);
            res.status(400).send(err);
        }
        res.status(200).send("Se han agregado los datos satisfactoriamente");
    });
});
/**
 * query para filtro por fechas de los reportes
 *  params:
 * - recibe como parametro dos fechas especificas que son fecha_inicio  y fecha_fin
 */
app.get("/filtroFecha?", function (req, res) {
    let params = req.query
    // let query = `select * from  registros 
    // where to_timestamp(hora_inicio,'YYYY-MM-DD') between '${params.fecha_inicio}'  and  '${params.fecha_fin}'` 
    let query = `select substring(hora_inicio from 0 for 11), round(avg(consumo),2) from registros
    where  to_timestamp(hora_inicio,'YYYY-MM-DD') between '${params.fecha_inicio}'  and  '${params.fecha_fin}'
    group by  substring(hora_inicio from 0 for 11)`
    client.query(query, function (err, result) {
        if (err) {
            console.log(err);
            res.status(400).send(err);
        }
        res.status(200).send(result.rows);
    });
});
/**
 * query para filtro por fechas de los reportes
 *  params:
 * - recibe como parametro una fechas especificas que es fecha 
 */
app.get("/filtroDia?", function (req, res) {
    let params = req.query
    let query = `select  * from registros 
    where  hora_inicio  like '${params.fecha}%'`
    client.query(query, function (err, result) {
        if (err) {
            console.log(err);
            res.status(400).send(err);
        }
        res.status(200).send(result.rows);
    });
});


port = 8080
app.listen(port, () => {
    console.log(`Node is running in: http://localhost:${port}`);

})
