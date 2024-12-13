require("dotenv").config();
const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const path = require("path");
const userModel = require("./models/user.model");
const postModel = require("./models/post.model");
const multer = require("./utils/multer.config");
const isLoggedIn = require("./middleware/isloggedIn.middleware")

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));    

app.get("/", async (req, res) => {
  const post = await postModel.find().populate("user");
  res.render("feed", { post });
});

app.get("/register", (req, res) => {
  res.render("index");
});

app.get("/profile", isLoggedIn, async (req, res) => {
  let user = await userModel
    .findOne({$or: [{ email: req.user.email }, { username: req.user.username }]})
    .populate("post");
  res.render("profile", { user: user });
});

app.get("/feed", async (req, res) => {
  const post = await postModel.find().populate("user");
  if (req.cookies.token) {
    res.redirect("/feed/loggedin");
  } else {
    res.cookie("token", "hello how are you")
    res.render("feed", { post });
  }
});

app.get("/feed/loggedin",isLoggedIn, async (req, res) => {
  const post = await postModel.find().populate("user");
  res.render("feedlog", { post });
});

app.get("/profile/upload", isLoggedIn, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  res.render("upload", { user });
});

app.post("/dp", isLoggedIn, multer.single("image"), async (req, res) => {
  let user = await userModel.findOneAndUpdate(
    { email: req.user.email },
    { dp: req.file.filename }
  );
  res.redirect("/profile/upload");
});

app.post("/login", async (req, res) => {
  const { identifier, password } = req.body;
  let user = await userModel.findOne({$or: [{ email: req.body.identifier }, { username: req.body.identifier }]});
  if (!user) return res.status(500).send("User not found");
  bcrypt.compare(password, user.password, (err, result) => {
    if (!result) {
      res.redirect("/login");
    } else {
      let token = jwt.sign({ email: user.email, username: user.username, userid: user._id },"slsldlkff");
      res.cookie("token", token);
      res.redirect("/profile");
    }
  });
});

app.post("/post", isLoggedIn, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  let post = await postModel.create({
    user: user._id,
    content: req.body.content,
  });
  user.post.push(post._id);
  await user.save();
  res.redirect("/profile");
});

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
      res.redirect("/profile");
    });
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/logout", isLoggedIn, (req, res) => {
  res.clearCookie("token");
  res.redirect("/feed");
});

app.get("/delete/:postId", isLoggedIn, async (req, res) => {
  let post = await postModel.findOneAndDelete({ _id: req.params.postId });
  res.redirect("/profile");
});

app.get("/like/:id", isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");
  if (post.likes.indexOf(req.user.userid) === -1) {
    post.likes.push(req.user.userid);
  } else {
    post.likes.splice(post.likes.indexOf(req.user.userid), 1);
  }
  await post.save();
  res.redirect("/feed/loggedin");
});

app.get("/edit/:postId", isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.postId });
  res.render("edit", { post });
});

app.post("/edit/:postId", isLoggedIn, async (req, res) => {
  let post = await postModel.findOneAndUpdate(
    { _id: req.params.postId },
    { content: req.body.content }
  );
  res.redirect("/profile");
});

app.listen(process.env.PORT, () => {
  console.log(`Your server is running on http://127.0.0.1:${process.env.PORT}`);
});
