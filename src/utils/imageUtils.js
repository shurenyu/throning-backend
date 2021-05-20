const cloudinary = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.cloudinaryName,
  api_key: process.env.cloudinaryKey,
  api_secret: process.env.cloudinarySecret
});

const uploadEventImage = imageUrl =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload(imageUrl, result => {
      if (result.error) {
        reject(new Error(result.error.message));
      } else {
        resolve(result.secure_url);
      }
    });
  });

const uploadImage = (base64Image, imageType) =>
  new Promise((resolve, reject) => {
    const base64Uri = `data:image/${imageType};base64,${base64Image}`;

    cloudinary.uploader.upload(base64Uri, result => {
      if (result.error) {
        reject(new Error(result.error.message));
      } else {
        resolve(result.secure_url);
      }
    });
  });

module.exports = {
  uploadImage,
  uploadEventImage
};
