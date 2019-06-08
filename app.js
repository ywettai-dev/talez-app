require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const _ = require("lodash");
const app = express();
const port = 3000;

//setup express connection
app.listen(process.env.PORT || port, () =>
  console.log(`talez app starts on ${port}`)
);

//setup view engine
app.set("view engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

//setup express public static
app.use(express.static("public/"));

//initalize session
app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
  })
);

//initalize passport
app.use(passport.initialize());
app.use(passport.session());

//setup database connection
mongoose.connect("mongodb://localhost:27017/talezDB", {
  useNewUrlParser: true
});

mongoose.set("useFindAndModify", false);

mongoose.set("useCreateIndex", true);

//setup user schema and user model
const userSchema = new Schema({
  username: String,
  password: String
});

userSchema.plugin(passportLocalMongoose); //passport local mongoose plugin

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//home
app.get("/", (req, res) => {
  res.render("home");
});

//secrets
app.get("/secrets", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

//register
app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  User.register(
    { username: req.body.username },
    req.body.password,
    (err, user) => {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, () => {
          res.redirect("/secrets");
        });
      }
    }
  );
});

//login
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, err => {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/secrets");
      });
    }
  });
});

//logout
app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});
