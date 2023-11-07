const { decoded } = require('../middleware/decoded');
const Caregiver = require('../models/Caregiver');
const Responsible = require('../models/Responsible');
const Elderly = require('../models/Elderly');
const Period = require('../models/Period');

const returnUserData = async (type, id) => {
    switch(type){
        case 'elderly':
            return await Elderly.findById(id);
            break
        case 'responsible':
            return await Responsible.findById(id);
            break
        case 'caregiver':
            return await Caregiver.findById(id);   
            break
    }
}

module.exports = {
    getResponsibles: async (req, res) =>{
        const { authorization } = req.headers;
        const data = decoded(authorization);

        const user = await returnUserData(data.type, data.id);

        const status = true;
        let responsibles = await Responsible.find({ status });

        for(let i in responsibles){
            responsibles[i].avatar = `http://localhost:5000/media/${responsibles[i].avatar}`
        }

        res.json({ response: true, responsibles, userName: user.name, lastName: user.lastName});
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
                                    if(caregiver.status === false){
                                        res.json({ error: 'Este cuidador já possui uma associação!' });
                                        return;
                                    }

                                    penddingItem.status = false;
                                    penddingItem.accept = true;

                                    elderly.caregiver = caregiver._id;
                                    caregiver.elderly.push(penddingItem.idElderly);
                                    item.status = false;

                                    const disposition = await Period.findById(caregiver.disposition);
                                    if(disposition.name.toLowerCase() === 'integral'){
                                        caregiver.status = false;

                                        caregiver.pendding.forEach((i) => {
                                            if(i.indentifier !== indentifier){
                                                i.accept = false;
                                                i.status = false;
                                            }
                                        });

                                    }

                                    user.pendding.forEach((i) => {
                                        if(i.indentifier !== indentifier){
                                            i.accept = false;
                                            i.status = false;
                                        }
                                    });

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
    },
    getPenddings: async (req, res) => {
        const { authorization } = req.headers;
        const data = decoded(authorization);  

        const user = await Responsible.findById(data.id);
        if(!user){
            res.status(404).json({ error: 'Usúario não encontrado! Tente novamente.' });
            return;
        }
            
        let penddings = [];

        for(let i=0;i<user.pendding.length;i++){
            if(user.pendding[i].accept === true && user.pendding[i].status === true){
                penddings.push(
                    user.pendding[i]
                );
            }
        }

        let list = []
        for(let i=0;i<penddings.length;i++){
            const caregiver = await Caregiver.findById(penddings[i].idCaregiver);
            const elderly = await Elderly.findById(penddings[i].idElderly);
            if(!caregiver || !elderly){
                continue;
            }

            const cpf = `${caregiver.cpf}`; 

            let newCpf = "";
            for(let j=0;j<cpf.length;j++){
                if(j == 9 || j == 10){
                    newCpf += cpf[j];
                }else{
                    newCpf += "*";
                }
            }

            list.push({
                name: caregiver.name,
                lastName: caregiver.lastName,
                email: caregiver.email,
                phone: caregiver.phone,
                cpf: newCpf,
                state: caregiver.state,
                city: caregiver.city,
                neighborhood: caregiver.neighborhood,
                avatar: `${process.env.BASE}/media/${caregiver.avatar}`,
                indentifier: penddings[i].indentifier,
                avatarElderly: `http://localhost:5000/media/${elderly.avatar === '' ? 'logo-sistema' : elderly.avatar}`,
                nameElderly: elderly.name,
                emailElderly: elderly.email
            });
        }

        res.status(200).json({list});
    },
}