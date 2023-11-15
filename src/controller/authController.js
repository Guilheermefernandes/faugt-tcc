const bcrypt = require('bcrypt');
const validator = require('validator');

const Elderly = require('../models/Elderly');
const Caregiver = require('../models/Caregiver');
const Responsible = require('../models/Responsible');
const { generateToken } = require('../config/passport');
const Admim = require('../models/Admim');

module.exports = {
    signin: async (req, res) => {

        const { email, password } = req.body;

        if(!email || !validator.isEmail(email)){
            res.json({ error: 'email e/ou senha inválidos!' });
            return;
        }

        const elderly = await Elderly.findOne({ email });
        const caregiver = await Caregiver.findOne({ email });
        const responsible = await Responsible.findOne({ email });
        if(!elderly && !caregiver && !responsible){
            res.json({ error: 'Email e/ou senha inválido!' });
            return;
        }

        let type;
        let token;

        if(elderly){
            const verifyHash = await bcrypt.compare(password, elderly.password);
            if(!verifyHash){
                res.json({ error: 'Email e/ou senha inválidos!' });
                return
            }
            type = elderly.type;
            token = generateToken({
                id: elderly._id,
                type
            });
        }
        if(caregiver){
            const verifyHash = await bcrypt.compare(password, caregiver.password);
            if(!verifyHash){
                res.json({ error: 'Email e/ou senha inválidos!' });
                return
            }
            type = caregiver.type;
            token = generateToken({
                id: caregiver._id,
                type
            });
        }
        if(responsible){
            const verifyHash = await bcrypt.compare(password, responsible.password);
            if(!verifyHash){
                res.json({ error: 'Email e/ou senha inválidos!' });
                return
            }
            type = responsible.type;
            token = generateToken({
                id: responsible._id,
                type
            });
        }

        res.json({ response: true, type, token });

    },
    signup: async (req, res) => {
       
        const fields = [
            'name',
            'lastName',
            'email',
            'phone',
            'cpf',
            'cep',
            'state',
            'city',
            'neighborhood',
            'password',
            'type'
        ];

        let user = {};

        for(let i in fields){

            const fieldName = fields[i];

            if(req.body[fieldName]){

                if(fieldName === 'email'){
                    const error = 'Esse email já existe em nosso sistema!';
                    const verifyElderly = await Elderly.findOne({ email: req.body[fieldName] });
                    const verifyResponsible = await Responsible.findOne({ email: req.body[fieldName] });
                    const verifyCaregiver = await Caregiver.findOne({ email: req.body[fieldName] });
                    if(verifyElderly || verifyResponsible || verifyCaregiver){
                        res.json({ error });
                        return;
                    }

                    user[fieldName] = req.body[fieldName];
                    continue
                }

                if(fieldName === 'cpf'){

                    const error = 'Esse CPF já esta cadastrado em nosso sistema!';
                    const verifyElderly = await Elderly.findOne({ cpf: req.body[fieldName] });
                    const verifyResponsible = await Responsible.findOne({ cpf: req.body[fieldName] });
                    const verifyCaregiver = await Caregiver.findOne({ cpf: req.body[fieldName] });
                    if(verifyElderly || verifyResponsible || verifyCaregiver){
                        res.json({ error });
                        return;
                    }
                
                    user[fieldName] = req.body[fieldName];
                    continue;
                }
                if(fieldName === 'password'){
                    const hash = await bcrypt.hash(req.body[fieldName], 10);
                    user[fieldName] = hash;
                    continue;
                }

                user[fieldName] = req.body[fieldName];

            }else{
                res.json({ error: `${fieldName} não preenchido!` });
                return;
            }

        }

        let token;

        switch(user.type){
            case 'elderly':
                user.dateCreated = new Date();
                user.like = [];
                user.evaluation = [];
                user.responsible = '';
                user.caregiver = '';
                user.avatar = '';
                user.describe = '';
                user.permission = 2
                const newElderly = new Elderly(user);
                await newElderly.save();    
                token = generateToken({ id: newElderly._id, type: newElderly.type });
            break
            case 'responsible':
                user.questions = false;
                user.pendding = [];
                user.dateCreated = new Date();
                user.elderly = '';
                user.avatar = '';
                user.status = true;
                user.permission = 1;
                const newResponsible = new Responsible(user);
                await newResponsible.save();
                token = generateToken({ id: newResponsible._id, type: newResponsible.type });  
            break
            case 'caregiver':
                user.disposition = '650f265827e151354b57bbaf';
                user.elderly = [];
                user.pendding = [];
                user.dateCreated = new Date();
                user.avatar = '';
                user.status = true;
                user.describe = '';
                user.permission = 1;
                user.evaluation = 0;
                const newCaregiver = new Caregiver(user);
                await newCaregiver.save();    
                token = generateToken({ id: newCaregiver._id, type: newCaregiver.type });
            break
        }

        res.status(201).json({ response: true, token, type: user.type });

    },
    admimSignin: async (req, res) => {
        const { email, password } = req.body;
        if(!email || !validator.isEmail(email)){
            res.status(400).json({ error: 'Email e/ou senha inválidos!' }); 
            return;
        }
        if(!password || password < 10 || password > 16){
            res.status(400).json({ error: 'Email e/ou senha inválidos!' });
            return;
        }

        const admim = await Admim.findOne({ email });
        if(!admim){
            res.status(404).json({ error: 'Email e/ou senha inválidos!' });
            return;
        }

        const hash = await bcrypt.compare(password, admim.password);
        if(!hash){
            res.status(400).json({ error: 'Email e/ou senha inválidos!' });
            return;
        }

        if(admim.permission < 3){
            res.status(403).json({ error: 'Você não possui autorização!' });
            return;
        }

        const token = generateToken({ 
            id: admim._id,
            type: admim.type
        });

        res.status(200).json({ token });

    }
}