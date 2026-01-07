
// Mock helpers
const isOwner = (user) => user && (user.role === 'Owner');
const isManager = (user) => user && (user.role === 'Manager' || user.role === 'Brand Manager');
const isAdmin = (user) => user && (user.role === 'Admin');

// --- BATCH CONTROLLER LOGIC TEST ---
function testBatchAuth(user, batch, action) {
    console.log(`Testing ${action} for User: ${user.fullName} (${user.role}), Batch Instructor: ${batch.instructorName}`);

    // Logic from controller
    if (!isAdmin(user) && !isOwner(user) && !isManager(user)) {
        const isAssignedInstructor = (batch.instructor && batch.instructor.toString() === user._id.toString()) ||
            batch.instructorName === user.fullName;

        if (!isAssignedInstructor) {
            console.log("-> Access DENIED");
            return false;
        }
    }
    console.log("-> Access GRANTED");
    return true;
}

// --- CALL LIST CONTROLLER LOGIC TEST ---
function testCallListQuery(user, brandFilter) {
    console.log(`Testing Call List Query for User: ${user.fullName} (${user.role})`);

    const req = { user, brandFilter };
    let finalQuery;

    if (!isOwner(user) && !isManager(user)) {
        finalQuery = { assignedTo: user.id };
    } else {
        finalQuery = {
            $or: [
                req.brandFilter || {},
                { assignedTo: user.id }
            ]
        };
    }

    console.log("-> Final Query:", JSON.stringify(finalQuery));
    return finalQuery;
}

// --- RUN TESTS ---
const userInstructor1 = { _id: "inst1", id: "inst1", fullName: "John Doe", role: "Instructor" };
const userInstructor2 = { _id: "inst2", id: "inst2", fullName: "Jane Smith", role: "Instructor" };
const userCounsellor = { _id: "couns1", id: "couns1", fullName: "Alice", role: "Counsellor" };
const userOwner = { _id: "owner1", id: "owner1", fullName: "Boss", role: "Owner" };

const batch1 = { instructor: "inst1", instructorName: "John Doe" }; // Normal
const batch2 = { instructor: null, instructorName: "John Doe" }; // Missing ID (Legacy/Broken)
const batch3 = { instructor: "inst2", instructorName: "Jane Smith" }; // Other instructor

console.log("--- BATCH VISIBILITY TESTS ---");
testBatchAuth(userInstructor1, batch1, "View Students"); // Should match by ID
testBatchAuth(userInstructor1, batch2, "View Students"); // Should match by Name (Logic Fix)
testBatchAuth(userInstructor1, batch3, "View Students"); // Should Fail

console.log("\n--- CALL LIST ACCESS TESTS ---");
testCallListQuery(userCounsellor, { brand: "BrandA" }); // Should be only { assignedTo: ... }
testCallListQuery(userOwner, { brand: "BrandA" }); // Should be OR query

console.log("\nVerification Complete.");
