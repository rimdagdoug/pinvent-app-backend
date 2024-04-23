const mongoose=require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema=mongoose.Schema({
    name:{
        type: String,
        required: [true,"Please add a name"]
    },
    email:{
        type: String,
        required:[true,"Please add a email"],
        unique: true,
        trim: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "Please enter a valid email"
        ]
    },
    password:{
        type: String,
        required: [true,"Please add a password"],
        minlength:[6,"Password must be up to 6 characters"],
        //maxlength:[23,"Password must not be more than to 23 characters "],
    },
    photo:{
        type: String,
        required: [true,"Please add a photo"],
        default: "https://i.ibb.co/4pDNDK1/avatar.png" 
    },
    phone:{
        type: String,
        default: "+216" 
    },
    bio:{
        type: String,
        maxlength:[250,"Password must not be more than to 250 characters "],
        default: "bio" 
    }
},{
    timestamps: true,
});


//Encryt password before saving to DB
userSchema.pre("save",async function(next){
    if(!this.isModified("password")){
        return next();
    }

    //Hash password 
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password,salt);
    this.password = hashedPassword;
    next();
})


const User = mongoose.model("User", userSchema);
module.exports= User;