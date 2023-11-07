const { response } = require("express");
const { decoded } = require("../middleware/decoded");
const Caregiver = require('../models/Caregiver');
const Responsible = require('../models/Responsible');
const Elderly = require("../models/Elderly");

module.exports = {
    requestForElderly: async (req, res) => {
        const { indentifier, option } = req.body;
        const { authorization } = req.headers;
        const data = decoded(authorization);

        if(data.type !== 'caregiver'){
            res.status(403).json({ error: 'Você não posssui permissão!' });
            return;
        }

        const user = await Caregiver.findById(data.id);
        if(!user){
            res.status(404).json({ error: 'Seu usuário não foi encontrado!' });
            return;
        }

        for(const item of user.pendding){
            if(item.indentifier === indentifier){

                const responsible = await Responsible.findById(item.idResponsible);
                if(!responsible){
                    res.status(404).json({ error: 'Responsavel não encontrado!' });
                    return
                }

                const error = 'Erro interno do servidor!';

                switch(option){
                    case 'accept':
                        try{
                            for(const penddingItem of responsible.pendding){
                                if(penddingItem.indentifier === indentifier){
                                    const elderly = await Elderly.findById(item.idElderly);
                                    if(elderly.caregiver === ''){
                                        penddingItem.accept = true;
                                        await Responsible.findOneAndUpdate(
                                            responsible._id, {$set: responsible}
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

                                        res.json({ error: 'Este pedido não está mais disponivél!' });
                                        return;
                                    }
                                    break
                                }
                            }
                        }catch(err){
                            console.log('Error Accept: ', err);
                            return res.status(500).json({ error });
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
                            console.log('Error Recused: ', err);
                            return res.status(500).json({ error });
                            
                        }
                    break
                }

                break;

            }
        }

        res.status(200).json({ response: true });

    },
    getNotificationElderly: async (req, res) => {
        const { authorization } = req.headers;
        const data = decoded(authorization);

        const user = await Caregiver.findById(data.id);
        if(!user){
            res.status(404).json({ error: 'Usuario não encontrado! Tente novamente.' });
            return;
        }

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
                avatarElderly: `http://localhost:5000/media/${elderly.avatar === '' ? 'logo-sistema' : elderly.avatar}`,
                nameElderly: elderly.name,
                emailElderly: elderly.email
            });
        }

        res.status(200).json({list});
    },
}