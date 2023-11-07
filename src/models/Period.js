const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    name: String,
});

const modelName = 'Period';

if(mongoose.connection && mongoose.connection.model[modelName]){
    module.exports = mongoose.connection.model[modelName];
}else{
    module.exports = mongoose.model(modelName, schema, 'periods')
}