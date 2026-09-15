const {verifyAccessToken} = require("../lib/auth")

const authenticate =async (req,res,next) =>{
    try{
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith("Bearer")){
            return res.status(401).json({error: "No token provided"});
        }

        const token = authHeader.split(" ")[1]
        const payload = verifyAccessToken(token);

        req.user = payload;
        next()

    }catch(error){
        return res.status(401).json({error: "Invalid or expired token "})
    }
};

module.exports = {authenticate};




// this is used when the logged user visit the protected routes like /profile or /dashboard 

