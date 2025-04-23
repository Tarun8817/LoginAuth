import jwt from "jsonwebtoken";

const userAuth = async (req, res, next) => {
    const { token } = req.cookies; // extract token string from cookie

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Not authorized. Login again",
        });
    }

    try {
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
        if(!req.body) {
            req.body = {}; // Initialize req.body if it doesn't exist
        }
        // Add userId to req.body if it doesn't already exist
        if (tokenDecode && tokenDecode.id) {
            req.body.userId = tokenDecode.id;
            req.user = tokenDecode.id; // Add userId to req.user for later use  
            next();
        } else {
            return res.status(401).json({
                success: false,
                message: "Not authorized. Login again",
            });
        }
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
            error: error.message,
        });
    }
};

export default userAuth;
