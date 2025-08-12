// controller/adController.js
import { nanoid } from 'nanoid';
import { uploadImageToCloudinary , deleteImageFromCloudinary} from '../helpers/cloudinary.js';
import { geoCodeAddress } from '../helpers/geocoder.js';
import { OtpService } from '../helpers/email.js';
import slugify from 'slugify';
import Ad from '../models/ad.js';
import User from '../models/User.js';
import { incrementViewCount } from '../helpers/ad.js';

export const uploadImage = async (req, res) => {
  try {
    const userId = req.user._id;
    const files = req.files;

    console.log('req.user:', req.user);
    console.log('Files received:', files);

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No image files uploaded' });
    }

    const uploadedImages = await uploadImageToCloudinary(files, userId);
    res.json({ success: true, images: uploadedImages });
  } catch (err) {
    console.error('Upload Error:', err.message, err.stack);
    res.status(500).json({success: false, error: 'Image upload failed', details: err.message });
  }
};

export const removeImage = async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({ error: 'Public ID is required' });
    }

    try {
      const userId = req.user._id;
      console.log('User ID:', userId);
      console.log('Public ID:', publicId);
      const result = await deleteImageFromCloudinary(publicId);
      res.json({ success: true, message: 'Image deleted successfully', result });
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return res.status(500).json({ error: 'Failed to delete image from Cloudinary' });
    }
   
  } catch (err) {
    console.error('Delete Error:', err.message, err.stack);
    res.status(500).json({success: false, error: 'Image deletion failed', details: err.message });
  }

} 

