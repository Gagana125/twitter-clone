import jwt from "jsonwebtoken";

export const generateNewTokenAndCookie = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "15d", // Token expiration time
    });

    res.cookie("jwt", token, {
        httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
        maxAge: 15 * 24 * 60 * 60 * 1000, // Cookie expiration time (15 days)
        sameSite: "strict", // Helps prevent CSRF attacks
        secure: process.env.NODE_ENV !== "development", // Use secure cookies in production
})
}