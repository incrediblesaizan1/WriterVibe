require('dotenv').config()
const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const path = require("path");
const userModel = require("./models/user.model");
const postModel = require("./models/post.model");
const multer = require("./utils/multer.config")

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));





function isLoggedIn(req, res, next){
  if(!req.cookies.token) return res.end("You must be Logged In")
   let data =  jwt.verify(req.cookies.token, "slsldlkff")
  req.user = data
    next()
}

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/profile", isLoggedIn, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email }).populate("post"); 
  res.render("profile", { user: user });
});

app.get("/profile/upload",isLoggedIn, async(req, res)=>{
  let user = await userModel.findOne({ email: req.user.email })
  res.render("upload",{user})
})

app.post("/dp", isLoggedIn, multer.single("image"), async(req, res)=>{
  let user = await userModel.findOneAndUpdate({ email: req.user.email },{dp: req.file.filename})
  res.redirect("/profile/upload")
})


app.post("/login",async (req, res)=>{
  const {email, password} = req.body
  let user = await userModel.findOne({email: req.body.email});
  if (!user) return res.status(500).send("User not found");
  bcrypt.compare(password, user.password,(err, result)=>{
    if(!result){
      res.redirect("/login")
    }else{
      let token = jwt.sign({ email: email, username: user.username ,userid: user._id }, "slsldlkff");
      res.cookie("token", token);
      res.redirect("/profile")
    }
  })
})

app.post("/post",isLoggedIn,async (req, res)=>{
  let user = await userModel.findOne({email: req.user.email});
let post = await postModel.create({
  user: user._id,
  content: req.body.content
})
user.post.push(post._id);
await user.save();
res.redirect("/profile")
})


app.post("/register", async (req, res) => {
  let { username, name, email, password, age } = req.body;
  let user = await userModel.findOne({ email });
  if (user) return res.status(500).send("User already registered");

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      const user = await userModel.create({
        username,
        name,
        email,
        age,
        password: hash,
      });
      let token = jwt.sign({ email: email, userid: user._id }, "slsldlkff");
      res.cookie("token", token);
      res.redirect("/profile")
    });
  });
});


app.get("/login",(req, res)=>{
  res.render("login")
})


app.get("/logout",isLoggedIn, (req, res)=>{
  res.clearCookie("token")
res.redirect("/login")
})


app.get("/delete/:postId",isLoggedIn, async(req, res)=>{
let post = await postModel.findOneAndDelete({_id:req.params.postId })
res.redirect("/profile")
})

app.get("/edit/:postId", isLoggedIn,async(req, res)=>{
  let post = await postModel.findOne({_id: req.params.postId}) 
res.render("edit",{post})
  })

app.post("/edit/:postId", isLoggedIn, async(req, res)=>{
  let post = await postModel.findOneAndUpdate({_id: req.params.postId},{content: req.body.content}) 
  res.redirect("/profile")
})



app.listen(process.env.PORT,()=>{
  console.log(`Your server is running on http://127.0.0.1:${process.env.PORT}`)
});