export const createAd = async (req, res) => {
  try {
    const {address,photos,description,propertyType,price,landsize,landsizeType,action,bedrooms,bathrooms,carpark,title,features,nearBy,published,_action,views,status} = req.body;
    if (!address || !address.trim()) {
      return res.status(400).json({ success: false, message: 'Address is required' });
    }

    if(!address || !address.trim()) {
      return isRequired('Address',res);
    } else if(!photos || photos.length === 0) {
      return isRequired('Photos',res);
    } else if(!description || !description.trim()) {
      return isRequired('Description',res);
    } else if(!propertyType || !propertyType.trim()) {
      return isRequired('Property Type',res);
    } else if(!price || !price.trim()) {
      return isRequired('Price',res);
    } else if(!action || !action.trim()) {
      return isRequired('Action',res);
    } else if(!bedrooms || isNaN(bedrooms)) {
      return isRequired('Bedrooms',res);
    } else if(!bathrooms || isNaN(bathrooms)) {
      return isRequired('Bathrooms',res);
    } else if(!carpark || isNaN(carpark)) {
      return isRequired('Carpark',res);
    } else if(!title || !title.trim()) {
      return isRequired('Title',res);
    } else if(!features || Object.keys(features).length === 0) {
      return isRequired('Features',res);
    } else if(!nearBy || Object.keys(nearBy).length === 0) {
      return isRequired('Nearby',res);
    } else if(!published || typeof published !== 'boolean') {
      return isRequired('Published',res);
    } else if(!views || isNaN(views)) {
      return isRequired('Views',res);
    } else if(!status || !status.trim()) {
      return isRequired('Status',res);
    } 

    
    if(propertyType==="Land") {
      if(!landsize || !landsize.trim()) {
        return isRequired('Land Size');
      } else if(!landsizeType || !landsizeType.trim()) {
        return isRequired('Land Size Type');
      }
    }


    const { location, googleMap } = await geoCodeAddress(address.trim());

    try {
      const ad = new Ad({
        address: address.trim(),
        photos: photos,
        description: description.trim(),
        propertyType: propertyType.trim(),
        price: price.trim(),
        landSize: propertyType === 'Land' ? parseFloat(landsize) : undefined,
        landSizeType: propertyType === 'Land' ? landsizeType.trim() : undefined,
        action: action.trim(),
        bedrooms: parseInt(bedrooms, 10),
        bathrooms: parseInt(bathrooms, 10),
        carpark: parseInt(carpark, 10),
        title: title.trim(),
        slug: slugify(`${propertyType}-for-${action}-address-${address}-at Price-${price}-${nanoid(6)}-${Date.now()}`),

        features: features,
        nearby: nearBy,
        postedBy: req.user._id,
        published: published,
        views: parseInt(views, 10),
        status: status.trim(),
        location: {
          type: 'Point',
          coordinates: [
            location.coordinates[0],
            location.coordinates[1]
          ],
        },
        googleMap: googleMap,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await ad.save();

      console.log('Ad created successfully:', ad);
      const user = await User.findByIdAndUpdate(req.user._id, {
        $addToSet: {role : 'Seller', ads: ad._id }
      });
      user.password = undefined; // Exclude password from response
      return res.status(201).json({ success: true, message: 'Ad created successfully', ad , user });

    } catch (error) {
      console.error('Error creating ad:', error);
      return res.status(500).json({ success: false, message: 'Failed to create ad', error: error.message });
    }
  } catch (error) {
    console.error('Create Ad Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create ad', error: error.message });
  }
}

const isRequired = (v, res) => {
    return res.status(401).json({ success: false, message: `${v} is required` });
};

export const readAd = async (req, res) => {
  try{
    const { slug } = req.params;
    if (!slug || slug.trim() === '') {
      return res.status(400).json({ success: false, message: 'Slug is required' });
    }
    const ad = await Ad.findOne({ slug: slug.trim() }).select('-googleMap').populate('postedBy', 'name username email role phone company logo').exec();

    if (!ad) {
      return res.status(404).json({ success: false, message: 'Ad not found' });
    }

    //related ads
    const related = await Ad.aggregate([
      {
        $geoNear : {
          near : {
            type: 'Point',
            coordinates: ad.location.coordinates
          },
          distanceField: 'distance',
          maxDistance: 100000, // 100 km
          spherical: true,
        }
      }, 
      {
        $match: {
          _id: { $ne: ad._id }, // Exclude the current ad
          action: ad.action,
          propertyType: ad.propertyType,
          published: true
        }
      },
      {
        $limit: 5 // Limit to 5 related ads
      },
      {
        $project: {
          googleMap: 0, // Exclude googleMap field
        }
      }
    ]);

    incrementViewCount(ad._id);

    await ad.save(); // Save the updated ad

    const realatedWithPopulatedPostedBy = await Ad.populate(related, {
      path: 'postedBy',
      select: 'name username email role phone company logo'
    });

    res.status(200).json({ success: true,message: "Related Ad found successfully", ad, related: realatedWithPopulatedPostedBy });
  } catch(error) {
    console.error('Read Ad Error:', error);
    res.status(500).json({ success: false, message: 'Failed to Fetch ad', error: error.message });
  }
}


export const readAdSell = async (req, res) => {
  try {
    const page = req.params.page || 1;
    const pageSize = 2;
    const skip = (page - 1) * pageSize;
    const totalAds = await Ad.countDocuments({ action: 'Sale', published: true });
    const totalPages = Math.ceil(totalAds / pageSize);
    console.log(`Fetching ads for sale - Page: ${page}, Page Size: ${pageSize}, Total Ads: ${totalAds}, Total Pages: ${totalPages}`);

    if (page < 1 || page > totalPages) {
      return res.status(400).json({ success: false, message: 'Invalid page number' });
    }

    const ads = await Ad.find({ action: 'Sale', published: true }).populate('postedBy', 'name username email role phone company logo')
    .sort({ createdAt: -1 }) // Sort by creation date, newest first
    .skip(skip)
    .limit(pageSize)
    .select('-googleMap') // Exclude googleMap field
    .exec();

    if (!ads || ads.length === 0) {
      return res.status(404).json({ success: false, message: 'No ads found for sale' });
    }

    for (const ad of ads) {
      incrementViewCount(ad._id);
    }

    ads.save();

    res.status(200).json({
      success: true,
      message: 'Ads for sale fetched successfully',
      ads,
      totalAds,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    console.error('Read Ad Sell Error:', error);
    res.status(500).json({ success: false, message: 'Failed to Fetch ad for sale', error: error.message });
  }
}

export const readAdRent = async (req, res) => {
  try {
    const page = req.params.page || 1;
    const pageSize = 2;
    const skip = (page - 1) * pageSize;
    const totalAds = await Ad.countDocuments({ action: 'Rent', published: true });
    const totalPages = Math.ceil(totalAds / pageSize);

    if (page < 1 || page > totalPages) {
      return res.status(400).json({ success: false, message: 'Invalid page number' });
    }

    const ads = await Ad.find({ action: 'Rent', published: true }).populate('postedBy', 'name username email role phone company logo')
    .sort({ createdAt: -1 }) // Sort by creation date, newest first
    .skip(skip)
    .limit(pageSize)
    .select('-googleMap') // Exclude googleMap field
    .exec();

    if (!ads || ads.length === 0) {
      return res.status(404).json({ success: false, message: 'No ads found for sale' });
    }

    for (const ad of ads) {
      incrementViewCount(ad._id);
    }

    ads.save();

    res.status(200).json({
      success: true,
      message: 'Ads for sale fetched successfully',
      ads,
      totalAds,
      totalPages,
      currentPage: page
    });

  } catch (error) {
    console.error('Read Ad Rent Error:', error);
    res.status(500).json({ success: false, message: 'Failed to Fetch ad for rent', error: error.message });
  }
}

export const updateAd = async (req, res) => {
  try {
    const {slug} = req.params;
    if (!slug || slug.trim() === '') {
      return res.status(400).json({ success: false, message: 'Slug is required' });
    }



    const {address,photos,description,propertyType,price,landsize,landsizeType,action,bedrooms,bathrooms,carpark,title,features,nearBy,published,_action,views,status} = req.body;
    if (!address || !address.trim()) {
      return res.status(400).json({ success: false, message: 'Address is required' });
    }

    if(!address || !address.trim()) {
      return isRequired('Address',res);
    } else if(!photos || photos.length === 0) {
      return isRequired('Photos',res);
    } else if(!description || !description.trim()) {
      return isRequired('Description',res);
    } else if(!propertyType || !propertyType.trim()) {
      return isRequired('Property Type',res);
    } else if(!price || !price.trim()) {
      return isRequired('Price',res);
    } else if(!action || !action.trim()) {
      return isRequired('Action',res);
    } else if(!bedrooms || isNaN(bedrooms)) {
      return isRequired('Bedrooms',res);
    } else if(!bathrooms || isNaN(bathrooms)) {
      return isRequired('Bathrooms',res);
    } else if(!carpark || isNaN(carpark)) {
      return isRequired('Carpark',res);
    } else if(!title || !title.trim()) {
      return isRequired('Title',res);
    } else if(!features || Object.keys(features).length === 0) {
      return isRequired('Features',res);
    } else if(!nearBy || Object.keys(nearBy).length === 0) {
      return isRequired('Nearby',res);
    } else if(!published || typeof published !== 'boolean') {
      return isRequired('Published',res);
    } else if(!views || isNaN(views)) {
      return isRequired('Views',res);
    } else if(!status || !status.trim()) {
      return isRequired('Status',res);
    } 

    
    if(propertyType==="Land") {
      if(!landsize || !landsize.trim()) {
        return isRequired('Land Size');
      } else if(!landsizeType || !landsizeType.trim()) {
        return isRequired('Land Size Type');
      }
    }

    //check if the logged in user is the owner of the ad
    const ad = await Ad.findOne({ slug: slug.trim(), postedBy: req.user._id });

    if (!ad) {
      return res.status(404).json({ success: false, message: 'Ad not found or you are not authorized to update this ad' });
    }

    // If the ad is found, proceed with the update


    const { location, googleMap } = await geoCodeAddress(address.trim());

    try {
      const updatedAd = await Ad.findOneAndUpdate({ slug: slug.trim(), postedBy: req.user._id }, {
        address: address.trim(),
        photos: photos,
        description: description.trim(),
        propertyType: propertyType.trim(),
        price: price.trim(),
        landSize: propertyType === 'Land' ? parseFloat(landsize) : undefined,
        landSizeType: propertyType === 'Land' ? landsizeType.trim() : undefined,
        action: action.trim(),
        bedrooms: parseInt(bedrooms, 10),
        bathrooms: parseInt(bathrooms, 10),
        carpark: parseInt(carpark, 10),
        title: title.trim(),
        slug: slugify(`${propertyType}-for-${action}-address-${address}-at Price-${price}-${nanoid(6)}-${Date.now()}`),
        features: features,
        nearby: nearBy,
        published: published,
        views: parseInt(views, 10),
        status: status.trim(),
        location: {
          type: 'Point',
          coordinates: [
            location.coordinates[0],
            location.coordinates[1]
          ],
        },
        googleMap: googleMap,
        updatedAt: new Date(),
      }, { new: true, runValidators: true });
      if (!updatedAd) {
        return res.status(404).json({ success: false, message: 'Ad not found or you are not authorized to update this ad' });
      }

      const user = await User.findByIdAndUpdate(req.user._id, {
        $addToSet: {role : 'Seller', ads: ad._id }
      });

      user.password = undefined; // Exclude password from response
      return res.status(201).json({ success: true, message: 'Ad updated successfully', updatedAd , user });

    } catch (error) {
      console.error('Error creating ad:', error);
      return res.status(500).json({ success: false, message: 'Failed to update ad', error: error.message });
    }

  } catch (error) {
    console.error('Update Ad Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update ad', error: error.message });
  }
}

export const deleteAd = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug || slug.trim() === '') {
      return res.status(400).json({ success: false, message: 'Slug is required' });
    }
    const ad = await Ad.findOne({slug: slug.trim()});

     if (!ad) {
      return res.status(404).json({ success: false, message: 'Ad not found' });
    }

    if (!ad.postedBy=== req.user._id) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this ad' });
    }

   

    await Ad.deleteOne({ _id: ad._id });
    console.log('Ad deleted successfully:', ad);
    res.status(200).json({ success: true, message: 'Ad deleted successfully' });
  } catch (error) {
    console.error('Delete Ad Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete ad', error: error.message });
  }
};

