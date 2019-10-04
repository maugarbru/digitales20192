
const express =  requiere ('express')
const cors =  require("cors")
var app =  express();
app.use(cors())
app.get('/',(req,res)=>{
    res.status(200).send("todo melo")
})
app.use("/crud",require('./crud'))
// app.set('port',  process.env.PORT || 8080);
port =  8080
app.liste(port,()=>{
    console.log("node is running");
    
} )