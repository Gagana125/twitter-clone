import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateNewTokenAndCookie } from "../lib/utils/generateTokens.js";
import jwt from "jsonwebtoken";

export const signup = async (req, res) => {
    try{
        const {username, fullName, password, email} = req.body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: "Username already exists" });
        }

        const existingUEmail = await User.findOne({ email });
        if (existingUEmail) {
            return res.status(400).json({ error: "Email already exists" });
        }

        if(password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters long" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            fullName,
            password: hashedPassword,
            email,
        });

        if(newUser) {
            generateNewTokenAndCookie(newUser._id, res)
            await newUser.save();
            res.status(201).json({
                _id: newUser._id,
                username: newUser.username,
                fullName: newUser.fullName,
                email: newUser.email,
                profileImg: newUser.profileImg,
                coverImg: newUser.coverImg,
                followers: newUser.followers,
                following: newUser.following,
            })
        } else {
            res.status(400).json({ error: "Invalid user data" });
        }

    } catch(error) {
        console.error("Error during signup:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const login = async (req, res) => {
    try {
        const {username, password} = req.body;
        // if (!username || !password) {
        //     return res.status(400).json({ error: "Username and password are required" });
        // }
        const user = await User.findOne({ username})
        const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");
        if (!user || !isPasswordCorrect) {
            return res.status(400).json({ error: "Invalid username or password" });
        }

        generateNewTokenAndCookie(user._id, res);
        res.status(200).json({
            _id: user._id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            profileImg: user.profileImg,
            coverImg: user.coverImg,
            followers: user.followers,
            following: user.following,
        });

    } catch(error) {
        console.error("Error during login:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const logout = async (req, res) => {
    try{
        res.cookie("jwt", "", {maxAge: 0})
        res.status(200).json({ message: "Logged out successfully" });

    } catch(error) {
        console.error("Error during logout:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getMe = async (req, res) => {
    try {
        const userId = await User.findById(req.user._id).select("-password");
        res.status(200).json(userId);
    } catch (error) {   
        console.error("Error in getMe controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}