require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const shortid = require('shortid');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connect
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Models
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  referralCode: { type: String, unique: true },
  referredBy: String,
  balance: { type: Number, default: 0 },
  totalEarned: { type: Number, default: 0 },
  tasksCompleted: [String],
  isAdmin: { type: Boolean, default: false }
});
const User = mongoose.model('User', UserSchema);

const TaskSchema = new mongoose.Schema({
  title: String,
  reward: Number,
  link: String,
  active: { type: Boolean, default: true }
});
const Task = mongoose.model('Task', TaskSchema);

// Register
app.post('/api/register', async (req, res) => {
  const { name, email, password, referralCode } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "User exists" });

    const newReferralCode = shortid.generate();
    user = new User({
      name, email,
      password: await bcrypt.hash(password, 10),
      referralCode: newReferralCode,
      referredBy: referralCode || null
    });

    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        referrer.balance += 50;
        referrer.totalEarned += 50;
        await referrer.save();
      }
    }

    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { ...user._doc, password: null } });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { ...user._doc, password: null } });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Get All Tasks
app.get('/api/tasks', async (req, res) => {
  const tasks = await Task.find({ active: true });
  res.json(tasks);
});

// Complete Task
app.post('/api/complete-task', async (req, res) => {
  const { userId, taskId } = req.body;
  const user = await User.findById(userId);
  const task = await Task.findById(taskId);
  if (user && task) {
    user.balance += task.reward;
    user.totalEarned += task.reward;
    user.tasksCompleted.push(taskId);
    await user.save();
    res.json({ msg: "Task completed", balance: user.balance });
  }
});

// Admin Routes (example)
app.get('/api/admin/users', async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

// Default Admin Create (প্রথমবার রান করলে চালাবি)
app.get('/create-admin', async (req, res) => {
  const admin = await User.findOne({ email: "admin@gmail.com" });
  if (!admin) {
    const newAdmin = new User({
      name: "Admin",
      email: "admin@gmail.com",
      password: await bcrypt.hash("admin123", 10),
      isAdmin: true,
      balance: 999999
    });
    await newAdmin.save();
    res.send("Admin created: admin@gmail.com / admin123");
  } else {
    res.send("Admin already exists");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));