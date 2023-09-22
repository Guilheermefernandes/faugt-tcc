const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    decoded: (text) => {
        const divider = text.split(' ');
        const token = divider[1];
        return jwt.verify(token, process.env.SECRET_KEY);
    }
}