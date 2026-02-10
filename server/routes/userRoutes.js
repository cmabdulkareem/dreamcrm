import express from "express";
import {
    signUpUser,
    signInUser,
    getAllUsers,
    updateUser,
    assignRoles,
    authCheck,
    logoutUser,
    getUsersForDropdown,
    markUserOnlineStatus,
    markUserOfflineStatus,
    handleOfflineBeacon,
    getOnlineUsers,
    deleteUser,
    forgotPassword,
    resetPassword,
    changePassword,
    getUserUsageStats
} from '../controller/userController.js'
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

router.post('/signup', signUpUser)
router.post('/signin', signInUser)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/change-password', verifyToken, changePassword) // Add change password route
router.get('/allusers', verifyToken, getAllUsers)
router.get('/dropdown', verifyToken, getUsersForDropdown)
router.put('/update/:id', verifyToken, updateUser)
router.patch('/assign-roles/:id', verifyToken, assignRoles)
router.delete('/delete/:id', verifyToken, deleteUser) // Add delete user route
router.get('/auth', verifyToken, authCheck)
router.get('/logout', verifyToken, logoutUser)
router.get('/usage-stats', verifyToken, getUserUsageStats)


// Online status routes
router.post('/online', verifyToken, markUserOnlineStatus)
router.delete('/online', verifyToken, markUserOfflineStatus)
router.post('/offline-beacon', express.json(), handleOfflineBeacon)
router.get('/online', verifyToken, getOnlineUsers)

export default router