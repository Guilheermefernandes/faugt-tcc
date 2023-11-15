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
        if(!user){
            res.status(404).json({ error: 'Não encontramos seu registro. Tente novamente!' });
            return;
        }
        if(user.responsible !== ''){
            res.status(403).json({ error: 'Você já possui uma associação!' });
            return;
        }
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

        const { id } = req.query;
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

    },
    desassociation: async (req, res) => {
        const { authorization } = req.headers;
        const data = decoded(authorization);

        let user;
        try{
            const id = new mongoose.Types.ObjectId(data.id);
            user = await Elderly.findById(id);
            if(!user){
                res.status(404).json({ response: false, error: 'Ocorreu um erro ao indentificar seu usuario em nosso sistema, tente novamente!' });
                return;
            }
        }catch(e){
            console.error('Error', e);
            res.status(500).json({ response: false, error: 'Ocorreu algum erro inesperado!' });
            return;
        }
        
        if(user.caregiver === ''){
            res.status(404).json('Você ainda não possui um cuidador!');
            return;
        }


        let caregiver;
        try{

            const idCaregiver = new mongoose.Types.ObjectId(user.caregiver);
            caregiver = await Caregiver.findById(idCaregiver);
            if(!caregiver){
                res.status(404).json({ response: false, error: 'Não conseguimos encontrar seu cuidador em nosso sistema! Tente novamete mais tarde.' })
                return;
            } 

        }catch(e){
            console.error('Error', e);
            res.status(500).json({ response: false, error: 'Ocorreu um erro interno do servidor!' });
            return
        }

        for(let i in caregiver.elderly){
            
            try{

                const idOfTheTime = new mongoose.Types.ObjectId(caregiver.elderly[i]);
                if(idOfTheTime.equals(user._id)){

                    try{
                        await Caregiver.findOneAndUpdate(
                            { _id: caregiver._id },
                            {
                                $pull: {
                                  elderly: `${user._id}`  
                                },
                                $set: {
                                    status: true
                                }
                            },
                        );

                        await Elderly.findOneAndUpdate(
                            { _id: user._id },
                            {
                                $set: {
                                    caregiver: ''
                                }
                            }
                        )
                    }catch(err){
                        console.error('Error', err);
                        res.status(500).json({ response: false, error: 'Ocorreu um erro interno no servidor!' });
                        return;
                    }

                }

            }catch(e){
                console.error('Error', err);
                res.status(500).json({ response: false, error: 'Ocorreu um erro interno no servidor!' });
                return;
            }

        }

        res.status(200).json({ response: true, msg: 'Você não possui mais um cuidador!' });

    },
    endorseCaregiver: async (req, res) => {
        const { authorization } = req.headers;
        const { note, idCaregiver } = req.body;
        const data = decoded(authorization);

        let user;
        try{
            const idUser = new mongoose.Types.ObjectId(data.id);
            user = await Elderly.findById(idUser);
            if(!user){
                res.status(404).json({ response: true, error: 'Não encontramos seu usuario! Tente novamente.' });
                return;
            }
        }catch(e){
            console.log('Error', e);
            res.status(500).json({  });
            return;
        }

        let caregiver;
        try{
            const idObject = new mongoose.Types.ObjectId(idCaregiver);
            caregiver = await Caregiver.findById(idObject);
        }catch(e){
            console.error('Error', e);
            res.status(500).json({ response: false, error: 'Ocorreu um erro interno no sevidor!' });
            return;
        }

        for(let i in user.evaluation){
            try{
                const id = new mongoose.Types.ObjectId(user.evaluation[i]);
                if(id.equals(caregiver._id)){
                    res.status(404).json({ response: false, error: 'Você já avaliou esse cuidador!' });
                    return;
                }
            }catch(e){
                console.error('Error', e);
                res.status(500).json({ response: false, error: 'Ocorreu um erro interno no sevidor!' });
                return;
            }
        }

        let notes = caregiver.evaluation;
        notes.push(Number(note))

        await Caregiver.findOneAndUpdate(
            { _id: caregiver._id },
            {
                $set: {
                    evaluation: notes
                },
            },
        );

        let evaluation = user.evaluation;
        evaluation.push(caregiver._id);

        await Elderly.findOneAndUpdate(
            { _id: user._id },
            {
                $set: {
                    evaluation: evaluation
                },
            },
        );

        res.status(200).json({ response: true, msg: 'Sua nota foi enviada com suscesso!' });
    }
}