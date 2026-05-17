const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const db = require('../config/db');

const DEFAULT_MONITORS = [
  { title: 'GitHub', target: 'https://github.com' },
  { title: 'Google', target: 'https://www.google.com' },
  { title: 'Google DNS', target: '8.8.8.8' }
];

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await User.create(name, email, hashedPassword);
    const newUserId = result.insertId;

    // Automatically assign default monitors to the new user
    for (const monitor of DEFAULT_MONITORS) {
      await db.execute(
        'INSERT INTO monitors (user_id, title, target, status, last_latency) VALUES (?, ?, ?, ?, ?)',
        [newUserId, monitor.title, monitor.target, 'pending', 0]
      );
    }

    res.status(201).json({ message: "User credentials stored in RDS and default monitors added" });
  } catch (error) {
    console.error("❌ Registration Database Error:", error);
    res.status(500).json({ message: "Error registering user", error: error.message || error });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findByEmail(email);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '2h' });
    res.json({ token, user: { name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
