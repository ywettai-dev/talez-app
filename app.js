require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');
const saltRounds = 10;
const md5 = require('md5');
const _ = require('lodash');
const app = express();
const port = 3000;

//setup express connection
app.listen(process.env.PORT || port, () => console.log(`talez app starts on ${port}`));

//setup view engine
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));

//setup express public static
app.use(express.static('public/'));

//setup database connection
mongoose.connect("mongodb://localhost:27017/talezDB", {
    useNewUrlParser: true
});

mongoose.set('useFindAndModify', false);

//setup user schema and user model
const userSchema = new Schema({
    username: String,
    password: String
});

const User = mongoose.model("User", userSchema);

//home 
app.get('/', (req, res) => {
    res.render('home');
});

//register
app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {
    bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
        const newUser = new User({
            username: req.body.username,
            password: hash
        });

        newUser.save((err) => {
            if (!err) {
                res.render('secrets');
            } else {
                console.log(err);
            }
        });
    });
});

//login
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({
        username: username
    }, (err, foundUser) => {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                bcrypt.compare(password, foundUser.password, (err, result) => {
                    if (result === true) {
                        res.render('secrets');
                    } else {
                        console.log(err);
                    }
                });
            }
        }
    });
});