export const userAds = async (req, res) => {
  try {
    const page = req.params.page || 1;
    const pageSize = 2;
    const skip = (page - 1) * pageSize;
    const totalAds = await Ad.countDocuments({ postedBy: req.user._id });
    const totalPages = Math.ceil(totalAds / pageSize);

    if (page < 1 || page > totalPages) {
      return res.status(400).json({ success: false, message: 'Invalid page number' });
    }

    const ads = await Ad.find({ postedBy: req.user._id })
      .populate('postedBy', 'name username email role phone company logo')
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .skip(skip)
      .limit(pageSize)
      .select('-googleMap') // Exclude googleMap field
      .exec();
    if (!ads || ads.length === 0) {
      return res.status(404).json({ success: false, message: 'No ads found for this user' });
    }
    res.status(200).json({
      success: true,
      message: 'User ads fetched successfully',
      ads,
      totalAds,
      totalPages,
      currentPage: page
    });


  } catch (error) {
    console.error('User Ads Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user ads', error: error.message });
  }
}

export const updateAdStatus = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug || slug.trim() === '') {
      return res.status(400).json({ success: false, message: 'Slug is required' });
    }
    const { status } = req.body;
    if (!status || !status.trim()) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }
    const ad = await Ad.findOne({ slug: slug.trim()});

    if (!ad) {
      return res.status(404).json({ success: false, message: 'Ad not found' });
    }
    else if (ad.postedBy._id.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'You are not authorized to update this ad' });
    }

    else {
      ad.status = status.trim();
      ad.updatedAt = new Date();
      await ad.save();

      
      res.status(200).json({ success: true, message: 'Ad status updated successfully', ad });
    }

    
  } catch (error) {
    console.error('Update Ad Status Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update ad status', error: error.message });
  }
};

