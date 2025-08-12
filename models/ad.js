import mongoose from "mongoose";
const { Schema, Types } = mongoose;

const adSchema = new Schema({
    photos : [{}],
    price : {
        type : String,
        maxLength : 100,
        index: true

    },
    address: {
        type : String,
        maxLength : 100,
        index: true   
    },
    propertyType : {
        type : String,
        default : 'House',
        enum : ['House', 'Apartment', 'Land', 'Townhouse']
    },
    bedrooms : Number,
    bathrooms : Number,
    landSize : Number,
    landSizeType : String,
    carpark : Number,
    location : {
        type: {
            type : String,
            enum : ["Point"],
            default : "Point",
        },
        coordinates: {
            type: [Number],
            default: [78.6677428, 22.3511148]
        },
    },
    googleMap: {},
    title : {
        type : String,
        maxLength : 100
    },
    slug : {
        type : String,
        unique : true,
        index: true,
        lowercase: true
    },
    description : {
        type : String,
        maxLength : 5000
    },
    features : {},
    nearby : {},
    postedBy : {
        type :Types.ObjectId,
        ref: 'User',
        required: true
    },
    published : {
        type: Boolean,
        default: true
    },
    action : {
        type: String,
        enum: ['Sale', 'Rent'],
        default: 'Sale'
    },
    views : {
        type: Number,
        default: 0
    },
    status : {
        type: String,
        enum: ['In Market',
            'Deposit Taken', 
            'Under Offer', 
            'Sold', 
            'Contact agent', 
            'Rented', 
            'Off Market'
        ],
        default: 'In Market',
        inspectionTime : String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }

});

adSchema.index({ location: '2dsphere' });
export const Ad = mongoose.model('Ad', adSchema);
export default Ad; 