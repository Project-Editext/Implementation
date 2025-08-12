// Test file to test mongodb connection for user:prj666
// run: node testMongo.js

import mongoose from "mongoose";

async function testConnection() {
  const uri = "mongodb+srv://prj666:prj666@cluster0.ahf0qgy.mongodb.net/editext?retryWrites=true&w=majority";
  try {
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
    process.exit(1);
  }
}

testConnection();
