//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

app.use(express.static('public'));
app.set('view engine','ejs');

app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb://localhost:27017/userDB",{useUnifiedTopology: true,  useNewUrlParser: true });
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(encrypt, {secret: process.env.secret, encryptedFields: ["password"]});

let User = new mongoose.model("user", userSchema);

app.get('/', function(req, res){
    res.render("home");
});

app.get('/register', function(req, res){
    res.render("register");
});

app.get('/login', function(req, res){
    res.render("login");
});

app.post("/register", function(req, res){
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });
    newUser.save(function(err){
        if(!err){
            res.render("secrets");
        }else{
            res.send(err);
        }
    });
});

app.post("/login", function(req, res){
    const email = req.body.username;
    const password = req.body.password;

    User.findOne({email:email},function(err, foundEmail){
        if(err){
            console.log(err);
        }else{
            if(foundEmail!==null){
                if(foundEmail.password === password){
                    res.render("secrets");
                }else{
                    res.send("Password is not matching..");
                }
            }else{
                res.send("This email is not registered yet..");
            }
        }
    });
});


app.listen(3000, function(){
console.log('App is runnning at port: 3000');
});