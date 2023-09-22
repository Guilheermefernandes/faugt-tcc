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

        for(let i in user.pendding){
            if(user.pendding[i].indentifier === indentifier){

                const responsible = await Responsible.findById(user.pendding[i].idResponsible);
                if(!responsible){
                    res.status(404).json({ error: 'Responsavel não encontrado!' });
                    return
                }

                switch(option){
                    case 'accept':
                        try{
                            for(const penddingItem of responsible.pendding){
                                if(penddingItem.indentifier === indentifier){
                                    penddingItem.accept = true;
                                    console.log(responsible);
                                    await responsible.save();
                                    break;
                                }
                            } 
                        }catch (err){
                            console.log(err);
                            res.status(404).json({ error: 'Ocorreu um erro na requisição Accept!' });
                            return;
                        }
                    break
                    case 'recused':
                        try{
                            for(const penddingItem of responsible.pendding){
                                if(penddingItem.indentifier === indentifier){
                                    penddingItem.status = false;
                                    user.pendding[i].status = false;
                                    await user.save();
                                    await responsible.save();
                                    break;
                                }
                            } 
                        }catch (err){
                            console.log(err);
                            res.status(404).json({ error: 'Ocorreu um erro em sua requisição!' });
                            return;
                        }
                    break
                }

                break;

            }
        }

        res.status(200).json({ response: true });

    }
}