
const User=require("../models/user");
const EmailVerificationToken=require("../models/emailVerificationToken"); 
const PasswordResetToken=require("../models/passwordResetToken");
const {isValidObjectId }=require("mongoose");
const { generateOTP, generateMailTransporter } = require("../utils/mail");
const { sendError, generateRandomByte } = require("../utils/helper");
exports.create =  async (req,res) => {
  const {name, email ,password}=req.body;

const oldUser=await User.findOne({email});

if(oldUser){ 
  return sendError(res,"this email is already in use!");
}


const newUser=new User({name,email,password});
 await newUser.save();


//generate 6 digit otp
 let OTP=generateOTP();
 //store otp inside our db
const newEmailVerificationToken= new EmailVerificationToken({
  owner:newUser._id,
  token:OTP
});

await newEmailVerificationToken.save();

 var transport = generateMailTransporter();

transport.sendMail({
  from:"verification@reviewapp.com",
  to:newUser.email,
  subject:"email verification",
  html: `
  <p>your verification OTP</p>
 <h1>${OTP}</h1>
  `
});


res.status(201).json({message: "Please verify your email. OTP has been sent to your email account!"});
};

exports.verifyEmail= async(req,res) =>{

  const {userId,OTP}=req.body;
   
  if (!isValidObjectId(userId)) return    sendError(res,"invalid user id!")   ; 
const user =await User.findById(userId);
if (!user) return  sendError(res,"user not found",404)  ;                  
if(user.isVerified) return sendError(res,"user is already verified")    ;                         

const token=await EmailVerificationToken.findOne({owner:userId});
if(!token) return  sendError(res,"token not found ")   ;            
const isMatched =await token.compareToken(OTP)  //otp coming from our user 
if (!isMatched) return     sendError(res,"Please submit a valid otp !")   ;     
user.isVerified=true;
await user.save();
await EmailVerificationToken.findByIdAndDelete(token._id);


var transport = generateMailTransporter();

transport.sendMail({
  from:"verification@reviewapp.com",
  to:user.email,
  subject:"weclome email",
  html: `<h1> Welcome to our app and thank for choosing us<h1> `
});

res.json({message :"your email is verified"})


};

exports.resendEmailVerificationToken= async(req,res) =>{
const {userId}=req.body;
const user =await User.findById(userId);
if (!isValidObjectId(userId)) return  sendError(res,"user not found!");  
if (user.isVerified) return  sendError(res,"This email id is already verified");  
const alreadyHasToken=await EmailVerificationToken.findOne({owner:userId});
if(alreadyHasToken) return  sendError(res," only after one hour you can request for a new token ");         

let OTP=generateOTP();
 //store otp inside our db
const newEmailVerificationToken= new EmailVerificationToken({
  owner:user._id,
  token:OTP
});
await newEmailVerificationToken.save();
//send this otp to our user 
 var transport = generateMailTransporter();
transport.sendMail({
  from:"verification@reviewapp.com",
  to:user.email,
  subject:"email verification",
  html: `
  <p>your verification OTP</p>
 <h1>${OTP}</h1>
  `
});


res.json({message:"New OTP has been sent to your email !"});


}

exports.forgetPassword=async (req,res)=>{
const { email }=req.body;
if(!email) return sendError(res,"email is missing") ;
const user =await User.findOne({email});
if(!user) return sendError(res,"User not found",404);
const alreadyHasToken=await PasswordResetToken.findOne({owner:user._id});
if(alreadyHasToken) return sendError(res,"only after one hour you can request for another token!"); 

const token= await generateRandomByte();

const newPasswordResetToken=  new PasswordResetToken({
  owner:user._id,
  token:token
});
await newPasswordResetToken.save();

const resetPasswordUrl=`http://localhost:3000/reset-password?token=${token}&id=${user._id}`;

var transport = generateMailTransporter();

transport.sendMail({
  from:"security@reviewapp.com",
  to:user.email,
  subject:"reset password link",
  html: `
  <p>Click Here to reset password</p>
 <a href="${resetPasswordUrl}">change password </a>
  `
});
res.json({message:"Link sent to your email!"});
};
exports.sendResetPasswordTokenStatus =(req,res)=>{
  res.json({valid:true});
}
exports.resetPassword=async(req,res)=>{
  const {newPassword,userId}=req.body;
const user=await User.findById(userId)
const matched =await user.comparePassword(newPassword);
if(matched) return sendError(res, "The new password must be different from the old one!");
user.password=newPassword;
await user.save();      //befor the save our userSchema.pre will hash the password
await PasswordResetToken.findByIdAndDelete(req.resetToken._id);

const  transport = generateMailTransporter();
transport.sendMail({
  from:"security@reviewapp.com",
  to:user.email,
  subject:"Password Reset Successfully!",
  html: `
  <h1>Passsword Reset Successfully!</h1>
  <p> Now you can use your new password</p>
  `
});
res.json({message:"password reset successfully,now you can use your new password"});

};