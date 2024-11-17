const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Setup express app
const app = express();
const port = 3001;

// Middleware
app.use(cors());  // Enable CORS to allow frontend on port 8080
app.use(bodyParser.json());  // To parse incoming JSON requests

// MongoDB Atlas connection string
const mongoURI = 'mongodb+srv://Suba:Suba@userdb.uuzja.mongodb.net/User?retryWrites=true&w=majority';  // Replace with your MongoDB Atlas connection string

// Connect to MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB Atlas');
}).catch(err => {
  console.log('Error connecting to MongoDB:', err);
});

// Define User schema (for login/signup)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  regNo: { type: String, required: true },
  phone: { type: String, required: true }
}, { collection: 'UserDetails' });  // Specify the collection name

// Create User model
const User = mongoose.model('UserDetails', userSchema);

// Define Admission schema (for the admission form)
const admissionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  email: { type: String, required: true },
  tenthPercentile: { type: Number, required: true },
  twelfthPercentile: { type: Number, required: true },
  community: { type: String, required: true },
  dob: { type: Date, required: true },
  address: { type: String, required: true },
}, { collection: 'AdmissionDetails' });  // Specify the collection name

// Create Admission model
const Admission = mongoose.model('AdmissionDetails', admissionSchema);


// Signup Route
app.post('/signup', async (req, res) => {
  const { username, email, password, regNo, phone } = req.body;

  // Check if all fields are provided
  if (!username || !email || !password || !regNo || !phone) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // Check if the user already exists
  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser) {
    return res.status(400).json({ message: 'Username or Email already exists.' });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Store the new user in the database
  const newUser = new User({
    username,
    email,
    password: hashedPassword,
    regNo,
    phone
  });

  try {
    await newUser.save();
    res.status(200).json({ message: 'User signed up successfully!' });
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).json({ message: 'Error saving user to the database.' });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Check if username and password are provided
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and Password are required.' });
  }

  // Find the user by username
  const user = await User.findOne({ username });

  // If user is not found or password is incorrect
  if (!user) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  // Compare the provided password with the hashed password in the "database"
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  // If everything is correct, send a success response
  res.status(200).json({ message: 'Login successful!' });
});

// Admission Form Route
app.post('/admission', async (req, res) => {
  const { name, mobileNumber, email, tenthPercentile, twelfthPercentile, community, dob, address} = req.body;

  // Check if all fields are provided
  if (!name || !mobileNumber || !email || !tenthPercentile || !twelfthPercentile || !community || !dob || !address ) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // Store the admission details in the database
  const newAdmission = new Admission({
    name,
    mobileNumber,
    email,
    tenthPercentile,
    twelfthPercentile,
    community,
    dob,
    address
  });

  try {
    await newAdmission.save();
    res.status(200).json({ message: 'Admission details stored successfully!' });
  } catch (error) {
    console.error('Error saving admission details:', error);
    res.status(500).json({ message: 'Error saving admission details to the database.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
