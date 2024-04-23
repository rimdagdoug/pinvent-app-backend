const dotenv=require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const connectDB = require("./config/connectDB.js");
const userRoute = require("./routes/userRoute.js");
const productRoute = require("./routes/productRoute.js");
const contactRoute = require("./routes/contactRoute.js");
const errorHandler = require("./middleWare/errorMiddleware.js");
const cookieParser = require("cookie-parser");
const path = require("path");


const app = express();

connectDB();
//Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(
    cors({
      origin: ["http://localhost:3000", "https://pinvent-app.vercel.app"],
      credentials: true,
    })
  );

app.use("/uploads", express.static(path.join(__dirname,"uploads")));

//Route Middlewares
app.use("/api/users", userRoute);
app.use("/api/products", productRoute);
app.use("/api/contactus",contactRoute);
//Routes
 app.get("/", (req,res) => {
     res.send("Home Page");
     
});

//Error Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});




