const { decoded } = require("./decoded");
const Elderly = require('../models/Elderly');
const Admim = require("../models/Admim");

module.exports = {
    verificationPermission: (permission) => {
        return async (req, res, next) => {
            const { authorization } = req.headers;
            const data = decoded(authorization);
            
            try{
                let user;
                switch(data.type){
                    case 'elderly':
                        user = await Elderly.findById(data.id);    
                    break
                }
                
                if(!user){
                    res.status(404).json({ error: 'Usuario não encontrado!' });
                }

                if(user.permission >= permission){
                    next();
                }else{
                    res.status(403).json({ error: 'Você não tem permissão para acessa essa página!' });
                }
            }catch(err){
                console.error('Error: ', err);
                res.status(401).json({ error: 'Token inválido ou não existente!' });
            }
        }
    }
}
