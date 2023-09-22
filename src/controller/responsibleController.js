const { decoded } = require('../middleware/decoded');
const Caregiver = require('../models/Caregiver');
const Responsible = require('../models/Responsible');
const Elderly = require('../models/Elderly');

module.exports = {
    getResponsibles: async (req, res) =>{
        const status = true;
        const responsibles = await Responsible.find({ status });

        res.json({ response: true, responsibles });
    },
    requestForCaregiver: async (req, res) => {
        const { indentifier , option} = req.body;
        const { authorization } = req.headers;
        const data = decoded(authorization);

        if(data.type !== 'responsible'){
            res.status(403).json({ error: 'Não foi autorizado a acessar essa rota!' });
            return;
        }

        const user = await Responsible.findById(data.id);
        if(!user){
            res.status(404).json({ error: 'Seu usuário não foi encontrado!' });
            return;
        }

        for(const item of user.pendding){
            if(item.indentifier === indentifier){

                const caregiver = await Caregiver.findById(item.idCaregiver);
                if(!caregiver){
                    return res.status(404).json({ error: 'Cuidador não encontrado!' });
                }
                const elderly = await Elderly.findById(user.elderly);
                if(!elderly){
                    return res.status(404).json({ error: 'Idoso não encontrado!' });
                }

                const error = ' Ocorreu um erro no servidor!';

                switch(option){
                    case 'accept':
                        try{
                            for(const penddingItem of caregiver.pendding){
                                if(penddingItem.indentifier === indentifier){
                                    penddingItem.status = false;
                                    penddingItem.accept = true;
                                    elderly.caregiver = caregiver._id;
                                    caregiver.elderly.push(penddingItem.idElderly);
                                    item.status = false;
                                    await Responsible.findOneAndUpdate(
                                        user._id, {$set: user}
                                    );
                                    await Caregiver.findOneAndUpdate(
                                        caregiver._id, {$set: caregiver}
                                    );
                                    await Elderly.findOneAndUpdate(
                                        elderly._id, {$set: elderly}
                                    );
                                    break;
                                }
                            }
                        }catch(err){
                            console.error('Error Accept: ', err);
                            return res.status(500).json({ error });
                        }
                    break
                    case 'recused':
                        try{
                            for(const penddingItem of caregiver.pendding){
                                if(penddingItem.indentifier === indentifier){
                                    penddingItem.status = false;
                                    penddingItem.accept = false;
                                    item.status = false;
                                    await Responsible.findOneAndUpdate(
                                        user._id, {$set: user}
                                    );
                                    await Caregiver.findOneAndUpdate(
                                        caregiver._id, {$set: caregiver}
                                    );
                                    break;
                                }
                            }
                        }catch(err){
                            console.error('Error Recused: ', err);
                            return res.status(500).json({ error });
                        }
                    break
                }

                break;

            }
        }

        res.status(200).json({ response: true });
    }
}