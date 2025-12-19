const mongoose = require("mongoose");
const User = require("../models/user");
require("dotenv").config();

const testUsers = [
  {
    name: "John Doe",
    email: "john@teamflow.com",
    password: "password123",
    role: "admin",
  },
  {
    name: "Selena Kyle",
    email: "selena@teamflow.com",
    password: "password123",
    role: "project_manager",
  },
  {
    name: "Alex Mason",
    email: "alex@teamflow.com",
    password: "password123",
    role: "member",
  },
  {
    name: "Maria Garcia",
    email: "maria@teamflow.com",
    password: "password123",
    role: "member",
  },
  {
    name: "David Wilson",
    email: "david@teamflow.com",
    password: "password123",
    role: "member",
  },
];

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

   
    // Create users
    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        console.log(`User already exists: ${userData.email}`);
        continue;
      }

      const user = new User(userData);
      await user.save();
      console.log(
        `Created user: ${user.name} (${user.email}) - ID: ${user._id}`
      );
    }

    console.log("\n Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedUsers();
