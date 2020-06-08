//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

app.set('view engine','ejs');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:true}));

// initializing session package for whole application
app.use(session({
    secret: "Here is a long secure key",
    resave: false,
    saveUninitialized: false
}));

// initializing the passport package
app.use(passport.initialize());

// set passport to manage the session
app.use(passport.session());

mongoose.connect("mongodb+srv://mayhsundar:test1234@clustor0-9at9v.mongodb.net/userDB",{useUnifiedTopology: true,  useNewUrlParser: true });
mongoose.set("useCreateIndex", true); // for deprecation warning
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: []
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

let User = new mongoose.model("user", userSchema);

// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());
 
// use static serialize and deserialize of model for passport session support
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
        });
  }
));

app.get('/', function(req, res){
    res.render("home");
});

// google authentication
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] }));

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
});  

app.get('/register', function(req, res){
    if(req.isAuthenticated()){
        res.redirect("/secrets");
    }else{
        res.render("register");
    }
});

app.get('/login', function(req, res){
    if(req.isAuthenticated()){
        res.redirect("/secrets");
    }else{
        res.render("login");
    }
});

app.get("/secrets", function(req, res){
    const isLoggedIn = req.isAuthenticated();
    User.find({"secret": {$ne:null}}, function(err, foundUsers){
        if(err){
            console.log(err);
        }else{
            if(foundUsers){
                console.log("mil gye");
                res.render("secrets", {usersWithSecrets: foundUsers, userLoggedIn: isLoggedIn});
            }else{
                console.log("No user is there with any secret");
            }
        }
    });
});

app.get("/submit", function(req, res){
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
});

app.post("/submit", function(req, res){
    const newSecret = req.body.secret;

    User.findById(req.user.id, function(err, foundUser){
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                // using push so that previous also remains there
                foundUser.secret.push(newSecret);
                foundUser.save(function(){
                    res.redirect("/secrets");
                });
            }
        }
    });
});

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
})

app.post("/register", function(req, res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            // all cookies are saved, sessions working now
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
});

app.post("/login", function(req, res){
   const user =  new User({
       username: req.body.username,
       password: req.body.password
   });

   req.login(user, function(err){
       if(err){
           console.log(err);
           res.redirect("/login");
       }else{
           // all cookies are saved, sessions working now
           passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets");
        });
       }
   });
});

const port = process.env.PORT;

app.listen(3000 || port, function(){
console.log('App is runnning at port: 3000');
});