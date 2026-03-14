const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// ─────────────────────────────────────────
//  CONNECT
// ─────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('❌ Connection error:', err.message); process.exit(1); });

// ─────────────────────────────────────────
//  MODELS
// ─────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:             String,
  email:            { type: String, unique: true },
  password:         String,
  role:             { type: String, default: 'student' },
  college:          String,
  department:       String,
  year:             Number,
  phone:            String,
  isActive:         { type: Boolean, default: true },
  registeredEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  teams:            [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
}, { timestamps: true });

const eventSchema = new mongoose.Schema({
  title:                String,
  description:          String,
  sport:                String,
  category:             String,
  venue:                String,
  startDate:            Date,
  endDate:              Date,
  registrationDeadline: Date,
  maxParticipants:      Number,
  maxTeamSize:          Number,
  minTeamSize:          Number,
  status:               { type: String, default: 'upcoming' },
  prizes:               { first: String, second: String, third: String },
  rules:                [String],
  organizer:            { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  registrations:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'Registration' }],
  results:              [{ type: mongoose.Schema.Types.ObjectId, ref: 'Result' }],
  college:              String,
  tags:                 [String],
}, { timestamps: true });

const User  = mongoose.models.User  || mongoose.model('User',  userSchema);
const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);

// ─────────────────────────────────────────
//  SEED
// ─────────────────────────────────────────
async function seed() {
  try {
    console.log('\n🌱 Starting seed...\n');

    // 1. Clear old data
    await User.deleteMany({});
    await Event.deleteMany({});
    console.log('🗑️  Cleared existing users and events');

    // ─────────────────────────────────────────
    // 2. Hash passwords MANUALLY before insert
    //    (insertMany skips pre-save hooks!)
    // ─────────────────────────────────────────
    const adminPass   = await bcrypt.hash('admin123',   12);
    const coachPass   = await bcrypt.hash('coach123',   12);
    const studentPass = await bcrypt.hash('student123', 12);

    console.log('🔐 Passwords hashed successfully');

    // 3. Create users WITH pre-hashed passwords
    const users = await User.insertMany([
      {
        name:       'Admin User',
        email:      'admin@sportspulse.com',
        password:   adminPass,        // ✅ already hashed
        role:       'admin',
        college:    'Arya College of Engineering',
        department: 'Administration',
        isActive:   true,
      },
      {
        name:       'Coach Ramesh',
        email:      'coach@sportspulse.com',
        password:   coachPass,        // ✅ already hashed
        role:       'coach',
        college:    'Arya College of Engineering',
        department: 'Physical Education',
        isActive:   true,
      },
      {
        name:       'Vansh Sharma',
        email:      'vansh@student.com',
        password:   studentPass,      // ✅ already hashed
        role:       'student',
        college:    'Arya College of Engineering',
        department: 'Computer Science',
        year:       3,
        phone:      '9876543210',
        isActive:   true,
      },
      {
        name:       'Rohit Verma',
        email:      'rohit@student.com',
        password:   studentPass,
        role:       'student',
        college:    'Arya College of Engineering',
        department: 'Mechanical Engineering',
        year:       2,
        phone:      '9876543211',
        isActive:   true,
      },
      {
        name:       'Priya Singh',
        email:      'priya@student.com',
        password:   studentPass,
        role:       'student',
        college:    'Arya College of Engineering',
        department: 'Electronics',
        year:       4,
        phone:      '9876543212',
        isActive:   true,
      },
      {
        name:       'Arjun Mehta',
        email:      'arjun@student.com',
        password:   studentPass,
        role:       'student',
        college:    'Arya College of Engineering',
        department: 'Civil Engineering',
        year:       1,
        phone:      '9876543213',
        isActive:   true,
      },
    ]);

    console.log(`👥 Created ${users.length} users`);

    // ─────────────────────────────────────────
    // 4. Verify hashing worked correctly
    // ─────────────────────────────────────────
    const adminCheck = await User.findOne({ email: 'admin@sportspulse.com' });
    const hashTest   = await bcrypt.compare('admin123', adminCheck.password);
    console.log(`🔑 Password hash verification: ${hashTest ? '✅ PASSED' : '❌ FAILED'}`);

    if (!hashTest) {
      console.error('❌ Hash verification failed! Login will not work.');
      process.exit(1);
    }

    const admin = users[0];
    const today = new Date();

    // 5. Create Events
    const events = await Event.insertMany([
      // Cricket - Team
      {
        title:                'Inter-College Cricket Championship 2024',
        description:          'Annual cricket tournament open to all college teams. Teams of 11 players will compete in a knockout format over 3 days. All matches will be played at the main ground.',
        sport:                'Cricket',
        category:             'team',
        venue:                'Main Cricket Ground',
        startDate:            new Date(today.getFullYear(), today.getMonth() + 1, 10),
        endDate:              new Date(today.getFullYear(), today.getMonth() + 1, 13),
        registrationDeadline: new Date(today.getFullYear(), today.getMonth() + 1, 5),
        maxParticipants:      16,
        maxTeamSize:          11,
        minTeamSize:          8,
        status:               'upcoming',
        prizes: { first: '₹10,000 + Trophy', second: '₹5,000 + Medal', third: '₹2,500 + Medal' },
        rules: [
          'Each team must have minimum 8 and maximum 11 players',
          'Match duration: 20 overs per side',
          'DRS is not available — umpire decision is final',
          'Players must carry their college ID cards',
          'No professional or ex-Ranji players allowed',
        ],
        organizer: admin._id,
        college:   'Arya College of Engineering',
        tags:      ['cricket', 'team', 'outdoor'],
      },
      // Chess - Individual
      {
        title:                'College Chess Tournament 2024',
        description:          'Individual chess tournament open to all students. Swiss system format with 7 rounds. Time control: 15 minutes per player per game.',
        sport:                'Chess',
        category:             'individual',
        venue:                'Seminar Hall, Block A',
        startDate:            new Date(today.getFullYear(), today.getMonth() + 1, 20),
        endDate:              new Date(today.getFullYear(), today.getMonth() + 1, 20),
        registrationDeadline: new Date(today.getFullYear(), today.getMonth() + 1, 18),
        maxParticipants:      32,
        maxTeamSize:          1,
        minTeamSize:          1,
        status:               'upcoming',
        prizes: { first: '₹3,000 + Trophy', second: '₹2,000 + Medal', third: '₹1,000 + Medal' },
        rules: [
          'Swiss system — 7 rounds',
          'Time control: 15 minutes + 5 seconds increment',
          'Electronic devices strictly prohibited during games',
          'Late arrival of more than 10 minutes = forfeit',
        ],
        organizer: admin._id,
        college:   'Arya College of Engineering',
        tags:      ['chess', 'individual', 'indoor'],
      },
      // Badminton - Individual
      {
        title:                'Badminton Singles Championship',
        description:          'Open badminton singles tournament for all students. Knockout format. Yonex shuttles will be provided. Players must bring their own rackets.',
        sport:                'Badminton',
        category:             'individual',
        venue:                'Indoor Sports Hall',
        startDate:            new Date(today.getFullYear(), today.getMonth() + 2, 5),
        endDate:              new Date(today.getFullYear(), today.getMonth() + 2, 6),
        registrationDeadline: new Date(today.getFullYear(), today.getMonth() + 2, 1),
        maxParticipants:      64,
        maxTeamSize:          1,
        minTeamSize:          1,
        status:               'upcoming',
        prizes: { first: '₹5,000 + Trophy', second: '₹3,000 + Medal', third: '₹1,500 + Medal' },
        rules: [
          'Best of 3 sets, each set to 21 points',
          'Players must bring their own rackets',
          'Shuttles will be provided by organisers',
          'Proper sports shoes are mandatory',
        ],
        organizer: admin._id,
        college:   'Arya College of Engineering',
        tags:      ['badminton', 'individual', 'indoor'],
      },
      // Football - Team
      {
        title:                'Annual Football League 2024',
        description:          'Inter-department football tournament. Teams of 7 players (5-a-side format). Round-robin group stage followed by knockout semifinals and final.',
        sport:                'Football',
        category:             'team',
        venue:                'Football Ground, Block C',
        startDate:            new Date(today.getFullYear(), today.getMonth() + 2, 15),
        endDate:              new Date(today.getFullYear(), today.getMonth() + 2, 18),
        registrationDeadline: new Date(today.getFullYear(), today.getMonth() + 2, 10),
        maxParticipants:      8,
        maxTeamSize:          7,
        minTeamSize:          5,
        status:               'upcoming',
        prizes: { first: '₹8,000 + Trophy', second: '₹4,000 + Medal', third: '₹2,000 + Medal' },
        rules: [
          '5-a-side format with 2 substitutes allowed',
          'Each match: Two halves of 15 minutes each',
          'No sliding tackles allowed',
          'Yellow card = 5 minute suspension, Red card = ejection',
          'Players must wear shin guards',
        ],
        organizer: admin._id,
        college:   'Arya College of Engineering',
        tags:      ['football', 'team', 'outdoor'],
      },
      // Athletics - Completed
      {
        title:                '100m Sprint Championship',
        description:          'Annual 100 metre sprint race open to all students. Fastest qualifying times from heats advance to the final.',
        sport:                'Athletics',
        category:             'individual',
        venue:                'Athletic Track, Sports Complex',
        startDate:            new Date(today.getFullYear(), today.getMonth() - 1, 10),
        endDate:              new Date(today.getFullYear(), today.getMonth() - 1, 10),
        registrationDeadline: new Date(today.getFullYear(), today.getMonth() - 1, 5),
        maxParticipants:      30,
        maxTeamSize:          1,
        minTeamSize:          1,
        status:               'completed',
        prizes: { first: '₹2,000 + Gold Medal', second: '₹1,500 + Silver Medal', third: '₹1,000 + Bronze Medal' },
        rules: [
          'False start = disqualification',
          'Spikes allowed (max 9mm)',
          'Lanes will be assigned by draw',
          'Athletes must report 30 minutes before race',
        ],
        organizer: admin._id,
        college:   'Arya College of Engineering',
        tags:      ['athletics', 'sprint', 'outdoor'],
      },
    ]);

    console.log(`🏟️  Created ${events.length} events`);

    // ─────────────────────────────────────────
    //  FINAL SUMMARY
    // ─────────────────────────────────────────
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅  SEED COMPLETE — Ready to login!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n🔴 ADMIN');
    console.log('   Email   : admin@sportspulse.com');
    console.log('   Password: admin123');

    console.log('\n🟡 COACH');
    console.log('   Email   : coach@sportspulse.com');
    console.log('   Password: coach123');

    console.log('\n🟢 STUDENTS');
    console.log('   Email   : vansh@student.com  | Password: student123');
    console.log('   Email   : rohit@student.com  | Password: student123');
    console.log('   Email   : priya@student.com  | Password: student123');
    console.log('   Email   : arjun@student.com  | Password: student123');

    console.log('\n🏟️  EVENTS');
    events.forEach((e, i) => console.log(`   ${i+1}. [${e.category.toUpperCase()}] ${e.title} — ${e.status}`));

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👉 Run backend : npm run dev');
    console.log('👉 Open browser: http://localhost:5173/login');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);

  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

seed();