export const contactAgent = async (req, res) => {
  try {
    const { adId, message } = req.body;
    if (!adId || !message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Ad ID and message are required' });
    }
    const ad = await Ad.findById(adId).populate('postedBy').exec();

    if (!ad) {
      return res.status(404).json({ success: false, message: 'Ad not found' });
    }

    if (ad.postedBy._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot contact yourself' });
    }

    const user = await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { enquiredProperties : ad._id }
    });

    console.log(ad.postedBy.email, user.email, message);

  

    const emailResult = await OtpService.sendContactAgentEmail(ad.postedBy.email, user.email, message, ad, user);

    if (!emailResult.success) {
      return res.status(500).json({ success: false, message: emailResult.message});
    }

    res.status(200).json({ success: true, message: 'Contact message sent to agent successfully',  "link" : emailResult.link});

    //send contact message  to agent with user email name and phone message and ad link
  } catch (error) {
    console.error('Contact Agent Error:', error);
    res.status(500).json({ success: false, message: 'Failed to contact agent', error: error.message });
  }   
};

export const getEnquiredAds = async (req,res) => {
  try {

    const page = req.params.page ? parseInt(req.params.page) : 1;
    const pageSize = 2;
    
    const skip = (page-1) * pageSize;
    const user = await User.findById(req.user._id);

    const totalAds = await Ad.countDocuments({ 
      _id :{$in : user.enquiredProperties}
    });
    const totalPages = Math.ceil(totalAds / pageSize);


    const ads = await Ad.find({_id: {$in : user.enquiredProperties}})
    .populate('postedBy', 'name username email role phone company logo')
    .sort({ createdAt: -1 }) // Sort by creation date, newest first
    .skip(skip)
    .limit(pageSize)
    .select('-googleMap') // Exclude googleMap field
    .exec();

     if (!ads || ads.length === 0) {
      return res.status(404).json({ success: false, message: 'No ads found for this user' });
    }
    res.status(200).json({
      success: true,
      message: 'Enquired ads fetched successfully',
      ads,
      totalAds,
      totalPages,
      currentPage: page
    });


  } catch(error) { 
    console.log("Error getting Enquired Properties : " + error.message );
    return res.status(500).json({success:false, message : 'Failed to get Enquired Properties : '+ error.message});
  }
}

