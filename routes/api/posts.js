const router = require('express').Router();
const mongoose = require('mongoose');
const passport = require('passport');
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const validatePostInput = require('../../validation/post');

/**
 * @route   GET api/posts/test
 * @desc    Tests posts route
 * @access  Public
 */
router.get('/test', (req, res) => res.json({msg: 'Posts Works'}));

/**
 * @route   GET api/posts
 * @desc    Get all posts
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1});
    return res.json(posts);
  } catch(err) {
    console.log(err);
    return res.status(404).json({ noPostsFound: 'No posts found'});
  }
});

/**
 * @route   GET api/posts/:id
 * @desc    Get post by id
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    return res.json(post);
  } catch(err) {
    console.log(err);
    return res.status(404).json({ noPostFound: 'No post found with that ID'});
  }
});

/**
 * @route   DELETE api/posts/:id
 * @desc    Delete post by id
 * @access  Private
 */
router.delete('/:id', passport.authenticate('jwt', { session: false}), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ notAuthorized: 'User not authorized' });
    }
    await post.remove();
    return res.json({ success: true });
  } catch(err) {
    console.log(err);
    return res.status(404).json({ noPostFound: 'No post found'});
  }
});

/**
 * @route   GET api/posts/like/:id
 * @desc    Like post
 * @access  Private
 */
router.get('/like/:id', passport.authenticate('jwt', { session: false}), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.likes.some(like => like.user.toString() === req.user.id)) {
      return res.status(400).json({ alreadyLiked: 'You already liked this post' });
    }

    post.likes.push({ user: req.user.id });
    const savedPost = await post.save();
    return res.json(savedPost);

  } catch(err) {
    console.log(err);
    return res.status(404).json({ noPostFound: 'No post found'});
  }
});

/**
 * @route   GET api/posts/unlike/:id
 * @desc    Like post
 * @access  Private
 */
router.get('/unlike/:id', passport.authenticate('jwt', { session: false}), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const likesIndex = post.likes.findIndex(like => like.user.toString() === req.user.id);
    if (likesIndex === -1) {
      return res.status(400).json({ alreadyLiked: 'You have not liked this post' });
    }

    post.likes.splice(likesIndex, 1);
    const savedPost = await post.save();
    return res.json(savedPost);

  } catch(err) {
    console.log(err);
    return res.status(404).json({ noPostFound: 'No post found'});
  }
});

/**
 * @route   POST api/posts
 * @desc    Create post
 * @access  Private
 */
router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const { errors, isValid } = validatePostInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  const { text, name, avatar, } = req.body;
  const newPost = new Post({
    text,
    name,
    avatar,
    user: req.user.id
  });

  try {
    const savedPost = await newPost.save();
    return res.json(savedPost);
  } catch(err) {
    console.log(err);
    return res.json(err);
  }

});

/**
 * @route   POST api/posts/comment/:id
 * @desc    Add comment to post
 * @access  Private
 */
router.post('/comment/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const { errors, isValid } = validatePostInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  try {
    const post = await Post.findById(req.params.id);
    const { text, name, avatar } = req.body;
    const newComment = {
      text,
      name,
      avatar,
      user: req.user.id
    }

    post.comments.unshift(newComment);
    const savedPost = await post.save();
    return res.json(savedPost);
  } catch(err) {
    console.log(err);
    return res.status(404).json({ postNotFound: 'No post found' });
  }
});

/**
 * @route   DELETE api/posts/comment/:id/:comment_id
 * @desc    Delete comment from post
 * @access  Private
 */
router.delete('/comment/:id/:comment_id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const removeIndex = post.comments.findIndex(comment => comment._id.toString() === req.params.comment_id);
    if (removeIndex === -1) {
      return res.status(404).json({ commentNotExist: 'Comment does not exist' });
    }

    if (post.comments[removeIndex].user.toString() !== req.user.id.toString()) {
      return res.status(401).json({ notAuthorized: 'Not authorized to delete another user\'s comment' });
    }
    post.comments.splice(removeIndex, 1);
    const savedPost = post.save();
    return res.json(savedPost);
  } catch(err) {
    console.log(err);
    return res.status(404).json({ postNotFound: 'No post found' });
  }
});

module.exports = router;