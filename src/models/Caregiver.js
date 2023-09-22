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
    pendding: [Object],
    avatar: String,
    status: Boolean,
    describe: String,
    dateCreated: Date,
    permission: Number,
    type: String,
    elderly: [String]
});

const modelName = 'Caregiver';

if(mongoose.connection && mongoose.connection.model[modelName]){
    module.exports = mongoose.connection.model[modelName];
}else{
    module.exports = mongoose.model(modelName, schema, 'caregiver');
}