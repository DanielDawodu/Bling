import mongoose from 'mongoose';
import User from './src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config();

const makeAdmin = async () => {
    const email = process.argv[2];

    if (!email) {
        console.error('❌ Please provide an email address.');
        console.log('Usage: node make-admin.js <your-email>');
        process.exit(1);
    }

    try {
        console.log('Connecting to database...');
        // Try both variable names just in case, though src/index.js uses MONGO_URI
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGO_URI is not defined in .env');
        }

        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        const user = await User.findOne({ email });

        if (!user) {
            console.error(`❌ User with email "${email}" not found.`);
            console.log('Please check the email and try again.');
            process.exit(1);
        }

        if (user.isAdmin) {
            console.log(`ℹ️  User ${user.username} is already an admin.`);
        } else {
            user.isAdmin = true;
            await user.save();
            console.log(`🎉 Successfully made ${user.username} (${user.email}) an admin!`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

makeAdmin();
