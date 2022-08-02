const { isValidObjectId } = require("mongoose");
const PasswordResetToken=require("../models/passwordResetToken");
const { sendError } = require("../utils/helper");
exports.isValidPassResetToken=async(req,res,next) =>{
    const {token,userId}=req.body;
if(!token.trim() || !isValidObjectId(userId)) return sendError(res,"Invalid Request!");

 const resetToken=await PasswordResetToken.findOne({owner:userId})
 if(!resetToken) return sendError(res,"Unauthorized access,Invalid Request!");

 const matched = await resetToken.compareToken(token);
 if(!matched) return sendError(res,"Unauthorized access,Invalid Request!");
 req.resetToken=resetToken; //we can access this req.resetToken from our controller
 next();   //the token is valid and the token is matched, and it will move to the next controller
}