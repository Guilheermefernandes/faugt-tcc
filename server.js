const express = require('express');
const fileupload = require('express-fileupload');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const router= require('./src/routers/router');
const { passport } = require('./src/config/passport');
const path = require('path');

dotenv.config();

mongoose.connect(process.env.MONGO_URL, { 
    useUnifiedTopology: true
});

mongoose.Promise = global.Promise;
mongoose.connection.on('error ', (error) => {
    console.log('error:', error);
});

const server = express();
server.use(passport.initialize());
server.use(cors());
server.use(express.json());
server.use(express.urlencoded({extended: true}));
server.use(express.static(path.join(__dirname, 'public')));
server.use(fileupload());

server.use('/', router);

server.listen(process.env.PORT, () => {
    console.log('Serviço rodando: ', process.env.BASE);
})