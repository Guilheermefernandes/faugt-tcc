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
    elderly: String,
    pendding: [Object],
    avatar: String,
    status: Boolean,
    permission: Number,
    questions: Boolean,
    type: String
});

const modelName = 'Responsible';

if(mongoose.connection && mongoose.connection.model[modelName]){
    module.exports = mongoose.connection.model[modelName];
}else{
    module.exports = mongoose.model(modelName, schema, 'responsible')
}