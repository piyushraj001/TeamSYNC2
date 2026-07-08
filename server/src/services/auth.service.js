

const crypto = require("crypto");
const {prisma} = require("../lib/prisma")

const generateResetToken = ()=>{

const token = crypto.randomBytes(32).toString('hex')

const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

// sha256 is used for hashing 
// update token to hashed one
// digest turn this to redable form

return {token, hashedToken};

}

const saveResetToken = async(email) =>{
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return null;

  const { token, hashedToken } = generateResetToken();

  await prisma.user.update({
    where: { email },
    data: {
      resetToken: hashedToken,
      resetTokenExpiry: new Date(Date.now() + 10 * 60 * 1000)
    }
  });

  return token; 
}


module.exports = {saveResetToken}

