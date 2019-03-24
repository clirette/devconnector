const router = require('express').Router();
const mongoose = require('mongoose');
const passport = require('passport');
const validateProfileInput = require('../../validation/profile');
const validateExperienceInput = require('../../validation/experience');
const validateEducationInput = require('../../validation/education');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

/**
 * @route   GET api/profile/test
 * @desc    Tests profile route
 * @access  Public
 */
router.get('/test', (req, res) => res.json({msg: 'Profile Works'}));

/**
 * @route   GET api/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const errors = {};
  try {
    const profile = await Profile.findById(req.user.id)
      .populate('user', ['name', 'avatar']);
    if (!profile) {
      errors.noProfile = 'There is no profile for this user';
      return res.status(404).json(errors);
    }
    return res.json(profile);
  } catch(err) {
    console.log(err);
    return res.status(404).json(err);
  }
});

/**
 * @route   GET api/profile/all
 * @desc    Get all profiles
 * @access  Public
 */
router.get('/all', async (req, res) => {
  const errors = {};
  try {
    const profiles = await Profile.find()
      .populate('user', ['name', 'avatar']);
    if (!profiles) {
      errors.noProfiles = 'There are no profiles';
      return res.status(404).json(errors);
    }
    return res.json(profiles);
  } catch(err) {
    console.log(err);
    return res.json({ profile: 'There are no profiles' });
  }
});

/**
 * @route   GET api/profile/handle/:handle
 * @desc    Get profile by handle
 * @access  Public
 */
router.get('/handle/:handle', async (req, res) => {
  const errors = {};

  try {
    const profile = await Profile.findOne({ handle: req.params.handle })
    .populate('user', ['name', 'avatar']);
    if (!profile) {
      errors.noProfile = 'There is no profile for this user';
      return res.status(404).json(errors);
    }
    return res.json(profile);
  } catch(err) {
    console.log(err);
    return res.json(err);
  }
});

/**
 * @route   GET api/profile/user/:user_id
 * @desc    Get profile by user ID
 * @access  Public
 */
router.get('/user/:user_id', async (req, res) => {
  const errors = {};

  try {
    const profile = await Profile.findById(req.params.user_id)
    .populate('user', ['name', 'avatar']);
    if (!profile) {
      errors.noProfile = 'There is no profile for this user';
      return res.status(404).json(errors);
    }
    return res.json(profile);
  } catch(err) {
    console.log(err);
    return res.json({noProfile: 'There is no profile for this user'});
  }
});

/**
 * @route   POST api/profile
 * @desc    Create user profile
 * @access  Private
 */
router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const { errors, isValid } = validateProfileInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  const { skills, youtube, twitter, facebook, linkedin, instagram } = req.body;
  const profileFields = {
    ...req.body,
    user: req.user.id,
    skills: skills.split(','),
    social: { youtube, twitter, facebook, linkedin, instagram }
  };
  try {
    const handleExists = await Profile.findOne({ handle: profileFields.handle });
    if (handleExists && !(handleExists._id.equals(req.user.id.toString()))) {
      errors.handle = 'That handle already exists';
      return res.status(400).json(errors);
    }
    const updatedProfile = await Profile.findByIdAndUpdate(req.user.id, profileFields, { upsert: true, new: true });
    return res.json(updatedProfile);
  } catch(err) {
    console.log(err);
    return res.json(err);
  }
});

/**
 * @route   POST api/profile/experience
 * @desc    Add experience to profile
 * @access  Private
 */
router.post('/experience', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const { errors, isValid } = validateExperienceInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  try {
    const profile = await Profile.findById(req.user.id);
    const newExp = req.body; 

    profile.experience.unshift(newExp);
    await profile.save();
    return res.json(profile);
  } catch(err) {
    console.log(err);
    return res.json(err);
  }
});

/**
 * @route   POST api/profile/education
 * @desc    Add education to profile
 * @access  Private
 */
router.post('/education', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const { errors, isValid } = validateEducationInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  try {
    const profile = await Profile.findById(req.user.id);
    const newEdu = req.body; 

    profile.education.unshift(newEdu);
    await profile.save();
    return res.json(profile);
  } catch(err) {
    console.log(err);
    return res.json(err);
  }
});

/**
 * @route   DELETE api/profile/experience/:exp_id
 * @desc    Delete experience from profile
 * @access  Private
 */
router.delete('/experience/:exp_id', passport.authenticate('jwt', { session: false }), async (req, res) => {
 
  try {
    const profile = await Profile.findById(req.user.id);
    const removeIndex = profile.experience
      .map(item => item.id)
      .indexOf(req.params.exp_id);

    profile.experience.splice(removeIndex, 1);
    const savedProfile = await profile.save();

    return res.json(savedProfile);
  } catch(err) {
    console.log(err);
    return res.json(err);
  }
});

/**
 * @route   DELETE api/profile/education/:edu_id
 * @desc    Delete education from profile
 * @access  Private
 */
router.delete('/education/:edu_id', passport.authenticate('jwt', { session: false }), async (req, res) => {
 
  try {
    const profile = await Profile.findById(req.user.id);
    const removeIndex = profile.education
      .map(item => item.id)
      .indexOf(req.params.edu_id);

    profile.education.splice(removeIndex, 1);
    const savedProfile = await profile.save();

    return res.json(savedProfile);
  } catch(err) {
    console.log(err);
    return res.json(err);
  }
});

/**
 * @route   DELETE api/profile
 * @desc    Delete user and profile
 * @access  Private
 */
router.delete('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const userToDelete = await User.findById(req.user.id);
    userToDelete.remove();
    res.json({ success: true });
  } catch(err) {
    console.log(err);
    return res.json(err);
  }
});

module.exports = router;