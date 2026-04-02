require('dotenv').config();
const mongoose = require('mongoose');

const State = require('./models/State');
const User = require('./models/User');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Clear old state admins and states
  await User.deleteMany({ role: 'state_admin' });
  await State.deleteMany({});
  console.log('🗑️  Cleared old states and state admins');

  // Create states
  const stateData = [
    { name: 'Odisha', code: 'OD' },
    { name: 'Jharkhand', code: 'JH' },
    { name: 'Bihar', code: 'BR' },
    { name: 'West Bengal', code: 'WB' },
    { name: 'Chhattisgarh', code: 'CG' },
    { name: 'Andhra Pradesh', code: 'AP' },
    { name: 'Maharashtra', code: 'MH' },
    { name: 'Uttar Pradesh', code: 'UP' },
  ];

  const states = [];
  for (const s of stateData) {
    const state = await State.create(s);
    states.push(state);
    console.log(`✅ State: ${state.name} | ID: ${state._id}`);
  }

  // Create state admins and assign
  const adminData = [
    { name: 'Odisha Admin',        email: 'odisha@truck.com',       password: 'odisha123',       state: 'Odisha' },
    { name: 'Jharkhand Admin',     email: 'jharkhand@truck.com',    password: 'jharkhand123',    state: 'Jharkhand' },
    { name: 'Bihar Admin',         email: 'bihar@truck.com',        password: 'bihar123',        state: 'Bihar' },
    { name: 'West Bengal Admin',   email: 'westbengal@truck.com',   password: 'westbengal123',   state: 'West Bengal' },
    { name: 'Chhattisgarh Admin',  email: 'chhattisgarh@truck.com', password: 'chhattisgarh123', state: 'Chhattisgarh' },
    { name: 'Andhra Pradesh Admin',email: 'ap@truck.com',           password: 'ap123',           state: 'Andhra Pradesh' },
    { name: 'Maharashtra Admin',   email: 'mh@truck.com',           password: 'mh123',           state: 'Maharashtra' },
    { name: 'Uttar Pradesh Admin', email: 'up@truck.com',           password: 'up123',           state: 'Uttar Pradesh' },
  ];

  for (const a of adminData) {
    const state = states.find(s => s.name === a.state);
    const user = await User.create({
      name: a.name,
      email: a.email,
      password: a.password,
      role: 'state_admin',
      assignedState: state._id,
    });
    await State.findByIdAndUpdate(state._id, { adminId: user._id });
    console.log(`✅ Admin: ${user.name} | ID: ${user._id} | State: ${state.name}`);
  }

  console.log('\n🎉 Seed complete!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
