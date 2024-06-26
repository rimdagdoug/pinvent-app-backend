//évitezd'écrire explicitement un bloc try-catch 
//dans chaque route qui utilise des opérations asynchrones
const asyncHandler= require("express-async-handler");
const User=require("../models/userModel");
const jwt = require('jsonwebtoken');
const bcrypt=require("bcryptjs");
const { use } = require("../routes/userRoute");
const Token = require("../models/tokenModel");
const crypto= require("crypto");
const sendEmail = require("../utils/sendEmail");


const  generatToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET,{expiresIn: "1d"})
};

//register user
const registerUser = asyncHandler( async (req, res) => {
    //utilise asyncHandler pour gérer les erreurs asynchrones dans la fonction
    const {name,email,password}= req.body

    //validation
    if(!name || !email || !password){
        res.status(400)
        throw new Error("please fill in all required fields")
    }
    if(password.length <6){
        res.status(400)
        throw new Error("password must be up to 6 charcters")
    }
    //check if user email already exists
     const userExists= await User.findOne({email})

     if(userExists){
        res.status(400)
        throw new Error("Email has already been registered")
     }

    

     //Creat new user
     const user = await User.create({
        name,
        email,
        password,
     });

      //Generate token
      const token=generatToken(user._id)

      //send HTTP-only cookie
      res.cookie("token", token,{
        path:"/",
        httpOnly: true,
        expires:new Date(Date.now( )+ 1000 * 86400), //1 day
        sameSite: "none",
        secure:true
      });
 

     if(user){
        const {_id,name,email,photo,phone,bio}=user
        res.status(201).json({
            _id,name,email,photo,phone,bio,token,
        })
     }else{
        res.status(400)
        throw new Error("Invalid user data")
     }
});


//login user
const loginUser =asyncHandler (async (req,res) => {
   const {email,password}=req.body
   //validation request
   if(!email || !password){
        res.status(400);
        throw new Error("please add email and password");
   }

   //check if user exists
   const user = await User.findOne({email})
   if(!user){
    res.status(400);
    throw new Error("User not found, please signup");
    }

    //User exist,check if password is correct
    const passwordIsCorrect = await bcrypt.compare(password, user.password);

    //Generate token
    const token=generatToken(user._id)

    //send HTTP-only cookie
    res.cookie("token", token,{
      path:"/",
      httpOnly: true,
      expires:new Date(Date.now( )+ 1000 * 86400), //1 day
      sameSite: "none",
      secure:true
    });

    if (user && passwordIsCorrect) {
        const {_id,name,email,photo,phone,bio}=user;
        res.status(200).json({
            _id,name,email,photo,phone,bio,token
        });
    }else{
        res.status(400);
        throw new Error("invalid email or password");
    }

});

const logout = asyncHandler(async(req,res) => {
    res.cookie("token", "",{
        path:"/",
        httpOnly: true,
        expires:new Date(0), 
        sameSite: "none",
        secure:true
      });
      return res.status(200).json({message: "Successfully logged out"});
});

//get user data
const getUser= asyncHandler(async(req,res)=>{
    const user = await User.findById(req.user._id);

    if(user){
        const {_id,name,email,photo,phone,bio}=user
        res.status(200).json({
            _id,name,email,photo,phone,bio,
        })
     }else{
        res.status(400)
        throw new Error("user not found");
     }
});

//get login status
const loginStatus= asyncHandler(async(req,res)=>{

    const token = req.cookies.token;
    if(!token){
        return res.json(false);
    }

    //verify token
    const verified = jwt.verify(token,process.env.JWT_SECRET);
    if(verified){
        return res.json(true);
    }
    return res.json(false);
    
});

//update user
const updateUser= asyncHandler(async(req,res)=>{
   const user= await User.findById(req.user._id)
   
   if(user){
    const {name,email,photo,phone,bio}=user;
    user.email=email;
    user.name=req.body.name || name;
    user.phone=req.body.phone || phone;
    user.bio=req.body.bio || bio;
    user.photo=req.body.photo || photo;

    const updatedUser= await user.save()
    res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        photo: updatedUser.photo,
        phone: updatedUser.phone,
        bio: updatedUser.bio,
    })
   }else{
     res.status(404)
     throw new Error("user not found")
   }
});

//change pasword
const chagePassword= asyncHandler(async(req,res)=>{
    const user= await User.findById(req.user._id);

    const {oldPassword,password}=req.body;

    if(!user){
        res.status(404)
        throw new Error("user not found please signup");
    }

    //validate
    if(!oldPassword || !password){
        res.status(404)
        throw new Error("please old and new password");
    }

    //check if old password matches password in BD
     const passwordIsCorrect = await bcrypt.compare(oldPassword,user.password);

     //save new password
     if(user && passwordIsCorrect){
        user.password= password
        await user.save()
        res.status(200).send("password change successful")
     }else{
        res.status(404)
        throw new Error("old password is incorect");
     }
    
});

const forgotPassword= asyncHandler(async(req,res)=>{
    const {email}= req.body
    const user = await User.findOne({email})

    if(!user){
        res.status(404)
        throw new Error("user does not exist")
    }

    //delete token if it exists in db
    let token = await Token.findOne({userId: user._id})
    if(token){
        await token.deleteOne()
    }

    //create rset token
    //génère un token de réinitialisation de mot de passe en combinant des octets aléatoires avec l'identifiant unique de l'utilisateur.
    let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
    console.log(resetToken);

    //hash token before saving to db(l'algorithme de hachage SHA-256)
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex")
    
    //save token to db
    await new Token({
        userId: user._id,
        token : hashedToken,
        createdAt: Date.now(),
        expiresAt: Date.now()+30*(60*1000)//thirty minutes

    }).save()

    //construct reset url
    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`

    //reset email 
    const message = `
        <h2>Hello ${user.name}</h2>
        <p>please use the url below to reset your password</p>
        <p>This rreset link is valid for only 30 minutes</p>

        <a href=${resetUrl} clicktracking=off>${resetUrl}</a>

        <p>Regards....</p>
        <p>Pinvent Team</p>

    `;
    const subject = "Password Reset Request"
    const send_to = user.email
    const sent_from = process.env.EMAIL_USER

    try {
        await sendEmail(subject, message, send_to,sent_from)
        res.status(200).json({success: true, message: "Reset email send"})
    } catch (error) {
        res.status(500)
        throw new Error("Email not sent, please try again")
    }
});

//Reset password
const resetPassword= asyncHandler(async(req,res) => {
    const {password}= req.body
    const {resetToken} = req.params

    //hash token before then compare to token in db
    const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex")

    //find token in db
    const userToken = await Token.findOne({
        token: hashedToken,
        expiresAt: {$gt: Date.now()}
    })

    if (!userToken) {
        res.status(500)
        throw new Error("invalid or expired token")
    }

    //find user
    const user = await User.findOne({_id: userToken.userId})
    user.password = password
    await user.save()
    res.status(200).json({
        message: "password reset successful please login"
    })
    


})


module.exports = {
    registerUser,
    loginUser,
    logout,
    getUser,
    loginStatus,
    updateUser,
    chagePassword,
    forgotPassword,
    resetPassword,
};
