//jshint esversion:6
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
const app = express();
const port = 3000;

//setup express connection
app.listen(process.env.PORT || port, () => console.log(`talez app starts on ${port}`));

//setup view engine
app.use('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));

//setup express public static
app.use(express.static('public'));

//setup database connection
mongoose.connect("mongodb://localhost:27017/talezDB", {
    useNewUrlParser: true
});

mongoose.set('useFindAndModify', false);