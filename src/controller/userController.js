const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const Elderly = require('../models/Elderly'); 
const Responsible = require('../models/Responsible');
const Caregiver = require('../models/Caregiver');
const { decoded } = require('../middleware/decoded');
const { default: mongoose } = require('mongoose');

dotenv.config();

const returnUserData = async (type, id) => {
    console.log(type);
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

module.exports = {
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
                    avatar: me.avatar
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
                    avatar: me.avatar
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
                    avatar: me.avatar
                }    
            break
        }

        res.json({ response: true, type: data.type , user});
    }
}