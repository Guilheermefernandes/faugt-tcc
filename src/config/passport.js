const passport = require('passport')
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

const jwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const Elderly = require('../models/Elderly');
const Responsible = require('../models/Responsible');
const Caregiver = require('../models/Caregiver');

dotenv.config();

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.SECRET_KEY 
}

passport.use(new jwtStrategy (options, async (payload, done) => {
    switch(payload.type){
        case 'elderly':
            const elderly = await Elderly.findById(payload.id);
            if(elderly){
                return done(null, elderly);
            }else{
                return done(err, false);
            }
        break
        case 'responsible':
            const responsible = await Responsible.findById(payload.id);
            if(responsible){
                return done(null, responsible);
            }else{
                return done(err, false);
            }
        break
        case 'caregiver':
            const caregiver = await Caregiver.findById(payload.id);
            if(caregiver){
                return done(null, caregiver);
            }else{
                return done(err, false);
            }
        break
    }
}));

const generateToken = (data) => {
    return jwt.sign(data, process.env.SECRET_KEY);
}

module.exports = {
    generateToken,
    passport
}