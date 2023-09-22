const { decoded } = require('../middleware/decoded');
const Caregiver = require('../models/Caregiver');
const Elderly = require('../models/Elderly');
const Responsible = require('../models/Responsible');
const { v4: uuid } = require('uuid');

module.exports = {
    caregiverList: async (req, res) => {

        const { q, state, city } = req.query;

        let filters = {};

        const status = true;
        const caregivers = await Caregiver.find({ status });

        let list = [];

        for(let i in caregivers){
            list.push({
                name: caregivers[i].name,
                lastName: caregivers[i].lastName,
                email: caregivers[i].email,
                phone: caregivers[i].phone,
                state: caregivers[i].state,
                city: caregivers[i].city,
                neighborhood: caregivers[i].neighborhood,
                dateCreated: caregivers[i].dateCreated,
                avatar: caregivers[i].avatar,
                describe: caregivers[i].describe,
            })
        }

        res.json({ response: true, list });
    },
    associationCaregiverAndElderly: async (req, res) => {
        const { id } = req.body;
        const { authorization } = req.headers;
        const data = decoded(authorization);

        const elderly = await Elderly.findById(data.id)
        if(!elderly){
            res.status(404).json({ error: 'Não inteficamos seu usuário!' });
            return;
        }
        const caregiver = await Caregiver.findById(id);
        if(!caregiver){
            res.status(404).json({ error: 'Cuidador não encontrado!' });
            return;
        }
        const responsible = await Responsible.findById(elderly.responsible);

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

        res.json({ response: true });
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