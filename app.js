require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require("mongoose-findorcreate");
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
  password: String,
  googleId: String,
  facebookId: String
});

userSchema.plugin(passportLocalMongoose); //passport local mongoose plugin
userSchema.plugin(findOrCreate); //findorcreate plugin

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

//GoogleStrategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/talez",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
  passReqToCallback: true
}, (request, accessToekn, refreshToken, profile, done) => {
  User.findOrCreate({
    googleId: profile.id
  }, (err, user) => {
    return done(err, user);
  });
}));

//FacebookStrategy
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: "http://localhost:3000/auth/facebook/talez"
}, (accessToekn, refreshToken, profile, cb) => {
  User.findOrCreate({
    facebookId: profile.id
  }, (err, user) => {
    return cb(err, user);
  });
}));

//home
app.get("/", (req, res) => {
  res.render("home");
});

//google auth
app.get("/auth/google",
  passport.authenticate("google", {
    scope: ["profile"]
  }));

app.get("/auth/google/talez",
  passport.authenticate("google", {
    failureRedirect: "/login"
  }), (req, res) => {
    res.redirect("/secrets");
  }
);

//facebook auth
app.get("/auth/facebook",
  passport.authenticate("facebook"));

app.get("/auth/facebook/talez",
  passport.authenticate("facebook", {
    failureRedirect: "/login"
  }), (req, res) => {
    res.redirect("/secrets");
  }
);

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
  User.register({
      username: req.body.username
    },
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