import { config } from "dotenv";
config({quiet: true});
import mongoose from "mongoose";

mongoose.connect(process.env.MONGODB_URI)
    .then(()=>{
        console.log("DB connected")
    })
    .catch((err)=>{
        console.log(err)
    })