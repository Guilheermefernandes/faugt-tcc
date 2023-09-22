const { response } = require("express");
const { decoded } = require("../middleware/decoded");
const Caregiver = require('../models/Caregiver');
const Responsible = require('../models/Responsible');

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
                                    penddingItem.accept = true;
                                    await Responsible.findOneAndUpdate(
                                        responsible._id, {$set: responsible}
                                    );
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

    }
}