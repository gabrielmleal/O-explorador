// Simple in-memory user model for the E2E test
// In a real application, this would connect to a database

class User {
    constructor() {
        this.users = new Map(); // In-memory storage
        this.currentId = 1;
    }

    // Create a new user
    create(userData) {
        const user = {
            id: this.currentId++,
            username: userData.username,
            email: userData.email,
            password: userData.password, // Will be hashed in Task 2
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.users.set(user.id, user);
        return user;
    }

    // Find user by email
    findByEmail(email) {
        for (let user of this.users.values()) {
            if (user.email === email) {
                return user;
            }
        }
        return null;
    }

    // Find user by username
    findByUsername(username) {
        for (let user of this.users.values()) {
            if (user.username === username) {
                return user;
            }
        }
        return null;
    }

    // Find user by ID
    findById(id) {
        return this.users.get(parseInt(id));
    }

    // Update user
    update(id, updateData) {
        const user = this.users.get(parseInt(id));
        if (!user) {
            return null;
        }

        const updatedUser = {
            ...user,
            ...updateData,
            updatedAt: new Date().toISOString()
        };

        this.users.set(parseInt(id), updatedUser);
        return updatedUser;
    }

    // Delete user
    delete(id) {
        return this.users.delete(parseInt(id));
    }

    // Get all users (for debugging/admin purposes)
    findAll() {
        return Array.from(this.users.values());
    }
}

// Export a singleton instance
module.exports = new User();