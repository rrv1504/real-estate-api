import express from 'express';
import {register,login,forgotPassword, currentUser, updatePassword, updateUsername,updateProfile} from '../controller/authController.js'
import { requireSignIn } from '../middleware/authMiddleware.js';
const router = express.Router();


router.get('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.get('/current-user',requireSignIn,currentUser);

//Update 
router.put('/update-password',requireSignIn,updatePassword);
router.put('/update-username',requireSignIn,updateUsername);

router.put('/update-profile/', requireSignIn, updateProfile);

export default router;
