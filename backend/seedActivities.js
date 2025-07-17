import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Activity from './src/models/activityModel.js';
import User from './src/models/userModel.js';

// Load env vars
dotenv.config();

// Connect to database
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

const seedActivities = async () => {
    try {
        await connectDB();

        // Get the first user from the database (assuming there's at least one user)
        const users = await User.find().limit(3);
        if (users.length === 0) {
            console.log('No users found. Please create users first.');
            process.exit(1);
        }

        // Clear existing activities
        await Activity.deleteMany({});
        console.log('Cleared existing activities');

        // Sample activities to seed
        const sampleActivities = [
            {
                user: users[0]._id,
                action: 'login',
                description: `User ${users[0].name} logged into the system`,
                metadata: { loginTime: new Date(), device: 'Web Browser' }
            },
            {
                user: users[0]._id,
                action: 'inspection_created',
                description: `Created inspection for batch PROD-2025-001`,
                metadata: { batchNumber: 'PROD-2025-001', totalInspected: 100 }
            },
            {
                user: users[1] ? users[1]._id : users[0]._id,
                action: 'defect_logged',
                description: `Logged critical defect in batch PROD-2025-001`,
                metadata: { severity: 'critical', defectType: 'Surface damage', batchNumber: 'PROD-2025-001' }
            },
            {
                user: users[0]._id,
                action: 'inspection_completed',
                description: `Completed inspection for batch PROD-2025-001 - 3 defects found`,
                metadata: { batchNumber: 'PROD-2025-001', defectsFound: 3, status: 'completed' }
            },
            {
                user: users[2] ? users[2]._id : users[0]._id,
                action: 'product_created',
                description: `Added new product "Premium Widget Model X" to quality control`,
                metadata: { productName: 'Premium Widget Model X', category: 'Electronics' }
            },
            {
                user: users[1] ? users[1]._id : users[0]._id,
                action: 'user_updated',
                description: `Updated user profile settings`,
                metadata: { updatedFields: ['email', 'department'] }
            },
            {
                user: users[0]._id,
                action: 'report_generated',
                description: `Generated quality metrics report for Q1 2025`,
                metadata: { reportType: 'quarterly', period: 'Q1 2025' }
            },
            {
                user: users[2] ? users[2]._id : users[0]._id,
                action: 'batch_processed',
                description: `Processed batch PROD-2025-002 with 0 defects`,
                metadata: { batchNumber: 'PROD-2025-002', defectsFound: 0, processTime: '45 minutes' }
            }
        ];

        // Create activities with staggered timestamps
        for (let i = 0; i < sampleActivities.length; i++) {
            const activity = sampleActivities[i];
            const createdActivity = await Activity.create({
                ...activity,
                createdAt: new Date(Date.now() - (i * 10 * 60 * 1000)) // Each activity 10 minutes apart
            });
            console.log(`Created activity: ${activity.description}`);
        }

        console.log('Successfully seeded activities!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding activities:', error);
        process.exit(1);
    }
};

seedActivities();
