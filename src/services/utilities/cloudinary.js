// import { v2 as cloudinary } from "cloudinary";

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,   // add these in .env
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// export const uploadToCloudinary = async (file) => {
//   try {
//     // file.buffer comes from multer memory storage
//     return new Promise((resolve, reject) => {
//       cloudinary.uploader
//         .upload_stream({ resource_type: "auto" }, (error, result) => {
//           if (error) return reject(error);
//           resolve(result.secure_url);
//         })
//         .end(file.buffer);
//     });
//   } catch (err) {
//     throw new Error("Cloudinary upload failed: " + err.message);
//   }
// };



// import { v2 as cloudinary } from "cloudinary";

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// export const uploadToCloudinary = async (file, userId, propertyId) => {
//   try {
//     const folderPath = `docx/${userId}/${propertyId}`;

//     return new Promise((resolve, reject) => {
//       cloudinary.uploader
//         .upload_stream(
//           {
//             resource_type: "image",   // 👈 only images allowed
//             folder: folderPath,
//             allowed_formats: ["jpg", "png", "jpeg", "webp"], // restrict formats
//             use_filename: true, // keep original file name
//             unique_filename: false, // don’t add random string
//           },
//           (error, result) => {
//             if (error) return reject(error);
//             resolve(result.secure_url);
//           }
//         )
//         .end(file.buffer);
//     });
//   } catch (err) {
//     throw new Error("Cloudinary upload failed: " + err.message);
//   }
// };



import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (file, userId, propertyId) => {
  try {
    const folderPath = `docx/${userId}/${propertyId}`;

    // 🔹 Step 1: compress using sharp
    let compressedBuffer = await sharp(file.buffer)
      .jpeg({ quality: 80 }) // start with decent quality
      .toBuffer();

    // 🔹 Step 2: check size, further compress if > 2MB
    let sizeInMB = compressedBuffer.length / (1024 * 1024);

    if (sizeInMB > 2) {
      // compress more aggressively
      compressedBuffer = await sharp(compressedBuffer)
        .jpeg({ quality: 60 }) // lower quality
        .toBuffer();
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          folder: folderPath,
          allowed_formats: ["jpg", "png", "jpeg", "webp"],
          use_filename: false,
          unique_filename: true,
          overwrite: false,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );

      uploadStream.end(compressedBuffer);
    });
  } catch (err) {
    throw new Error("Cloudinary upload failed: " + err.message);
  }
};
