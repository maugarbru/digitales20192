
const cors =  require("cors")
var express = require("express")
var path = require("path")
var { Client } = require('pg')
var connectionString = 'postgres://equipo1:digitales123@localhost:5432/equipo1'
var client = new Client({
    connectionString: connectionString
});
// client.connect();
var app =  express();
app.use(cors())

app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname + "/front/index.html"))
})
app.get('/about/',(req,res)=>{
    res.sendFile(path.join(__dirname + "/front/about.html"))
})
app.get("/datos/", async function (req, res) {
    res.status(200).send({ success: true, message: "Se ha realizado la peticion con exito" })

})
port =  8080
app.listen(port,()=>{
    console.log(`Node is running in: http://localhost:${port}`);
    
} )
