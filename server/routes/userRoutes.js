import express from "express";
import {
    signUpUser,
    signInUser,
    getAllUsers,
    updateUser,
    authCheck,
    logoutUser
} from '../controller/userController.js'
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

router.post('/signup', signUpUser)
router.post('/signin', signInUser)
router.get('/allusers', getAllUsers)
router.put('/update/:id', updateUser)
router.get('/auth',verifyToken, authCheck)
router.get('/logout', logoutUser)


export default router