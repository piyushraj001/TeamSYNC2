const rateLimit = require("express-rate-limit")

const authRateLimit = rateLimit({
    windowMs: 15*60*1000,
    max : 5,
    message : {error: "Too many request, try later"}
})

module.exports = {authRateLimit}



