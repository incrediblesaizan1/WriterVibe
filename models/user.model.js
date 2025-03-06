const mongoose = require("mongoose")

mongoose
  .connect(
    // `mongodb+srv://incrediblesaizan22:rbUSjTg0Ouw45uZO@write-vibe.j83zr.mongodb.net/?retryWrites=true&w=majority&appName=write-vibe`
    `mongoose.connect("mongodb://127.0.0.1:27017/miniproject")`
  )
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.log("MongoDB connection error:", error);
  });

const userSchema = mongoose.Schema({
    name: String,
    username: String,
    email: String,
    age: Number,
    password: String,
    post:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "post"
        }
    ],
    dp:{
        type:String,
        default: "download.jpg" 
    }
})

module.exports = mongoose.model("user", userSchema)