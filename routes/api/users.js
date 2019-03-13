const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const router = require('express').Router();
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys').secretOrKey;
const passport = require('passport');

// Load Input Validation
const validateRegisterInput = require('../../validation/register');

/**
 * @route   GET api/users/test
 * @desc    Tests users route
 * @access  Public
 */
router.get('/test', (req, res) => res.json({msg: 'Users Works'}));

/**
 * @route   GET api/users/register
 * @desc    Register user
 * @access  Public
 */
router.post('/register', async (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const avatar = gravatar.url(req.body.email, {
    s: '200', //size
    r: 'g', //rating
    d: 'mm' //default
  })
  const newUser = new User({
    name: req.body.name,
    email: req.body.email,
    avatar,
    password: req.body.password
  });

  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      errors.email = 'Email already exists';
      return res.status(400).json({ errors });
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newUser.password, salt);
    newUser.password = hash;
    const savedUser = await newUser.save();
    res.json(savedUser);
  } catch(err) {
    res.send(err);
  }
  
});

/**
 * @route   GET api/users/login
 * @desc    Login User / Returning JWT Token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({email: 'User email not found'});
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const payload = {
        id: user.id,
        name: user.name,
        avatar: user.avatar
      }
      
      const token = await jwt.sign(payload, keys, { expiresIn: 3600 });
      res.json({
        success: true,
        token: 'Bearer ' + token
      });
    } else {
      return res.status(400).json({password: 'Password incorrect'});
    }
  } catch(error) {
    return res.json(error);
  }
});

/**
 * @route   GET api/users/current
 * @desc    Return current user
 * @access  Public
 */
router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.send(req.user);
});

module.exports = router;