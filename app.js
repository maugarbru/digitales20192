
const cors =  require("cors")
var express = require("express")
var { Client } = require('pg')
var connectionString = 'postgres://equipo1:digitales123@localhost:5432/equipo1'
var client = new Client({
    connectionString: connectionString
});
// client.connect();
var app =  express();
app.use(cors())
app.get('/',(req,res)=>{
    res.status(200).send("todo melo")
})
app.get("/datos/", async function (req, res) {
    res.status(200).send({ success: true, message: "Se ha realizado la peticion con exito" })

})
// app.use("/crud/",require('./crud'))
// app.set('port',  process.env.PORT || 8080);
port =  8080
app.listen(port,()=>{
    console.log("node is running");
    
} )