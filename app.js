
const cors = require("cors")
var express = require("express")
const fs = require("fs")
var json2xls = require('json2xls');
var path = require("path")
var bodyParser = require("body-parser");
var jwt = require('jsonwebtoken')
var { Client } = require('pg')
var connectionString = 'postgres://equipo1:digitales123@localhost:5432/equipo1'
var exceptionToken = ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjaGVjayI6dHJ1ZSwiaWF0IjoxNTczMDU5NTMxLCJleHAiOjE1NzMwNjA5NzF9.lluicOnBST8G2CA428CZdvlQeYFPMHX4zXhOzHbPU8E"]
var client = new Client({
  connectionString: connectionString
});
const rutasProtegidas = express.Router();
client.connect();
var app = express();
app.set("llave", "digitales123")
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

rutasProtegidas.use((req, res, next) => {
  const token = req.headers['access-token'];
  const tokenQuery = req.query["access-token"]
  console.log(tokenQuery);

  if (exceptionToken.filter(item => item == token).length > 0) {
    next();
  }
  // if (token) {
  jwt.verify(token, app.get('llave'), (err, decoded) => {
    if (err) {
      jwt.verify(tokenQuery, app.get('llave'), (err, decoded) => {
        if (err) {
          return res.json({ mensaje: 'Token inválida' });
        } else {
          req.decoded = decoded;
          next();
        }
      });
      // return res.json({ mensaje: 'Token inválida' });
    } else {
      req.decoded = decoded;
      next();
    }
  });

  // } else {
  //   res.send({
  //     mensaje: 'Token no proveída.'
  //   });
  // }
});


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + "/front/login.html"))
})
app.get('/about/', (req, res) => {
  res.sendFile(path.join(__dirname + "/front/about.html"))
})
app.get('/reportes/', (req, res) => {
  res.sendFile(path.join(__dirname + "/front/index.html"))
})
app.get('/GestorMaquinas/', (req, res) => {
  res.sendFile(path.join(__dirname + "/front/GestorMaquinas.html"))
})
/**
 * metodo de verificacion por paginas
 */
app.post("/verificacion", (req, res) => {
  const token = req.body['access-token'];
  if (token) {
    jwt.verify(token, app.get('llave'), (err, decoded) => {
      if (err) {
        return res.json({ mensaje: 'Token inválida' });
      } else {
        res.send({ mensaje: "token valido", success: true })
      }
    });
  } else {
    res.send({
      mensaje: 'Token no proveída.'
    });
  }
})

/**
 * autenticación de usuarios
 */
app.post('/autenticar?', (req, res) => {
  var params = req.query
  console.log(params.contraseña);

  let query = `select id,password from usuarios where id = '${params.usuario}' and password = '${params.contraseña}'`
  client.query(query, function (err, result) {
    console.log(result)
    console.log(query)
    if (err) {
      console.log(err);
      res.status(400).send(err);
    }

    if (result.rows.length > 0) {
      const payload = {
        check: true
      };
      const token = jwt.sign(payload, app.get('llave'), {
        expiresIn: 1440
      });
      res.json({
        mensaje: 'Autenticación correcta',
        token: token,
        success: true
      });
    } else {
      res.json({ mensaje: "Usuario o contraseña incorrectos", success: false })
    }
  });

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
    var xls = json2xls(result.rows);
    fs.writeFileSync('data.xlsx', xls, 'binary')
    res.sendFile(path.join(__dirname + "/data.xlsx"))
  });
});
/**
 * uri que tiene la posibilidad de enviar los datos
 */
app.post("/insertRegistro", function (req, res) {
  let body = req.body
  let consumo = (body.consumo / 60)
  let query = `insert  into  registros (uid_maquina,consumo,hora_inicio,hora_fin)  
    values (${body.uid_maquina},${consumo},'${body.hora_inicio}', '${body.hora_fin}')`
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
app.get("/filtroFecha?", rutasProtegidas, function (req, res) {
  let params = req.query
  let query = `select substring(hora_inicio from 0 for 11) as fecha, round(sum(consumo),2) as consumo  from registros
    where uid_maquina = ${params.uid} and to_timestamp(hora_inicio,'YYYY-MM-DD') between '${params.fecha_inicio}'  and  '${params.fecha_fin}'
    group by  substring(hora_inicio from 0 for 11) order by substring(hora_inicio from 0 for 11)`
  client.query(query, function (err, result) {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    }
    if (params.download == 'true') {
      var xls = json2xls(result.rows);
      fs.writeFileSync('data.xlsx', xls, 'binary')
      res.sendFile(path.join(__dirname + "/data.xlsx"))
    } else {
      res.status(200).send(result.rows)
    }
  });
});
/**
 * query para filtro por fechas de los reportes
 *  params:
 * - recibe como parametro una fechas especificas que es fecha 
 */
app.get("/filtroDia?", rutasProtegidas, function (req, res) {
  let params = req.query
  let query = `select  * from registros 
    where uid_maquina = ${params.uid} and hora_inicio like '${params.fecha}%' order by hora_fin`
  client.query(query, function (err, result) {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    }
    if (params.download == 'true') {
      var xls = json2xls(result.rows);
      fs.writeFileSync('data.xlsx', xls, 'binary')
      res.sendFile(path.join(__dirname + "/data.xlsx"))
    } else {
      res.status(200).send(result.rows)
    }
  });
});

