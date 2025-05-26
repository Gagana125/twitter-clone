import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

export const getUserProfile = async (req, res) => {
    const {username} = req.params;
    try {
        const user = await User.findOne({username}).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json(user);

    } catch (error) {   
        console.error("Error in getUserProfile:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const followUnfollowUser = async (req, res) => {
    try{
        const { id } = req.params;
        const userToModify = await User.findById(id); // The user making the request
        const currentUser = await User.findById(req.user._id); // The user to be modified
        if (id === req.user._id.toString()) {
            return res.status(400).json({ error: "You cannot follow/unfollow yourself" });
        }
        if (!userToModify || !currentUser) {
            return res.status(404).json({ error: "User not found" });
        }

        const isFollowing = currentUser.following.includes(id);
        if (isFollowing) {
            // Unfollow the user
            await User.findByIdAndUpdate(id, {$pull: {followers: req.user._id}});
            await User.findByIdAndUpdate(req.user._id, {$pull: {following: id}});
            res.status(200).json({ message: "Unfollowed successfully" });
        } else {
            // Follow the user
            await User.findByIdAndUpdate(id, {$push: {followers: req.user._id}});
            await User.findByIdAndUpdate(req.user._id, {$push: {following: id}});

            const newNotification = new Notification ({
                from : req.user._id,
                to : userToModify._id,
                type : "follow"
            });
            await newNotification.save();

            res.status(200).json({ message: "Followed successfully" });
        }
    }  catch (error) {
        console.error("Error in followUnfollowUser:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getSuggestedUsers = async (req, res) => {
    try {
        const userId = req.user._id;
        const usersFollowing = await User.findById(userId).select("following");

        const users = await User.aggregate([
            {
                $match: {
                    _id: { $ne: userId}
                }
            },
            {
                $sample: { size: 10 } // Randomly select 10 users
            }
        ])

        const filteredUsers = users.filter(user => !usersFollowing.following.includes(user._id.toString()));
        const suggestedUsers = filteredUsers.slice(0, 4);
        suggestedUsers.forEach(user => user.password = null);
        res.status(200).json(suggestedUsers);

    } catch (error) {
        console.error("Error in getSuggestedUsers:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const updateUser = async (req, res) => {
    const {fullName, email, username, currentPassword, newPassword, bio, link} = req.body;
    let {profileImg, coverImg} = req.body;
    const userId = req.user._id;
    try {
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if( (!newPassword && currentPassword) || (!currentPassword && newPassword) ) {
            return res.status(400).json({ error: "Both current and new passwords must be provided" });
        }

        if( currentPassword && newPassword ) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: "Current password is incorrect" });
            }
            if(newPassword.length < 6) {
                return res.status(400).json({ error: "New password must be at least 6 characters long" });
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        if (profileImg) {
            if(user.profileImg) {
                // Delete the old profile image from Cloudinary
                const publicId = user.profileImg.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            }
            const uploadedResponse = await cloudinary.uploader.upload(profileImg);
            profileImg = uploadedResponse.secure_url;
        }

        if (coverImg) {
            if(user.coverImg) {
                // Delete the old profile image from Cloudinary
                const publicId = user.coverImg.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            }
            const uploadedResponse = await cloudinary.uploader.upload(coverImg);
            coverImg = uploadedResponse.secure_url;
        }

        user.fullName = fullName || user.fullName;
        user.email = email || user.email;
        user.username = username || user.username;
        user.profileImg = profileImg || user.profileImg;
        user.coverImg = coverImg || user.coverImg;
        user.bio = bio || user.bio;
        user.link = link || user.link;

        user = await user.save();
        user.password = null; // Remove password from response
        res.status(200).json(user);

    } catch (error) {
        console.error("Error in updateUser:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}