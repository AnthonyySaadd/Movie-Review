const {check,validationResult} =require("express-validator");

exports.userValidator=[
    check ("name").trim().not().isEmpty().withMessage("Name is missing!"),
    check ("email").isEmail().withMessage("Email is invalid!"),
    check ("password")
    .trim()
    .not().
    isEmpty()
    .withMessage("password is missing!")
    .isLength({min:8,max:20})
    .withMessage("password must be 8 to 20 characters long!")
];

exports.validatePassword=[
check ("newPassword")
    .trim()
    .not()
    .isEmpty()
    .withMessage("password is missing!")
    .isLength({min:8,max:20})
    .withMessage("password must be 8 to 20 characters long!")
];



exports.validate=(req,res,next) =>{
const error =validationResult(req).array();
if(error.length){
  return  res.json({ error: error[0].msg});
}
next();

};