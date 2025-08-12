import Ad from "../models/ad.js";

export const incrementViewCount = async (adId) => {
  try {
    const ad = await Ad.findByIdAndUpdate(adId, { $inc : {views : 1}});
  } catch(error) {
    console.log("Error in Incrementing View Count : " + error.message);
    return resizeBy.status(500).json({success : false, message : "Error in Incrementing Views : " + error.message});
  }
}
