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
const bcrypt = require('bcrypt');

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
                    avatar: `${process.env.BASE}/media/${me.avatar === '' ? 'logo-sistema.jpeg' : me.avatar}`,
                    type: me.type,
                    caregiver: me.caregiver
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
                    avatar: `${process.env.BASE}/media/${me.avatar === '' ? 'logo-sistema.jpeg' : me.avatar}`,
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
                    avatar: `${process.env.BASE}/media/${me.avatar === '' ? 'logo-sistema.jpeg' : me.avatar}`,
                    type: me.type
                }    
            break
        }

        const icons = {
            exit: `${process.env.BASE}/media/logout.png`
        };

        res.json({ response: true, type: data.type , user, icons});
    },
    getElderly: async (req, res) => {

        const { id } = req.query;

        let filters = {};

        if(id){
            filters._id = id
        }
        const elderly = await Elderly.find( filters );

        let list = [];

        for(let i in elderly){

            list.push({
                id: elderly[i]._id,
                name: elderly[i].name,
                lastName: elderly[i].lastName,
                email: elderly[i].email,
                phone: elderly[i].phone,
                state: elderly[i].state,
                city: elderly[i].city,
                neighborhood: elderly[i].neighborhood,
                dateCreated: elderly[i].dateCreated,
                avatar: `${process.env.BASE}/media/${elderly[i].avatar}`,
                describe: elderly[i].describe,
            });
        }

        res.json({ response: true, list });
    },
    getCaregiver: async (req, res) => {

        const { id } = req.query;
        const { authorization } = req.headers;
        const data = decoded(authorization); 

        let filters = {};

        if(id){
            filters._id = id
        }
        const caregiver = await Caregiver.find( filters );

        let list = [];

        for(let i in caregiver){

            let qtd = 0;
            let sum = 0;
            for(let j in caregiver[i].evaluation){
                qtd += 1;
                sum += caregiver[i].evaluation[j];       
            }

            let evaluation;
            if(qtd > 1){
                evaluation = sum / qtd; 
            }else{
                evaluation = sum !== null ? sum : 0;
            }

            const elderly = await Elderly.findById(data.id);
            if(!elderly){
                res.status(404).json({response: false, error: 'Ocorreu um erro tente novamente!' });
                return;
            }

            let alreadyEvaluated = false;
            for(let i in elderly.evaluation){
                
                try{
                    const idEvaluation = new mongoose.Types.ObjectId(elderly.evaluation[i]);
                    if(idEvaluation.equals(caregiver[0]._id)){
                        alreadyEvaluated = true;
                    }
                }catch(e){
                    console.error('Error', e)
                    res.status(500).json({ response: false, error: 'Ocorreu um error interno!' });
                    return;
                }   
                
            }

            list.push({
                id: caregiver[i]._id,
                name: caregiver[i].name,
                lastName: caregiver[i].lastName,
                email: caregiver[i].email,
                phone: caregiver[i].phone,
                state: caregiver[i].state,
                city: caregiver[i].city,
                neighborhood: caregiver[i].neighborhood,
                dateCreated: caregiver[i].dateCreated,
                avatar: `${process.env.BASE}/media/${caregiver[i].avatar}`,
                describe: caregiver[i].describe,
                evaluation: evaluation,
                alreadyEvaluated: alreadyEvaluated,
            });
        }

        res.json({ response: true, list });
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
            'password'
        ];

        if(req.files && req.files.avatar){
            if(['image/jpg', 'image/jpeg', 'image/png'].includes(req.files.avatar.mimetype)){    
                const img = await addImage(req.files.avatar.data);
                filters.avatar = img;
            }   
        }

        for(const field of fieldsToFillIn){
            if(req.body[field]){
                if(field === 'password'){
                    const hash = await bcrypt.hash(req.body[field], 10);
                    filters[field] = hash;
                    continue;
                }
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

        const logo = `${process.env.BASE}/media/methmedic-before.png`;

        res.status(200).json({logo});
    },
    recovery: async (req, res) => {
        const { id, password} = req.body;

        const user = await Elderly.findById(id);
        if(!user){
            res.status(404).json({ error: 'Ocorreu um erro!' });
            return;
        }

        const hash = await bcrypt.hash(password, 10);

        filter = {
            password: hash
        };

        await Elderly.findOneAndUpdate(user._id, {$set: filter});
        res.json({ hash });
    }
}