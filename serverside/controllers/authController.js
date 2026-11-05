const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const createToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (await User.findOne({ username })) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashed });

    res.status(201).json({ token: createToken(user._id), username: user.username });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Wrong username or password" });
    }

    res.json({ token: createToken(user._id), username: user.username });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMe = (req, res) => {
  res.json({ username: req.user.username });
};