const mongoose = require("mongoose")
mongoose.connect("mongodb://127.0.0.1:27017/miniproject")

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