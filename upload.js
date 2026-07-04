require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Proses upload khusus sebagai tipe 'raw'
cloudinary.uploader.upload("blau.cube", {
    resource_type: "raw",
    public_id: "blau", // Biar namanya tetap rapi
    use_filename: true,
    unique_filename: false
})
    .then(result => {
        console.log("🎉 BERHASIL UPLOAD!");
        console.log("URL File kamu:", result.secure_url);
    })
    .catch(error => {
        console.log("❌ GAGAL:", error);
    });