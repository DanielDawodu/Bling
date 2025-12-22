import mongoose from 'mongoose';
import User from './src/models/User.js';
import Post from './src/models/Post.js';
import Snippet from './src/models/Snippet.js';
import Job from './src/models/Job.js';
import dotenv from 'dotenv';

dotenv.config();

const seedTrending = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Get a user (or create one)
        let user = await User.findOne();
        if (!user) {
            console.log('No user found, creating one...');
            user = await User.create({
                username: 'DemoUser',
                email: 'demo@example.com',
                password: 'password123'
            });
        }

        // 2. Create a Trending Snippet (High Likes)
        const snippet = await Snippet.create({
            title: 'Awesome React Hook',
            description: 'A custom hook for handling window resize',
            code: 'const useWindowSize = () => { ... }',
            language: 'javascript',
            author: user._id,
            likes: [user._id, user._id, user._id] // Fake 3 likes (using same ID for simplicity of schema validation, usually unique)
        });
        console.log('Created Trending Snippet:', snippet.title);

        // 3. Create a Trending Job (High Applicants)
        const job = await Job.create({
            title: 'Senior Frontend Engineer',
            company: 'TechCorp',
            description: 'We are looking for a React expert...',
            location: 'Remote',
            jobType: 'full-time',
            postedBy: user._id,
            applicants: [user._id, user._id, user._id, user._id, user._id] // 5 applicants
        });
        console.log('Created Trending Job:', job.title);

        // 4. Create a Trending Post (High Interactions)
        const post = await Post.create({
            title: 'Why I love Web Development',
            content: 'It is just amazing to build things...',
            author: user._id,
            likes: [user._id, user._id],
            comments: [], // We'd need to create comment docs to populate this properly, but for count aggregation we used $size of array. 
            // Wait, the aggregation uses $size of the array. 
            // If I just push IDs here, it counts.
            reposts: [user._id]
        });
        console.log('Created Trending Post:', post.title);

        console.log('Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedTrending();