export const toggleWishlist = async (req,res) => {
  try {
    const adId = req.params.adId;

    if(!adId) {
      return res.status(400).json({success:false,message:"Ad not Provided"});
    }
    const userId = req.user._id;

    //find the user

    const user = await User.findById(userId);

    if(!user) {
      return res.status(401).json({success : false, message : 'User not Found'});
    }

    //check if the adId is in the user's wishlist
    const isInWishlist = user.wishlist.includes(adId);

    const update = isInWishlist 
    ? {$pull : {wishlist : adId}} 
    : {$addToSet : {wishlist : adId} };

    const updatedUser = await User.findByIdAndUpdate(userId,update, {new : true});

    return res.status(200).json({success : true, message : isInWishlist ? "Ad removed from Wishlist" : "Ad added to wishlist",wishlist : updatedUser.wishlist});


  } catch (error) {
    console.log("Error Toggling Wishlist : " + error.message);
    return res.status(500).json({success:false,message: "Failed to Toggle Wishlist : " + error.message});
  }
}

export const wishlist = async (req,res) => {
  try {
    const page = req.params.page ? parseInt(req.params.page) : 1;
    const pageSize = 2;
    
    const skip = (page-1) * pageSize;
    const user = await User.findById(req.user._id);

    const totalAds = await Ad.countDocuments({ 
      _id :{$in : user.wishlist}
    });
    const totalPages = Math.ceil(totalAds / pageSize);


    const ads = await Ad.find({_id: {$in : user.wishlist}})
    .populate('postedBy', 'name username email role phone company logo')
    .sort({ createdAt: -1 }) // Sort by creation date, newest first
    .skip(skip)
    .limit(pageSize)
    .select('-googleMap') // Exclude googleMap field
    .exec();

    res.status(200).json({
      success: true,
      message: 'Wishlisted ads fetched successfully',
      ads,
      totalAds,
      totalPages,
      currentPage: page
    });


  } catch (error) {
    console.log("Error Fetching Wishlist : " + error.message);
    return res.status(500).json({success : false, message : 'Failed to fetch Wishlist : ' + error.message});
  }
}

