const User=require("../models/user");
const EmailVerificationToken=require("../models/emailVerificationToken");
const {isValidObjectId }=require("mongoose");
const { generateOTP, generateMailTransporter } = require("../utils/mail");
const { sendError } = require("../utils/helper");
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
const isMatched =await token.compaireToken(OTP)  //otp coming from our user 
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