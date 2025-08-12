import { OtpService } from '../helpers/email.js';
import emailValidator from 'email-validator';
import User from '../models/user.js';
import { hashPassword, comparePassword } from '../helpers/authHelper.js';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';

// REGISTER CONTROLLER
export const register = async (req, res) => {
    const { username, name, address, phone, email, password, role,logo,photo } = req.body;

    // Basic validations
    if (!email || !password || !username || !name || !phone) {
        return res.status(400).json({ error: 'All required fields must be provided' });
    }

    if (!emailValidator.validate(email)) {
        return res.status(400).json({ error: 'Valid email is required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    try {
        const existingEmail = await User.findOne({ email });
        if (existingEmail) return res.status(400).json({ error: 'Email already exists' });

        const existingUsername = await User.findOne({ username });
        if (existingUsername) return res.status(400).json({ error: 'Username already taken' });

        const hashedPassword = await hashPassword(password);

        const user = await User.create({
            username : username || nanoid(10),
            name,
            address: address || 'Not provided',
            phone,
            email,
            password: hashedPassword,
            role: role || ['Buyer'],
        });

        if(logo) {
            user.logo = logo;
        }
        if (photo) {
            user.photo = photo;
        }

        user.save();
        await OtpService.sendWelcomeEmail(email, name);

        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRATION || '7d',
        });

        user.password = undefined;

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user,
            token,
        });
    } catch (err) {
        console.error('Registration Error:', err);
        return res.status(500).json({ error: 'Failed to register user' });
    }
};

// LOGIN CONTROLLER
export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email?.trim() || !password?.trim()) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!emailValidator.validate(email)) {
        return res.status(400).json({ error: 'Valid email is required' });
    }

    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({ error: 'No user found with this email' });
        }

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect password' });
        }

        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRATION || '7d',
        });

        user.password = undefined;

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            user,
            token,
        });
    } catch (err) {
        console.error('Login Error:', err);
        return res.status(500).json({ error: 'Login failed. Try again later.' });
    }
};


// FORGOT PASSWORD CONTROLLER
export const forgotPassword = async (req, res) => {
    try {
        const {email} = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'User with this Email not found' });
        } else {
            const password = nanoid(6);
            user.password = await hashPassword(password);
            await user.save();


            //send email with new password
            try {

                OtpService.sendPasswordResetEmail(email,password);
                return res.status(200).json({ success: true, message: 'New Temprory password sent to your email' });
                
            } catch (error) { 
                console.log('Error sending Forgot Password Email:', error);
                return res.status(500).json({ error: 'Failed to send forgot password email' });
            }
        }
    } catch (error) {
        console.log('Forgot Password Error:', error);
        return res.status(500).json({ error: 'Failed to process forgot password request' });
        
    }
}

export const currentUser = async (req,res) => {
    try {
        const user = await User.findById(req.user._id);
        user.password = undefined; // Exclude password from response
        res.status(200).json({
            success: true,
            user: user
        });
    } catch (error) {
        console.error('Current User Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch current user',
        });
    }
}

export const updatePassword = async (req,res) => {
    try {
        let {password} = req.body;
        password=password.trim();

        if(!password?.trim()) {
            return res.status(400).json({success:false,message: "Password is required"});
        } else if(password.length < 6) {
            return res.status(400).json({success:false, message: "Password must be at least 6 characters long"});
        } else {
            const user = await User.findById(req.user._id);
            const hashedPassword = await hashPassword(password);

            await User.findByIdAndUpdate(req.user._id, {password : hashedPassword});

            return res.status(200).json({ success: true, message: "Password updated successfully" });
        }
    } catch(error) {
        console.log("Error Updating Password : " + error);
        res.status(500).json({success:false, message: "Error Updating Password - " + error.message});
    }
}

export const updateUsername = async (req,res) => {
    try {

        let {username} = req.body;

        if(!username || !username.trim()) {
            return res.status(400).json({success:false, message: "Username is Required"});
        } 
        
        const TrimmedUsername = username.trim();
        const existingUser = await User.findOne({ username: TrimmedUsername});

        if(existingUser) {
            return res.status(400).json({success:false , message : "Username already Taken. Try another Username"});
        } else {
            const updatedUser = await User.findByIdAndUpdate(req.user._id,{username: TrimmedUsername},{new :true});
            updatedUser.password= undefined;
            return res.status(200).json({success:true, message: "Username Updated Successfully", User : updatedUser});

        }

        
    } catch (error) {
        console.log("Error Updating Username : " + error);
        return res.status(500).json({success:false,message: "Error Updating Username - " + error.message});
    }
}

export const updateProfile = async (req, res) => {
    try {
        const { name,email,address, phone,company, photo, logo } = req.body;
        if (!name || !address || !phone) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        
        if (company && company.length > 50) {
            return res.status(400).json({ success: false, message: 'Company name must be less than 50 characters' });
        }
        if (photo && !/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/.test(photo)) {
            return res.status(400).json({ success: false, message: 'Invalid photo URL' });
        }
        if (logo && !/^https?:\/\/.+\.(jpg|jpeg|png|gif|sng|svg)$/.test(logo)) {    
            return res.status(400).json({ success: false, message: 'Invalid logo URL' });
        }
        if (email && !emailValidator.validate(email)) { 
            return res.status(400).json({success: false, message : "Invalid Email"});
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update user profile
        if (photo) {user.photo = photo;}
        if (logo) {req.user.logo = logo;}
        if (name){user.name = name.trim();}
        if (address){user.address = address.trim();}
        if (phone){user.phone = phone.trim();}
        if (company){user.company = company.trim();}
        if (email) {
            const existingEmail = await User.findOne({ email: email.trim() });
            if (existingEmail && existingEmail._id.toString() !== user._id.toString()) {
                return res.status(400).json({ success: false, message: 'Email already exists' });
            }
            user.email = email.trim();
        }

        // Save updated user
        await user.save();

        user.password = undefined; // Exclude password from response
        return res.status(200).json({ success: true, message: 'Profile updated successfully', user: user });

    } catch (error) {
        console.error('Update Profile Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
};