import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('MONGO_URI not found in .env');
    process.exit(1);
}

// Minimal User Schema for reset
const userSchema = new mongoose.Schema({
    email: String,
    isTwoFactorEnabled: Boolean,
    twoFactorSecret: String
});

const User = mongoose.model('User', userSchema);

async function reset2FA() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const email = process.env.EMAIL_USER;
        if (!email) {
            console.error('EMAIL_USER not found in .env');
            process.exit(1);
        }

        const result = await User.findOneAndUpdate(
            { email: email.toLowerCase() },
            {
                isTwoFactorEnabled: false,
                twoFactorSecret: null
            },
            { new: true }
        );

        if (result) {
            console.log(`SUCCESS: 2FA has been disabled for ${email}`);
        } else {
            console.log(`FAILED: No user found with email ${email}`);
        }

    } catch (error) {
        console.error('Error during 2FA reset:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

reset2FA();
