import UserModel from "../models/userModel.js";

export const getUserData= async (req, res) => {
    try{
        const {userId} = req.body;
        const user = await UserModel.findById(userId);
        if(!user){
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
         res.status(200).json({
            success: true,
            userData:{
                name: user.firstName + " " + user.lastName,
                isAccountVerified: user.isAccountVerified,
            },
            message: "User data fetched successfully",
            user,
        });

    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
}
