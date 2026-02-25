import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm';

// Import models
import '../server/model/userModel.js';
import '../server/model/brandModel.js';

const User = mongoose.model('User');
const Brand = mongoose.model('Brand');

// Import middleware helpers
import { hasRole, isAdmin, isManager } from '../server/middleware/roleMiddleware.js';

async function runTest() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Create a test brand
        const testBrand = new Brand({
            name: 'Test Brand Roles',
            code: 'TESTROLES',
            email: 'testroles@example.com'
        });
        await testBrand.save();
        console.log('Created test brand:', testBrand._id);

        // 2. Create a test user with brand-specific roles
        const testUser = new User({
            fullName: 'Test Role User',
            email: 'roleuser@example.com',
            password: 'password123',
            brands: [{
                brand: testBrand._id,
                roles: ['Instructor']
            }]
        });
        await testUser.save();
        console.log('Created test user:', testUser._id);

        // 3. Verify role checks
        console.log('--- Verifying roles for Test User ---');
        console.log('Global role "Instructor":', hasRole(testUser, 'Instructor')); // Should be false (since it's not in user.roles)
        console.log('Brand context "Instructor":', hasRole(testUser, 'Instructor', testBrand._id.toString())); // Should be true

        console.log('Global role "Manager":', isManager(testUser)); // Should be false

        // 4. Update user to have a different role in the brand
        testUser.brands[0].roles = ['Brand Manager'];
        await testUser.save();
        console.log('Updated user roles in brand to [Brand Manager]');

        console.log('Brand context "Manager" (isManager):', isManager(testUser, testBrand._id.toString())); // Should be true
        console.log('Brand context "Instructor":', hasRole(testUser, 'Instructor', testBrand._id.toString())); // Should be false

        // 5. Cleanup
        await User.findByIdAndDelete(testUser._id);
        await Brand.findByIdAndDelete(testBrand._id);
        console.log('Cleanup completed');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

runTest();
