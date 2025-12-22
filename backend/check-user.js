import mongoose from 'mongoose';
import User from './src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config();

const checkUser = async () => {
    const email = 'danieldawodu07@gmail.com';

    try {
        console.log('Connecting to database...');
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        const user = await User.findOne({ email });

        if (!user) {
            console.log('❌ User not found');
        } else {
            console.log('User found:');
            console.log(`Username: ${user.username}`);
            console.log(`Email: ${user.email}`);
            console.log(`isAdmin: ${user.isAdmin}`);
            console.log(`_id: ${user._id}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkUser();
