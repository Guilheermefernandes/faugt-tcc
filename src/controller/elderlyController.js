const { decoded } = require("../middleware/decoded");
const Elderly = require('../models/Elderly');
const Responsible = require('../models/Responsible');
const Caregiver = require('../models/Caregiver');
const mongoose = require('mongoose');

module.exports = {
    associateResponsible: async (req, res) => {

        const { id } = req.body;
        const { authorization } = req.headers;

        const data = decoded(authorization);
        const user = await Elderly.findById(data.id);
        const responsible = await Responsible.findById(id);

        if(!responsible){
            res.json({ error: 'Responsavél não encontrado!' });
            return;
        }

        user.responsible = responsible._id;
        responsible.elderly = user._id;
        responsible.status = false;
        await user.save();
        await responsible.save();

        res.json({ response: true });

    },
    like: async (req, res) => {

        const { id } = req.body;
        const { authorization } = req.headers;
        const data = decoded(authorization);

        const user = await Elderly.findById(data.id);
        if(!user){
            res.json({ error: 'Usuário não encontrado!' });
            return;
        } 
        const caregiver = await Caregiver.findById(id);
        if(!caregiver){
            res.json({ error: 'Cuidador não encontrado!' });
            return;
        }

        let like = user.like;
        like.push(caregiver._id);
        user.like = like;
        await user.save();

        res.json({ response: true });

    }
}