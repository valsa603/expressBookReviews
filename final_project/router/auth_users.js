const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

// Pre-populate with a test user so login works immediately on server restart
users.push({ username: "vani63", password: "12345" });

// Helper function to check if the username already exists
const isValid = (username) => {
    let userswithsameusername = users.filter((user) => user.username === username);
    return userswithsameusername.length > 0;
}

// Helper function to check if username and password match database records
const authenticatedUser = (username, password) => {
    let validusers = users.filter((user) => user.username === username && user.password === password);
    return validusers.length > 0;
}

// Route: Registered users can login
regd_users.post("/login", (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    if (!username || !password) {
        return res.status(404).json({ message: "Error logging in: Missing credentials" });
    }

    if (authenticatedUser(username, password)) {
        // Generate JSON Web Token using 'access' secret key string
        let accessToken = jwt.sign({
            data: username
        }, "fingerprint_customer", { expiresIn: 60 * 60 });

        // Secure token and username session mapping
        req.session.authorization = {
            accessToken,
            username
        };

        return res.status(200).json({ message: "User successfully logged in" });
    } else {
        return res.status(208).json({ message: "Invalid Login. Check username and password" });
    }
});

// Route: Add or modify a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    let isbn = req.params.isbn;
    let review = req.query.review;
console.log(req.session);
console.log(req.session.authorization);
    // Safety check ensuring active session details are mapped
    if (req.session && req.session.authorization) {
        let username = req.session.authorization.username;
        
        if (books[isbn]) {
            // Store the review string mapped directly under the username key string
            books[isbn].reviews[username] = review;
            return res.status(200).json({ message: "Review added/modified successfully" });
        } else {
            return res.status(404).json({ message: "Book not found" });
        }
    } else {
        return res.status(403).json({ message: "User not authenticated" });
    }
});
regd_users.delete("/auth/review/:isbn", (req, res) => {
    let isbn = req.params.isbn;

    if (req.session && req.session.authorization) {
        let username = req.session.authorization.username;

        if (books[isbn]) {
            delete books[isbn].reviews[username];

            return res.status(200).json({
                message: "Review deleted successfully"
            });
        } else {
            return res.status(404).json({
                message: "Book not found"
            });
        }
    } else {
        return res.status(403).json({
            message: "User not authenticated"
        });
    }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;