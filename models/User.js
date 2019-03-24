const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
});

UserSchema.pre('remove', function(next) {
  const Profile = mongoose.model('profiles');
  Profile.remove({ user: this._id })
    .then(() => next());
});

const User = mongoose.model('users', UserSchema);
module.exports = User;