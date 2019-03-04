const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const router = require('express').Router();
const User = require('../../models/User');

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
      return res.status(400).json({ email: 'Email already exists' });
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newUser.password, salt);
    newUser.password = hash;
    const savedUser = await newUser.save();
    res.json(savedUser);
  } catch(err) {
    console.log(err);
  }
  
});

module.exports = router;