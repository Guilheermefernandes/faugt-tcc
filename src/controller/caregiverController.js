const { response } = require("express");
const { decoded } = require("../middleware/decoded");
const Caregiver = require('../models/Caregiver');
const Responsible = require('../models/Responsible');
const Elderly = require("../models/Elderly");
const dotenv =  require('dotenv');
const mongoose = require('mongoose');
const Period = require('../models/Period');

dotenv.config();

module.exports = {
    requestForElderly: async (req, res) => {
        const { indentifier, option } = req.body;
        const { authorization } = req.headers;
        const data = decoded(authorization);

        let icon = `${process.env.BASE}/media/close.png`;

        if(data.type !== 'caregiver'){
            res.status(403).json({ response: false, error: 'Você não posssui permissão!', icon });
            return;
        }

        const user = await Caregiver.findById(data.id);
        if(!user){
            res.status(404).json({ response: false, error: 'Seu usuário não foi encontrado!', icon });
            return;
        }

        for(const item of user.pendding){
            if(item.indentifier === indentifier){

                const responsible = await Responsible.findById(item.idResponsible);
                if(!responsible){
                    res.status(404).json({ response: false, error: 'Responsavel não encontrado!', icon });
                    return
                }

                const error = 'Erro interno do servidor!';

                switch(option){
                    case 'accept':
                        try{

                            let index = 0;
                            for(const penddingItem of responsible.pendding){
                                if(penddingItem.indentifier === indentifier){
                                    const elderly = await Elderly.findById(item.idElderly);
                                    if(elderly.caregiver === ''){
                                        filter = { _id: responsible._id};
                                        await Responsible.findOneAndUpdate(
                                            filter, 
                                            {$set: {[`pendding.${index}.accept`]: true}} 
                                        );
                                        item.underAnalysis = true;
                                        await Caregiver.findOneAndUpdate(
                                            user._id, {$set: user}
                                        );
                                    }else{
                                        penddingItem.accept = false;
                                        penddingItem.status = false;
                                        await Responsible.findOneAndUpdate(
                                            responsible._id, {$set: responsible}
                                        );
                                        item.status = false;
                                        item.accept = false;
                                        await Caregiver.findOneAndUpdate(
                                            user._id, {$set: user}
                                        );

                                        res.status(404).json({ response: false, error: 'Este pedido não está mais disponivél!', icon });
                                        return;
                                    }
                                    break
                                }
                                index++;
                            }
                        }catch(err){
                            console.log('Error Accept: ', err);
                            return res.status(500).json({ response: false, error, icon });
                        }
                    break
                    case 'recused':
                        try{
                            for(const penddingItem of responsible.pendding){
                                if(penddingItem.indentifier === indentifier){
                                    penddingItem.status = false;
                                    item.status = false;
                                    await Caregiver.findOneAndUpdate(
                                        user._id, {$set: user}
                                    );
                                    await Responsible.findOneAndUpdate(
                                        responsible._id, {$set: responsible}
                                    );
                                    break;
                                }
                            } 
                        }catch (err){
                            console.error('Error Recused: ', err);
                            return res.status(500).json({ response: false, error, icon });
                        }
                    break
                }

                break;

            }
        }

        const msg = 'Sua solicitação foi enviada com suscesso para o responsável';
        icon = `${process.env.BASE}/media/check.png`;

        res.status(200).json({ response: true, msg, icon});

    },
    getNotificationElderly: async (req, res) => {
        const { authorization } = req.headers;
        const data = decoded(authorization);

        const user = await Caregiver.findById(data.id);
        if(!user){
            res.status(404).json({ response: false, error: 'Usuario não encontrado! Tente novamente.' });
            return;
        }

        const association = user.elderly.length >= 1;

        let penddings = [];
        
        for(let i=0;i<user.pendding.length;i++){
            if(user.pendding[i].status === true){
                penddings.push(
                    user.pendding[i]
                );
            }
        }

        
        let list = []
        for(let i=0;i<penddings.length;i++){
            const responsible = await Responsible.findById(penddings[i].idResponsible);
            const elderly = await Elderly.findById(penddings[i].idElderly);
            if(!responsible || !elderly){
                continue;
            }

            const cpf = `${responsible.cpf}`; 

            let newCpf = "";
            for(let j=0;j<cpf.length;j++){
                if(j == 9 || j == 10){
                    newCpf += cpf[j];
                }else{
                    newCpf += "*";
                }
            }

            list.push({
                name: responsible.name,
                lastName: responsible.lastName,
                email: responsible.email,
                phone: responsible.phone,
                cpf: newCpf,
                state: responsible.state,
                city: responsible.city,
                neighborhood: responsible.neighborhood,
                avatar: `${process.env.BASE}/media/${responsible.avatar === '' ? 'logo-sistema' : responsible.avatar}`,
                indentifier: penddings[i].indentifier,
                idElderly: elderly._id,
                avatarElderly: `http://localhost:5000/media/${elderly.avatar === '' ? 'logo-sistema' : elderly.avatar}`,
                nameElderly: elderly.name,
                emailElderly: elderly.email,
                inAnalysis: penddings[i].underAnalysis
            });
        }

        res.status(200).json({ response: true, list, association });
    },
    getAssociationCaregiver: async (req, res) => {
        const { authorization } = req.headers;
        const data = decoded(authorization);

        if(data.type !== 'caregiver'){
            res.status(401).json({ response: false, error: 'Você não possui acesso á essa rota!' });
            return;
        }

        const user = await Caregiver.findById(data.id);
        if(!user){
            res.status(404).json({ response: false, error: 'Não conseguimos encontrar seu usuario!' });
            return;
        }
        
        const id_disposition_user = user.disposition;
        let user_disposition;
        if(mongoose.Types.ObjectId.isValid(id_disposition_user)){
            try{
                user_disposition = new mongoose.Types.ObjectId(id_disposition_user);
            }catch(e){
                console.error('Error', e);
                res.status(500).json({ response: false, error: 'Ocorreu um erro em nosso servidor!' });
                return;
            }
        }else{
            res.status(500).json({ response: false, error: 'Ocorreu um erro interno!' });
            return;
        }

        let id_period_integral;

        const idPeriod = '650f265827e151354b57bbaf';
        try{
            id_period_integral = new mongoose.Types.ObjectId(idPeriod);
        }catch(e){
            console.error('Error', e);
            res.status(500).json({ response: false, error: 'Ocorreu um erro com sua requisição!' });
            return;
        }
    
        if(user_disposition.equals(id_period_integral) && user.elderly.length === 1){
            
            const elderly = await Elderly.findById(user.elderly[0]);
            if(!elderly){
                res.status(404).json({ response: false, error: 'Esse idoso já não existe em nosso sistema!' });
                return;
            }

            let list = [];

            for(let i in user.elderly){
                const elderly = await Elderly.findById(user.elderly[i]);
                if(!elderly){
                    res.status(404).json({ error: 'Esse idoso já não existe mais em nosso sistema!' });
                    return
                }

                const responsible = await Responsible.findById(elderly.responsible);

                list.push({
                    nameElderly: elderly.name,
                    lastNameElderly: elderly.lastName,
                    avatarElderly: `${process.env.BASE}/media/${elderly.avatar}`,
                    emailElderly: elderly.email,
                    phoneElderly: elderly.phone,
                    stateElderly: elderly.state,
                    cityElderly: elderly.city,
                    neighboorhoodElderly: elderly.neighboorhood,
                    describeElderly: elderly.describe,
                    nameResponsible: responsible.name,
                    lastNameResponsible: responsible.lastName,
                    avatarResponsible: `${process.env.BASE}/media/${responsible.avatar}`,
                    emailResponsible: responsible.email,
                    phoneResponsible: responsible.phone,
                    stateResponsible: responsible.state,
                    cityResponsible: responsible.city,
                    neighboorhoodResponsible: responsible.neighboorhood,
                });

            }

            res.status(200).json({ response: true, list, association: true});
            return;
        }

        let idPeriod_MyPeriod = '650f268827e151354b57bbb0';
        try{
            idPeriod_MyPeriod = new mongoose.Types.ObjectId(idPeriod_MyPeriod);
        }catch(e){
            console.error('Error: ', e);
            res.status(500).json({ response: false, e });
            return;
        }

        if(user_disposition.equals(idPeriod_MyPeriod) && user.elderly.length >= 1){
            
            let list = [];

            for(let i in user.elderly){
                const elderly = await Elderly.findById(user.elderly[i]);
                if(!elderly){
                    res.status(404).json({ error: 'Esse idoso já não existe mais em nosso sistema!' });
                    return
                }

                const responsible = await Responsible.findById(elderly.responsible);

                list.push({
                    nameElderly: elderly.name,
                    lastNameElderly: elderly.lastName,
                    avatarElderly: `${process.env.BASE}/media/${elderly.avatar}`,
                    emailElderly: elderly.email,
                    phoneElderly: elderly.phone,
                    stateElderly: elderly.state,
                    cityElderly: elderly.city,
                    neighboorhoodElderly: elderly.neighboorhood,
                    nameResponsible: responsible.name,
                    lastNameResponsible: responsible.lastName,
                    avatarResponsible: `${process.env.BASE}/media/${responsible.avatar}`,
                    emailResponsible: responsible.email,
                    phoneResponsible: responsible.phone,
                    stateResponsible: responsible.state,
                    cityResponsible: responsible.city,
                    neighboorhoodResponsible: responsible.neighboorhood
                });

            }

            res.status(200).json({ response: true, list, association: true });
            return;
        }

        res.status(500).json({ response: false, error: 'Ocorreu um error inesperado!' });
    }
}