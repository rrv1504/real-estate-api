import jwt from "jsonwebtoken";
import User from '../models/User.js';



export const requireSignIn = (req, res, next) => {
    try {
        // To get the token from an Authorization Bearer token, you should extract the token part from the header. The header usually looks like: Authorization: Bearer <token>. You need to split the string and get the second part.
        const decoded  = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET);

        req.user = decoded;
        next();
    } catch (error) {
        console.log("Error in Authorization : " + error);
        return res.status(401).json({
            success:false,
            messsage:error.messsage || "Invalid token",
            error: error.message,
        });
    }
    
}

export const isAdmin = async (req, res, next) => {
  try {
    // lowercase 'user' to match requireSignIn
    const user = await User.findById(req.user._id);

    if (!user.role.includes("Admin")) {
      return res
        .status(403)
        .json({ success: false, message: "Admin Resource. Access Denied" });
    }

    next();
  } catch (error) {
    console.log("Unauthorized Admin Error : " + error.message);
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized Admin Access : " + error.message });
  }
};




