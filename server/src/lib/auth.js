require("dotenv").config();

const bcrypt  = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;


// Password hashing 
const hashPassword = async(password) => {
    return bcrypt.hash(password, 12);
}

const verifyPassword = async(password, hash)=>{
    return bcrypt.compare(password, hash);
}

// JWT token
const generateAccessToken = (payload) =>{
    return jwt.sign(payload, JWT_SECRET, {expiresIn: "15m"})
};

const generateRefreshToken = (payload) => {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: "30d"  // Matches session.expiresAt in DB
    })
}

const verifyAccessToken = (token) =>{ //generate payload
    return jwt.verify(token, JWT_SECRET);
}

const verifyRefreshToken = (token) =>{ // generate payload
    return jwt.verify(token, JWT_REFRESH_SECRET);
}

module.exports = {
    hashPassword,
    verifyPassword,
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
};