/**
 * query para filtro por mes de los reportes
 *  params:
 * - recibe como parametro el mes con formato "AAAA-MM"
 */
app.get("/filtroMes?", rutasProtegidas, function (req, res) {
  let params = req.query
  let query = `select substring(hora_inicio from 0 for 11) as fecha, round(sum(consumo),2) as consumo  from registros
    where uid_maquina = ${params.uid} and (hora_inicio like '${params.mes}%')
    group by  substring(hora_inicio from 0 for 11) order by substring(hora_inicio from 0 for 11)`
  client.query(query, function (err, result) {
    console.log(result)
    if (err) {
      console.log(err);
      res.status(400).send(err);
    }
    if (params.download == 'true') {
      var xls = json2xls(result.rows);
      fs.writeFileSync('data.xlsx', xls, 'binary')
      res.sendFile(path.join(__dirname + "/data.xlsx"))
    } else {
      res.status(200).send(result.rows)
    }
  });
});

/**
 * query para obtener las maquinas
 */
app.get("/maquinas", rutasProtegidas, function (req, res) {
  let query = `select  * from maquinas`
  client.query(query, function (err, result) {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    }
    res.status(200).send(result.rows);
  });
});

/**
 * query para insert las maquinas
 */
app.post("/maquinas", rutasProtegidas, function (req, res) {
  let body = req.body
  let query = `insert into maquinas (codigo, nombre, ubicacion, descripcion) values ('${body.codigo}', '${body.nombre}', '${body.ubicacion}', '${body.descripcion}')`
  console.log(query);
  client.query(query, function (err, result) {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    }
    res.status(200).send("Se ha agregado la maquina correctamente");
  });
});

/**
 * query para update las maquinas
 */
app.put("/maquinas", rutasProtegidas, function (req, res) {
  let body = req.body
  let query = `update maquinas set codigo = '${body.codigo}', nombre = '${body.nombre}', ubicacion = '${body.ubicacion}', descripcion = '${body.descripcion}' where uid = ${body.uid}`
  console.log(query);
  client.query(query, function (err, result) {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    }
    res.status(200).send("Se ha actualizado la maquina correctamente");
  });
});

/**
 * query para delete las maquinas
 */
app.delete("/maquinas", rutasProtegidas, function (req, res) {
  let params = req.query
  let query = `delete from maquinas where uid = ${params.uid} `
  client.query(query, function (err, result) {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    }
    res.status(200).send("Se ha eliminado la maquina correctamente");
  });
});

/**
 * query para obtener las usuarios
 */
app.get("/usuarios", rutasProtegidas, function (req, res) {
  let query = `select id, nombre, telefono from usuarios`
  client.query(query, function (err, result) {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    }
    res.status(200).send(result.rows);
  });
});

/**
 * query para insert los usuarios
 */
app.post("/usuarios", rutasProtegidas, function (req, res) {
  let body = req.body
  let query = `insert into usuarios (id, nombre, telefono, password) values ('${body.id}', '${body.nombre}', '${body.telefono}', '${body.password}')`
  console.log(query);
  client.query(query, function (err, result) {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    }
    res.status(200).send("Se ha agregado la maquina correctamente");
  });
});

/**
 * query para delete los usuarios
 */
app.delete("/usuarios", rutasProtegidas, function (req, res) {
  let params = req.query
  let query = `delete from usuarios where id = '${params.id}' `
  client.query(query, function (err, result) {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    }
    res.status(200).send("Se ha eliminado la maquina correctamente");
  });
});


port = 8080
app.listen(port, () => {
  console.log(`Node is running in: http://localhost:${port}`);

})
