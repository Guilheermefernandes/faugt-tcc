const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const Elderly = require('../models/Elderly'); 
const Responsible = require('../models/Responsible');
const Caregiver = require('../models/Caregiver');
const { decoded } = require('../middleware/decoded');
const { default: mongoose } = require('mongoose');
const Period = require('../models/Period');
const { v4: uuid } = require('uuid');
const jimp = require('jimp');

dotenv.config();

const returnUserData = async (type, id) => {
    switch(type){
        case 'elderly':
            return await Elderly.findById(id);
            break
        case 'responsible':
            return await Responsible.findById(id);
            break
        case 'caregiver':
            return await Caregiver.findById(id);   
            break
    }
}

const addImage = async (buffer) => {
    const imgName = `${uuid()}.jpg`;
    const img = await jimp.read(buffer);
    img.cover(150, 150).quality(100).write(`./public/media/${imgName}`);
    return imgName;
}

const errorUnauthorized = 'Você não possui autorização de acesso a essa página!';
const userNotFound = 'Ocorreu um erro, não conseguimos indentifica-ló em nosso sistema';
const serverError = 'Ocorreu um erro interno no servidor!';

module.exports = {
    getPeriod: async (req, res) => {
        const { authorization } = req.headers;
        const data = decoded(authorization);

        if(data.type !== 'caregiver'){
            return res.status(403).json({ error: errorUnauthorized });
        }

        const user = await Caregiver.findById(data.id);
        if(!user){
            return res.status(404).json({ error: userNotFound });
            
        }
        
        if(user.disposition !== ''){
            return res.json({ error: 'Você já possui uma disposição!' });
            
        }

        const periods = await Period.find({});

        res.status(200).json({ periods });
    },
    setPeriod: async (req, res) => {
        const { period } = req.body;
        const { authorization } = req.headers;
        const data = decoded(authorization);

        if(data.type !== 'caregiver'){
            return res.status(403).json({ error: errorUnauthorized });
        }

        const user = await Caregiver.findById(data.id);
        if(!user){
            return res.status(404).json({ error: userNotFound });
        }

        if(user.disposition !== ''){
            return res.json({ error: 'Você já possui uma disposição!' });
        }
        const checkIdPeriod = mongoose.Types.ObjectId.isValid(period)
        if(!checkIdPeriod){
            return res.status(404).json({ error: 'Id de período inválido!' });
        }
        try{
            const myPeriod = await Period.findById(period);
            user.disposition = myPeriod._id;
            await Caregiver.findOneAndUpdate(user._id, {$set: user});
        }catch(err){
            console.error('Error: ', err);
            return res.status(500).json({ error: serverError });
        }

        res.status(200).json({ response: true });
    },
    getUser: async (req, res) => {

        const { authorization } = req.headers; 
        const data = decoded(authorization);

        const me = await returnUserData(data.type, data.id);

        let user = {};

        switch(data.type){
            case 'elderly':
                user = {
                    name: me.name,
                    lastName: me.lastName,
                    email: me.email,
                    phone: me.phone,
                    state: me.state,
                    city: me.city,
                    neighborhood: me.neighborhood,
                    dateCreated: me.dateCreated,
                    describe: me.describe,
                    avatar: `http://localhost:5000/media/${me.avatar === '' ? 'logo-sistema.jpeg' : me.avatar}`,
                    type: me.type
                }
            break
            case 'caregiver':
                user = {
                    name: me.name,
                    lastName: me.lastName,
                    email: me.email,
                    phone: me.phone,
                    state: me.state,
                    city: me.city,
                    neighborhood: me.neighborhood,
                    dateCreated: me.dateCreated,
                    describe: me.describe,
                    avatar: `http://localhost:5000/media/${me.avatar === '' ? 'logo-sistema.jpeg' : me.avatar}`,
                    type: me.type
                }
            break
            case 'responsible':
                user = {
                    name: me.name,
                    lastName: me.lastName,
                    email: me.email,
                    phone: me.phone,
                    state: me.state,
                    city: me.city,
                    neighborhood: me.neighborhood,
                    dateCreated: me.dateCreated,
                    avatar: `http://localhost:5000/media/${me.avatar === '' ? 'logo-sistema.jpeg' : me.avatar}`,
                    type: me.type
                }    
            break
        }

        const icons = {
            exit: `http://localhost:5000/media/logout.png`
        };

        res.json({ response: true, type: data.type , user, icons});
    },
    editUser: async (req, res) => {
        const { authorization } = req.headers;
        const data = decoded(authorization);

        let filters = {}

        const fieldsToFillIn = [
            'describe',
            'phone',
            'cep',
            'state',
            'city',
            'neighborhood',
        ];

        if(req.files && req.files.avatar){
            if(['image/jpg', 'image/jpeg', 'image/png'].includes(req.files.avatar.mimetype)){    
                const img = await addImage(req.files.avatar.data);
                filters.avatar = img;
            }   
        }

        for(const field of fieldsToFillIn){
            if(req.body[field]){
                filters[field] = req.body[field]
            }
        }

        let user;

        const editError = 'Usuario não encontrado! Tente novamente';

        switch(data.type){
            case 'elderly':
                user = await Elderly.findById(data.id);
                if(!user){
                    res.status(404).json({ error: editError });
                    return;
                }  
                await Elderly.findOneAndUpdate({_id: user._id}, {$set: filters});
            break
            case 'caregiver':
                user = await Caregiver.findById(data.id);
                if(!user){
                    res.status(404).json({ error: editError });
                    return;
                }
                await Caregiver.findOneAndUpdate({_id: user._id}, {$set: filters});
            break
            case 'responsible':
                user = await Responsible.findById(data.id);
                if(!user){
                    res.status(404).json({ error: editError });
                    return;
                }
                await Responsible.findOneAndUpdate({_id: user._id}, {$set: filters})    
            break 
        }

        res.status(200).json({ response: true, user: user.type });
    },
    getLogo: (req, res) => {

        const logo = 'http://localhost:5000/media/methmedic-before.png';

        res.status(200).json({logo});
    }
}