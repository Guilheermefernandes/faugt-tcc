const { decoded } = require('../middleware/decoded');
const Caregiver = require('../models/Caregiver');
const Elderly = require('../models/Elderly');
const Period = require('../models/Period');
const Responsible = require('../models/Responsible');
const { v4: uuid } = require('uuid');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

module.exports = {
    caregiverList: async (req, res) => {

        const { q, state, city, id } = req.query;

        let filters = {};

        filters.status = true;
        if(id){
            filters._id = id
        }
        const caregivers = await Caregiver.find( filters );

        let list = [];

        for(let i in caregivers){

            let evaluation = 0;

            const disposition = await Period.findById(caregivers[i].disposition);
            if(caregivers[i].evaluation.length > 0){
                
                let sum = 0;
                for(let j=0;j<caregivers[i].evaluation.length;j++){
                    sum += caregivers[i].evaluation[j];
                }
                evaluation = sum / caregivers[i].evaluation.length;
            }else{
                evaluation = 0;
            }

            list.push({
                id: caregivers[i]._id,
                name: caregivers[i].name,
                lastName: caregivers[i].lastName,
                email: caregivers[i].email,
                phone: caregivers[i].phone,
                state: caregivers[i].state,
                city: caregivers[i].city,
                neighborhood: caregivers[i].neighborhood,
                dateCreated: caregivers[i].dateCreated,
                avatar: `${process.env.BASE}/media/${caregivers[i].avatar}`,
                disposition: disposition.name,
                evaluation,
                describe: caregivers[i].describe,
            })
        }

        res.json({ response: true, list });
    },
    associationCaregiverAndElderly: async (req, res) => {
        const { id } = req.body;
        const { authorization } = req.headers;
        const data = decoded(authorization);

        let icon = `${process.env.BASE}/media/close.png`;

        const elderly = await Elderly.findById(data.id)
        if(!elderly){
            res.status(404).json({ error: 'Não indenficamos seu usuário!' , icon});
            return;
        }
        const caregiver = await Caregiver.findById(id);
        if(!caregiver){
            res.status(404).json({ error: 'Cuidador não encontrado!', icon });
            return;
        }
        const responsible = await Responsible.findById(elderly.responsible);

        for(let i in caregiver.pendding){
            if(caregiver.pendding[i].idElderly.equals(elderly._id)){
                res.status(404).json({ response: false, error: 'Você já fez uma solicitação para essa pessoa!', icon });
                return;
            } 
        }

        const indentifier = uuid();

        let penddingCrgr = caregiver.pendding;
        penddingCrgr.push({
            indentifier,
            accept: false,
            status: true,
            idElderly: elderly._id,
            idResponsible: responsible._id
        });
        caregiver.pendding = penddingCrgr;

        let penddingRpsb = responsible.pendding
        penddingRpsb.push({
            indentifier,
            accept: false,
            status: true,
            idCaregiver: caregiver._id,
            idElderly: elderly._id
        });
        responsible.pendding = penddingRpsb;

        await caregiver.save();
        await responsible.save();

        icon = `${process.env.BASE}/media/check.png`;

        res.json({ response: true, icon});
    }
}

/*

cuidador

numero
id idoso
id responsavel

responsavel 

numero
boolean
id cuidador
*/