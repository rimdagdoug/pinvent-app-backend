const asyncHandler = require("express-async-handler");
const { Error } = require("mongoose");
const Product = require("../models/productModel");
const { fileSizeFormatter } = require("../utils/fileUpload");
const cloudinary = require("cloudinary").v2;

const createProduct = asyncHandler(async(req,res) => {
    const {name,sku,category,quantity,price,description}= req.body;

    //validation
    if (!name|| ! category || ! quantity || ! price || ! description) {
        res.status(400)
        throw new Error("please fill in all fields")
    }
    
    //handle image upload
    let fileDate = {}
    if (req.file) {

         //save image to cloudinary
        let uploadedFile;
        try {
            uploadedFile = await cloudinary.uploader.upload(req.file.path, {folder: "Pinvent App", resource_type: ""})
        } catch (error) {
            res.status(500)
            throw new Error("image could not be uploaded")
            
        }

        fileDate={
            fileName: req.file.originalname,
            filePath: uploadedFile.secure_url,
            fileType: req.file.mimetype,
            fileSize: fileSizeFormatter(req.file.size, 2) ,
        }
    }

    // create product
    const product = await Product.create({
        user: req.user.id,
        name,
        sku,
        category,
        quantity,
        price,
        description,
        image:fileDate,

    });
    res.status(201).json(product)
});

//get all products
const getProducts = asyncHandler(async(req,res)=> {
    const products = await Product.find({user: req.user.id}).sort("-createdAt")
    res.status(200).json(products)
});

//get single product
const getProduct = asyncHandler(async(req,res)=> {
   const product = await Product.findById(req.params.id)
   //if product doesnt exist
   if(!product){
    res.status(404)
    throw new Error("product not found")
   }
   // match product to its user
   if (product.user.toString() !== req.user.id) {
    res.status(401)
    throw new Error("user not authrorized")
   }
   res.status(200).json(product);
});

//delete product
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    // Vérifier si le produit existe
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    // Vérifier si l'utilisateur est autorisé à supprimer ce produit
    if (product.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error("User not authorized to delete this product");
    }

    // Supprimer le produit
    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Product deleted successfully" });
});

//update product
const updateProduct = asyncHandler(async(req,res) => {
    const {name,category,quantity,price,description}= req.body;

    const {id} =req.params

    const product = await Product.findById(id)
    
      // if product doesnt existe
      if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }
     // match product to its user
   if (product.user.toString() !== req.user.id) {
    res.status(401)
    throw new Error("user not authrorized")
   }
   
    
    //handle image upload
    let fileDate = {}
    if (req.file) {

         //save image to cloudinary
        let uploadedFile;
        try {
            uploadedFile = await cloudinary.uploader.upload(req.file.path, {folder: "Pinvent App", resource_type: ""})
        } catch (error) {
            res.status(500)
            throw new Error("image could not be uploaded")
            
        }

        fileDate={
            fileName: req.file.originalname,
            filePath: uploadedFile.secure_url,
            fileType: req.file.mimetype,
            fileSize: fileSizeFormatter(req.file.size, 2) ,
        }
    }

    // update  product
    const updatedProduct = await Product.findByIdAndUpdate(
        {_id: id},
        {
            name,
            category,
            quantity,
            price,
            description,
            image: Object.keys(fileDate).length === 0 ? product?.image: fileDate,
        },
        {
            new: true,
            runValidators: true

        },
        {

        }

        )
    
    res.status(200).json(updatedProduct);
});





module.exports={
    createProduct,
    getProducts,
    getProduct,
    deleteProduct,
    updateProduct,
}