const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('❌ Connection error:', err.message); process.exit(1); });

const userSchema = new mongoose.Schema({
  name:     String,
  email:    { type: String, unique: true },
  password: String,
  role:     { type: String, default: 'student' },
  college:  String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    // Check if admin already exists
    const existing = await User.findOne({ email: 'admin@sportspulse.com' });
    if (existing) {
      // If exists just update role to admin
      await User.updateOne({ email: 'admin@sportspulse.com' }, { role: 'admin' });
      console.log('✅ Existing user updated to admin!');
      console.log('📧 Email:    admin@sportspulse.com');
      console.log('🔑 Password: admin123');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Create admin user
    const admin = await User.create({
      name:     'Admin User',
      email:    'admin@sportspulse.com',
      password: hashedPassword,
      role:     'admin',
      college:  'Arya College',
      isActive: true
    });

    console.log('\n✅ Admin account created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    admin@sportspulse.com');
    console.log('🔑 Password: admin123');
    console.log('🎭 Role:     admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nNow login at http://localhost:5173/login\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
    process.exit(1);
  }
}

createAdmin();
