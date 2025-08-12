import nodemailer from "nodemailer";
import * as dotenv from "dotenv";

dotenv.config();

// Nodemailer setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // True for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export class OtpService {
  

  // Send OTP via Email
  static async sendEmailOtp(email, otp) {
    try {
      const mailOptions = {
        from: `"RealEstate App" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
      };

      await transporter.sendMail(mailOptions);

      console.log(`OTP sent via Email to ${email}`);
      return { success: true, message: "OTP sent via Email" };
    } catch (error) {
      console.error("Email OTP Error:", error);
      return { success: false, message: "Failed to send OTP via Email" };
    }
  }

  static async sendWelcomeEmail(email, name) {
    try {
      const mailOptions = {
        from: `"RealEstate App" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Welcome to RealEstate App",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2c3e50;">Welcome to RealEstate App!</h2>
          <p>Dear user,</p>
          <p>Thank you for registering with <strong>RealEstate App</strong>.</p>
            <p>We are thrilled to have you on board. Here are your account details:</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Name:</strong> ${name}</p>
            
          <p>If you did not request this code, please ignore this email.</p>
          <br/>
          <p>Best regards,</p>
          <p><strong>RealEstate App Team</strong></p>
        </div>
      `,
        text: `Hello ${name},\n\nWelcome to RealEstate App! We are excited to have you on board.\n\nBest regards,\nRealEstate Team`,
      };

      await transporter.sendMail(mailOptions);

      console.log(`Welcome email sent to ${email}`);
      return { success: true, message: "Welcome email sent" };
    } catch (error) {
      console.error("Welcome Email Error:", error);
      return { success: false, message: "Failed to send welcome email" };
    }
  }

  static async sendPasswordResetEmail(email,  newPassword) {
    try {
      const mailOptions = {
        from: `"RealEstate App" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Password Reset Request",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #2c3e50;">Password Reset Request</h2>
            <p>Dear user,</p>
            <p>You have requested to reset your password. Your Temporory new password is:</p>
            <h3 style="color: #e74c3c;">${newPassword}</h3>
            <p>Please log in with this new password and change it as soon as possible.</p>
            <p>If you did not request this change, please contact our support team immediately.</p>
            <br/>
            <p>Best regards,</p>
            <p><strong>RealEstate App Team</strong></p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      console.log(`Password reset email sent to ${email}`);
      return { success: true, message: "Password reset email sent" };
    } catch (error) {
      console.error("Password Reset Email Error:", error);
      return { success: false, message: "Failed to send password reset email" };
    }
  }

  static async sendContactAgentEmail(agentEmail,userEmail,message,ad,user) {
    console.log("From Email : ",ad.postedBy.email, user.email, message);

    try {
      const mailOptions = {
        from: `"RealEstate App" <${process.env.SMTP_USER}>`,
        to: ad.postedBy.email, // Agent's email
        subject: `Contact Request for ${ad.title}`,

        //reply to user.email,
        replyTo: user.email,

        
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #2c3e50;">Contact Request for ${ad.title}</h2>
            <p>Dear ${ad.postedBy.name},</p>
            <p>You have received a new contact request for your ad titled "${ad.title}".</p>
            <p><strong>Message:</strong> ${message}</p>
            <p><strong>From:</strong> ${user.name} (${user.email})</p>
            <p><strong>Phone:</strong> ${user.phone}</p>
            <p>To view the ad, click <a href="http://localhost:8000/api/get-ad/${ad.slug}">here</a>.</p>
            <br/>
            <p>Best regards,</p>
            <p><strong>RealEstate App Team</strong></p>
          </div>
        `,
        
      };
      await transporter.sendMail(mailOptions);

      console.log(`Contact agent email sent for ad ${ad.title} to ${agentEmail}`);
      return { success: true, message: "Contact agent email sent" , link: `http://localhost:8000/api/get-ad/${ad.slug}` };
    } catch (error) {
      console.error("Contact Agent Email Error:", error);
      return { success: false, message: "Failed to send contact agent email" };
    }

  }
}