const express = require('express')
const handlebars = require('express-handlebars')
const initListeners = require('./listeners')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const MongoStore = require('connect-mongo')

require('dotenv').config()

const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)

app.use(session({
  store: MongoStore.create({ 
    mongoUrl: `${process.env.MONGO_ATLAS_URL}`,
    ttl: 60 * 10
  }),
  secret: 'secreto',
  resave: true,
  saveUninitialized: true,
  clear_interval: 600
}))

app.use(cookieParser())

require('./database/connection')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//Public folder + Handlebars
app.use(express.static(__dirname + '/public'))
app.engine('hbs',handlebars({
  extname: '.hbs',
  layoutsDir: __dirname + '/views/layouts', 
}))
app.set('view engine','hbs')
app.set('views', __dirname + '/views');

const isLogged = ((req,res,next)=>{
  const isLogged =  Boolean(req.session.username)
  const logged = req.cookies['logged']
  console.log(logged)
  if( !isLogged || !logged) return res.redirect('/auth')
   next()
})


//Rutas 

app.get('/',isLogged,(req,res)=>{

  return res.cookie('logged',true,{ maxAge: 100000 }).render('main',{
    layout: 'index',
    isLogged: req.cookies['logged'] || false,
    username: req.session.username
  })
})

app.use('/productos',require('./routes/productos'))
app.use('/auth',require('./routes/auth'))


//Rutas API
app.use('/api/productos', require('./routes/api/productos'))
app.use('/api/auth', require('./routes/api/auth'))

//Socket

initListeners(io)

// Middleware para manejar errores
app.use((error, req, res, next) => {
  res.status(error.code || 500).json({ error : error.message })
})



const PORT = 8080

const server = http.listen(PORT, () => {
  console.log(`servidor escuchando en http://localhost:${PORT}`)
})

server.on('error', error => {
  console.log('error en el servidor:', error)
})
