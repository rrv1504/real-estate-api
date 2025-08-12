import express from 'express';
import multer from 'multer';
import { uploadImage,removeImage,createAd, readAd, readAdSell, readAdRent, updateAd,deleteAd, userAds, updateAdStatus, contactAgent, getEnquiredAds, toggleWishlist,wishlist, searchAds,togglePublished } from '../controller/adController.js';
import { isAdmin, requireSignIn } from '../middleware/authMiddleware.js';
// import { storageCloudinary } from '../helpers/cloudinary.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload-image', requireSignIn, upload.array('images'), uploadImage);
router.delete('/remove-image', requireSignIn, removeImage);

router.post('/create-ad',requireSignIn,createAd);
router.get('/get-ad/:slug', requireSignIn, readAd);
router.get('/get-ad-sale/:page',requireSignIn,readAdSell);
router.get('/get-ad-rent/:page',requireSignIn,readAdRent);
router.put('/update-ad/:slug',requireSignIn,updateAd);
router.delete('/delete-ad/:slug', requireSignIn, deleteAd); 

router.get('/user-ads/:page',requireSignIn,userAds);
router.put('/update-ad-status/:slug', requireSignIn, updateAdStatus);

router.post('/contact-agent', requireSignIn, contactAgent);
router.get('/enquired-ads/:page', requireSignIn,getEnquiredAds);

router.put('/toggle-wishlist/:adId', requireSignIn,toggleWishlist)
router.get('/wishlist/:page',requireSignIn,wishlist);

router.post('/search-ads',searchAds);
//admin route
router.put('/toggle-published/:adId',requireSignIn,isAdmin,togglePublished);

export default router;
 