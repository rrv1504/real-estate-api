import mongoose from "mongoose";
const { Schema, ObjectId, model } = mongoose;

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        name:{
            type: String,
            required: true,
            unique: true,
            trim: true,
            default: 'Anonymous',
            lowercase: true,
            index: true,
        },
        email : {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        address: {
            type: String,
            trim: true,
            default: 'Not provided',
        },
        phone : {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        password : {
            type: String,
            required: true,
            trim: true,
            min:6,
            max:64,
        },
        role : {
            type : [String],
            default : ["Buyer"],
            enum : ["Buyer", "Seller", "Admin", "Author"],
        },
        photo : {},
        logo : {},
        company: {
            type: String,
            trim: true,
            default: 'Not provided',
        },
        enquiredProperties : [{
            type: ObjectId,
            ref: 'Ad',
        }],
        wishlist : [{
            type: ObjectId,
            ref: 'Ad',
        }],

        about : {
            type: String,
            trim: true,
            default: 'Not provided',
        }
    },
    {timeStamps: true}
);

export default model('User', userSchema);
