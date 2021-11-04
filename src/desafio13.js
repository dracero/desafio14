const express = require('express')
const handlebars = require('express-handlebars')
const initListeners = require('./listeners')
const cors = require('cors');

const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
app.use(cors())


require('./database/connection')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))


app.use(express.static(__dirname + '/public'))
app.engine('hbs',handlebars({
  extname: '.hbs',
  layoutsDir: __dirname + '/views/layouts', 
}))
app.set('view engine','hbs')
app.set('views', __dirname + '/views');



//rutas 

app.get('/',(req,res)=>{
  res.render('form',{layout: 'index'})
})
app.use('/productos',require('./routes/productos'))

//rutas API
app.use('/api/productos', require('./routes/api/productos'))

//socket

initListeners(io)

//errores
app.use((error, req, res, next) => {
  res.status(error.code || 500).json({ error : error.message })
})

const PORT =  process.env.PORT || 8080

const server = http.listen(PORT, () => {
  console.log(`servidor escuchando en http://localhost:${PORT}`)
})

server.on('error', error => {
  console.log('error en el servidor:', error)
})
