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
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Error:", err));

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

// উইথড্র মডেল
const WithdrawSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  phone: String,
  method: String,
  amount: Number,
  status: { type: String, default: "pending" },
  requestedAt: { type: Date, default: Date.now }
});
const Withdraw = mongoose.model('Withdraw', WithdrawSchema);

// Register
app.post('/api/register', async (req, res) => {
  const { name, email, password, referralCode } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "ইউজার আগে থেকে আছে" });

    const newReferralCode = shortid.generate();
    user = new User({
      name, email,
      password: await bcrypt.hash(password, 10),
      referralCode: newReferralCode,
      referredBy: referralCode || null
    });

    if (referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode.trim() });
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
    console.error(err);
    res.status(500).json({ msg: "সার্ভারে সমস্যা" });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "ইউজার পাওয়া যায়নি" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "পাসওয়ার্ড ভুল" });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { ...user._doc, password: null } });
  } catch (err) {
    res.status(500).json({ msg: "সার্ভারে সমস্যা" });
  }
});

// Get Tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find({ active: true });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ msg: "টাস্ক লোড করতে সমস্যা" });
  }
});

// Admin - Add Task
app.post('/api/admin/task/add', async (req, res) => {
  const { title, reward, link } = req.body;
  try {
    const task = new Task({ title, reward, link });
    await task.save();
    res.json({ msg: "টাস্ক যোগ করা হয়েছে!" });
  } catch (err) {
    res.status(500).json({ msg: "সমস্যা হয়েছে" });
  }
});

// Admin - Get All Users
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
   } catch (err) {
    res.status(500).json({ msg: "সমস্যা" });
  }
});

// Withdraw Request
app.post('/api/withdraw/request', async (req, res) => {
  const { userId, name, phone, method, amount } = req.body;
  try {
    const user = await User.findById(userId);
    if (user.balance < amount) return res.status(400).json({ msg: "ব্যালেন্স যথেষ্ট নয়" });
    if (amount < 500) return res.status(400).json({ msg: "মিনিমাম ৫০০ টাকা" });

    const withdraw = new Withdraw({ userId, name, phone, method, amount });
    await withdraw.save();
    res.json({ msg: "উইথড্র রিকোয়েস্ট সফল!" });
  } catch (err) {
    res.status(500).json({ msg: "সমস্যা" });
  }
});

// Admin - Get All Withdraws
app.get('/api/admin/withdraws', async (req, res) => {
  try {
    const withdraws = await Withdraw.find().populate('userId', 'name email').sort({ requestedAt: -1 });
    res.json(withdraws);
  } catch (err) {
    res.status(500).json({ msg: "উইথড্র লোড করতে সমস্যা" });
  }
});

// Admin - Approve/Reject Withdraw
app.post('/api/admin/withdraw/action', async (req, res) => {
  const { withdrawId, action } = req.body;
  try {
    const withdraw = await Withdraw.findById(withdrawId);
    if (action === "approved") {
      const user = await User.findById(withdraw.userId);
      user.balance -= withdraw.amount;
      await user.save();
    }
    withdraw.status = action;
    await withdraw.save();
    res.json({ msg: "সফলভাবে আপডেট করা হয়েছে" });
  } catch (err) {
    res.status(500).json({ msg: "সমস্যা" });
  }
});

// Create Admin + Seed Tasks
app.get('/create-admin', async (req, res) => {
  const admin = await User.findOne({ email: "admin@gmail.com" });
  if (!admin) {
    const newAdmin = new User({
      name: "Admin", email: "admin@gmail.com", password: await bcrypt.hash("admin123", 10),
      balance: 999999, isAdmin: true
    });
    await newAdmin.save();
    res.send("Admin তৈরি: admin@gmail.com / admin123");
  } else res.send("Admin আগে থেকে আছে");
});

app.get('/seed-tasks', async (req, res) => {
  await Task.deleteMany({});
  const tasks = [
    { title: "YouTube চ্যানেল সাবস্ক্রাইব করুন", reward: 30, link: "https://youtube.com" },
    { title: "Facebook পেজ লাইক করুন", reward: 25, link: "https://facebook.com" }
  ];
  await Task.insertMany(tasks);
  res.send("টাস্ক যোগ করা হয়েছে!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
