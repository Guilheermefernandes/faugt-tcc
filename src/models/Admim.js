const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    permission: Number,
    type: String
});

const modelName = 'Admim';

if(mongoose.connection && mongoose.connection.model[modelName]){
    module.exports = mongoose.connection.model[modelName];
}else{
    module.exports = mongoose.model(modelName, schema, 'admim')
}