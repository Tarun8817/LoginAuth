
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstName:{
        type:String,
        required:true,
        trim:true,
        maxlength:[50,"Name cannot be more than 50 characters"]
    }
    ,lastName:{
        type:String,
        required:true,
        trim:true,
        maxlength:[50,"Name cannot be more than 50 characters"]
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true
    },
    password:{
        type:String,
        required:true,
        trim:true,
        minlength:[6,"Password cannot be less than 6 characters"],
        select:false
    },
    verifyOtp:{
        type:String,
        default:"",
    },
    verifyOtpExpireAt:{
        type:Number,
        default:0,
    },
    isAccountVerified:{
        type:Boolean,
        default:false,
    },
    resetOtp:{
        type:String,
        default:"",
    },
    resetOtpExpireAt:{
        type:Number,
        default:0,
    },

})


const UserModel =mongoose.models.user ||  mongoose.model("User",userSchema);


export default UserModel;