export const searchAds = async (req,res) => {
  try {
    const {address,price,page=1,action,propertyType,bedrooms,bathrooms} = req.body;
    const pageSize = 2;


    if (!address) {
      return res.status(400).json({success : false, message : 'Address is Required'});
    }  

    //geocode the address to get coordinates
    let geo = await geoCodeAddress(address);

    //function to check if value is numeric
    const isNumeric = (value) => {
      return !isNaN(value) && !isNaN(parseFloat(value));
    } 

    let query = {
        location: {$geoWithin : {
          $centerSphere : [
            [geo.location.coordinates[0], 
            geo.location.coordinates[1]], 
            10/6378.16
          ], //10km radius , converted to radius
        },
      },
    };

    if(action) {
      query.action = action;
    }

    if(propertyType && propertyType!=="All") {
      query.propertyType = propertyType;
    }

    if(bedrooms && bedrooms!=="All") {
      query.bedrooms = bedrooms;
    }

    if(bathrooms && bathrooms!=="All") {
      query.bathrooms = bathrooms;
    }

    if(isNumeric(price)) {
      const numericPrice = parseFloat(price);
      const minPrice = numericPrice * 0.8;
      const maxPrice = numericPrice * 1.2;
      query.price = { 
        $gte: minPrice,
        $lte: maxPrice
      };
    }


    const ads = await Ad.find(query)
      .limit(pageSize)
      .skip((page-1) * pageSize)
      .sort({createdAt : -1 })
      .select("-googleMap")
    ;

    if (!ads || ads.length === 0) {
      return res.status(404).json({ success: false, message: 'No ads found matching your search' });
    }
    
    //count totalAds for pagination
    const totalAds = await Ad.countDocuments(query);
    const totalPages = Math.ceil(totalAds / pageSize);

    res.status(200).json({
      success: true,
      message: 'Ads fetched successfully',
      ads,
      totalAds,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    console.log("Error Searching Ads : " + error.message);
    return res.status(500).json({success : false, message : 'Failed to Search Ads : ' + error.message});
  }
}

export const togglePublished = async (req, res) => {
  try {
    const { adId } = req.params;
    if (!adId) {
      return res.status(400).json({ success: false, message: "Ad ID is required" });
    }

    const ad = await Ad.findById(adId);
    if (!ad) {
      return res.status(404).json({ success: false, message: "Ad not found" });
    }

    const newStatus = !ad.published;

    const updatedAd = await Ad.findByIdAndUpdate(
      adId,
      { published: newStatus },
      { new: true } // return the updated document
    ).select("-googleMap"); // remove googleMap field

    return res.status(200).json({
      success: true,
      message: newStatus ? "Ad Published" : "Ad Unpublished",
      ad: updatedAd
    });

  } catch (error) {
    console.error("Error toggling published status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle published status",
      error: error.message
    });
  }
};
