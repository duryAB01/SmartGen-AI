require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartgen');
    console.log('MongoDB connected.');

    const adminEmail = 'admin@smartgen.com';
    const adminPassword = 'adminpassword123';

    // Check if exists
    let admin = await User.findOne({ email: adminEmail });
    if (admin) {
      console.log('Admin already exists. Updating password and role...');
      admin.password = adminPassword;
      admin.role = 'admin';
      await admin.save();
    } else {
      console.log('Creating new admin user...');
      admin = await User.create({
        name: 'Admin User',
        email: adminEmail,
        password: adminPassword,
        role: 'admin'
      });
    }

    console.log('\n=============================================');
    console.log('✅ ADMIN CREDENTIALS CREATED SUCCESSFULLY');
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('=============================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin:', err);
    process.exit(1);
  }
};

seedAdmin();
