import jwt from 'jsonwebtoken';

// Generate token and return
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

export default generateToken;