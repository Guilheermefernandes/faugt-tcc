const bcrypt = require('bcrypt');
const validator = require('validator');

const Elderly = require('../models/Elderly');
const Caregiver = require('../models/Caregiver');
const Responsible = require('../models/Responsible');
const { generateToken } = require('../config/passport');

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

        switch(user.type){
            case 'elderly':
                user.dateCreated = new Date();
                user.like = [];
                user.responsible = '';
                user.caregiver = '';
                user.avatar = '';
                user.describe = '';
                user.permission = 2
                const newElderly = new Elderly(user);
                await newElderly.save();    
            break
            case 'responsible':
                user.pendding = [];
                user.dateCreated = new Date();
                user.elderly = '';
                user.avatar = '';
                user.status = true;
                user.permission = 1
                const newResponsible = new Responsible(user);
                await newResponsible.save();    
            break
            case 'caregiver':
                user.elderly = [];
                user.pendding = [];
                user.dateCreated = new Date();
                user.avatar = '';
                user.status = true;
                user.describe = '';
                user.permission = 1
                const newCaregiver = new Caregiver(user);
                await newCaregiver.save();    
            break
        }

        res.json({ response: user });

    }
}