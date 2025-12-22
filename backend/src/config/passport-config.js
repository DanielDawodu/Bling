import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

// Configure the local strategy for use by Passport
passport.use(new LocalStrategy(
    {
        usernameField: 'email', // Use email instead of username for login
        passwordField: 'password'
    },
    async (email, password, done) => {
        try {
            // Find user by email
            const user = await User.findOne({ email: email.toLowerCase() });

            if (!user) {
                return done(null, false, { message: 'Invalid email or password' });
            }

            // Compare password
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return done(null, false, { message: 'Invalid email or password' });
            }

            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));

// Serialize user for the session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id).select('-password');
        done(null, user);
    } catch (error) {
        done(error);
    }
});

export default passport;
