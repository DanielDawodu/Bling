import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

// Local Strategy
passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
        try {
            const user = await User.findOne({ email });
            if (!user) {
                return done(null, false, { message: 'Invalid email or password' });
            }

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

// GitHub Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || 'your_github_client_id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'your_github_client_secret',
    callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5001/api/auth/github/callback'
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists
            let user = await User.findOne({ githubId: profile.id });

            if (user) {
                return done(null, user);
            }

            // Check if email already exists
            const email = profile.emails?.[0]?.value || `${profile.username}@github.com`;
            user = await User.findOne({ email });

            if (user) {
                // Link GitHub account to existing user
                user.githubId = profile.id;
                user.isEmailVerified = true; // OAuth email is trusted
                if (!user.avatar && profile.photos?.[0]?.value) {
                    user.avatar = profile.photos[0].value;
                }
                await user.save();
                return done(null, user);
            }

            // Create new user
            user = new User({
                username: profile.username || profile.displayName,
                email,
                githubId: profile.id,
                avatar: profile.photos?.[0]?.value || '',
                password: await bcrypt.hash(Math.random().toString(36), 10), // Random password for OAuth users
                isEmailVerified: true
            });

            await user.save();
            done(null, user);
        } catch (error) {
            done(error);
        }
    }
));

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'your_google_client_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your_google_client_secret',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/auth/google/callback'
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists
            let user = await User.findOne({ googleId: profile.id });

            if (user) {
                return done(null, user);
            }

            // Check if email already exists
            const email = profile.emails?.[0]?.value;
            if (email) {
                user = await User.findOne({ email });

                if (user) {
                    // Link Google account to existing user
                    user.googleId = profile.id;
                    user.isEmailVerified = true; // OAuth email is trusted
                    if (!user.avatar && profile.photos?.[0]?.value) {
                        user.avatar = profile.photos[0].value;
                    }
                    await user.save();
                    return done(null, user);
                }
            }

            // Create new user
            user = new User({
                username: profile.displayName || profile.emails?.[0]?.value.split('@')[0],
                email: email || `${profile.id}@google.com`,
                googleId: profile.id,
                avatar: profile.photos?.[0]?.value || '',
                password: await bcrypt.hash(Math.random().toString(36), 10), // Random password for OAuth users
                isEmailVerified: true
            });

            await user.save();
            done(null, user);
        } catch (error) {
            done(error);
        }
    }
));

// Serialize user
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id).select('-password');
        done(null, user);
    } catch (error) {
        done(error);
    }
});

export default passport;
