const { decoded } = require("./decoded");
const Elderly = require('../models/Elderly');

module.exports = {
    verificationPermission: (permission) => {
        return async (req, res, next) => {
            const { authorization } = req.headers;
            const data = decoded(authorization);
            
            try{
                if(data.type === 'elderly'){
                    const user = await Elderly.findById(data.id);
                    if(!user){
                        res.status(404).json({ error: 'Usuario não encontrado!' });
                    }
    
                    if(user.permission >= permission){
                        next();
                    }else{
                        res.status(403).json({ error: 'Você não tem permissão para acessa essa página!' });
                    }
                }else{
                    res.status(403).json({ error: 'Este usuario não tem permissão de acesso a essa página!' });
                }
            }catch(err){
                res.status(401).json({ error: 'Token inválido ou não existente!' });
            }
        }
    }
}
