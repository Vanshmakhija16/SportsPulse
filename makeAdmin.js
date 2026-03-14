const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('❌ Error:', err.message); process.exit(1); });

const User = mongoose.model('User', new mongoose.Schema({
  name:  String,
  email: String,
  role:  String,
}, { strict: false }));

async function makeAdmin() {
  // ⬇️  CHANGE THIS to your registered email
  const YOUR_EMAIL = 'your@email.com';

  const user = await User.findOne({ email: YOUR_EMAIL });

  if (!user) {
    console.log('❌ No user found with email:', YOUR_EMAIL);
    console.log('👉 Make sure you have registered first at http://localhost:5173/register');
    process.exit(1);
  }

  await User.updateOne({ email: YOUR_EMAIL }, { role: 'admin' });
  console.log('\n✅ Success! Role updated to admin');
  console.log('👤 User:', user.name);
  console.log('📧 Email:', YOUR_EMAIL);
  console.log('\n👉 Log out and log back in at http://localhost:5173/login\n');
  process.exit(0);
}

makeAdmin();
