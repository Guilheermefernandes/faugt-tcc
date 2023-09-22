const { decoded } = require('../middleware/decoded');
const Caregiver = require('../models/Caregiver');
const Responsible = require('../models/Responsible');

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

        for(let i in user.pendding){
            if(user.pendding[i].indentifier === indentifier){

                let caregiver = await Caregiver.findById(user.pendding[i].idCaregiver);
                let pendding;

                switch(option){
                    case 'accept':
                        pendding = caregiver.pendding;
                        for(let i in pendding){
                            if(pendding[i].indentifier === indentifier){
                                pendding[i].status = false;
                                pendding[i].accept = true;
                                let elderly = caregiver.elderly;
                                elderly.push(user.pendding[i].idElderly);
                                caregiver.pendding[i] = pendding;
                                caregiver.elderly = elderly;
                                user.pendding[i].status = false;

                                await user.save();
                                await caregiver.save();
                            }
                        }
                    break
                    case 'recused':
                        pendding = caregiver.pendding;
                        for(let i in pendding){
                            if(pendding[i].indentifier === indentifier){
                                pendding[i].status = false;
                                pendding[i].accept = false;
                                caregiver.pendding[i] = pendding;
                                user.pendding[i].status = false

                                await user.save();
                                await caregiver.save();
                            }
                        }
                    break
                }

            }
        }
    }
}