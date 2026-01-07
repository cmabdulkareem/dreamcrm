
import { isManager } from '../utils/roleHelpers.js';

// --- ROLE HELPER TEST ---
console.log("--- ROLE HELPER TESTS ---");
const mgrUser = { roles: ['Manager'] };
const brandMgrUser = { roles: ['Brand Manager'] };
const ownerUser = { roles: ['Owner'] };
const normalUser = { roles: ['Counsellor'] };

console.log("isManager({ roles: ['Manager'] }):", isManager(mgrUser)); // Expected: true
console.log("isManager({ roles: ['Brand Manager'] }):", isManager(brandMgrUser)); // Expected: true
console.log("isManager({ roles: ['Owner'] }):", isManager(ownerUser)); // Expected: true
console.log("isManager({ roles: ['Counsellor'] }):", isManager(normalUser)); // Expected: false

// --- USER DROPDOWN LOGIC TEST (Unrestricted) ---
console.log("\n--- UNRESTRICTED DROPDOWN TEST ---");
function testDropdownLogic(user, queryParams) {
    const { brandId, scope, roles } = queryParams;
    let filteredUsers = ["u1", "u2", "u3"]; // Mock all users

    // Simulation of controller logic
    if (roles) {
        console.log("-> Filtering by roles:", roles);
        // ... filter logic
    } else {
        console.log("-> No role filter applied (returning all users by default)");
    }

    const canAccessGlobal = isManager(user); // Using the imported function
    if (scope === 'global' && canAccessGlobal) {
        console.log("-> Global Scope Access: GRANTED");
        // filteredUsers = users (all)
    } else if (brandId) {
        console.log("-> Filtering by Brand:", brandId);
        // ... filter
    }

    return filteredUsers.length;
}

testDropdownLogic(mgrUser, { scope: 'global' });
// Expected: Global access granted because isManager is true

