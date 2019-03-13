const express = require('express');
const mongoose = require('mongoose');
const logger = require('morgan');
const passport = require('passport');
const mongoURI = require('./config/keys').mongoURI;

const users = require('./routes/api/users');
const profile = require('./routes/api/profile');
const posts = require('./routes/api/posts');

const app = express();
mongoose.connect(mongoURI, {useNewUrlParser: true})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.log(err));

app.use(logger('dev'));

app.use(express.json());
app.use(express.urlencoded({extended: false}));

// Passport Middleware
app.use(passport.initialize());

// Passport Config
require('./config/passport')(passport);

// Routes
app.use('/api/users', users);
app.use('/api/profile', profile);
app.use('/api/posts', posts);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Devconnector listening on port ${port}`);
})
