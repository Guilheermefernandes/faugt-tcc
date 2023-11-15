const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    name: String,
    lastName: String,
    email: String,
    phone: String,
    cpf: String,
    cep: Number,
    state: String,
    city: String,
    neighborhood: String,
    password: String,
    dateCreated: Date,
    like: [String],
    responsible: String,
    caregiver: String,
    avatar: String,
    describe: String,
    permission: Number,
    evaluation: [String],
    type: String
});

const modelName = 'Elderly';

if(mongoose.connection && mongoose.connection.model[modelName]){
    module.exports = mongoose.connection.model[modelName];
}else{
    module.exports = mongoose.model(modelName, schema, 'elderly')
}