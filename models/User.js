const bcrypt = require('bcryptjs');
const database = require('./database');

class User {
    constructor(data) {
        this.id = data.id;
        this.username = data.username;
        this.email = data.email;
        this.password_hash = data.password_hash;
        this.first_name = data.first_name;
        this.last_name = data.last_name;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Create a new user
    static async create(userData) {
        return new Promise((resolve, reject) => {
            const { username, email, password, first_name, last_name } = userData;
            
            // Hash password
            bcrypt.hash(password, 10, (err, hash) => {
                if (err) {
                    return reject(err);
                }

                const query = `
                    INSERT INTO users (username, email, password_hash, first_name, last_name)
                    VALUES (?, ?, ?, ?, ?)
                `;

                database.getConnection().run(query, [username, email, hash, first_name, last_name], function(err) {
                    if (err) {
                        return reject(err);
                    }
                    
                    User.findById(this.lastID).then(resolve).catch(reject);
                });
            });
        });
    }

    // Find user by ID
    static async findById(id) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM users WHERE id = ?';
            
            database.getConnection().get(query, [id], (err, row) => {
                if (err) {
                    return reject(err);
                }
                
                if (!row) {
                    return resolve(null);
                }
                
                resolve(new User(row));
            });
        });
    }

    // Find user by username
    static async findByUsername(username) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM users WHERE username = ?';
            
            database.getConnection().get(query, [username], (err, row) => {
                if (err) {
                    return reject(err);
                }
                
                if (!row) {
                    return resolve(null);
                }
                
                resolve(new User(row));
            });
        });
    }

    // Find user by email
    static async findByEmail(email) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM users WHERE email = ?';
            
            database.getConnection().get(query, [email], (err, row) => {
                if (err) {
                    return reject(err);
                }
                
                if (!row) {
                    return resolve(null);
                }
                
                resolve(new User(row));
            });
        });
    }

    // Validate password
    async validatePassword(password) {
        return new Promise((resolve, reject) => {
            bcrypt.compare(password, this.password_hash, (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
            });
        });
    }

    // Update user information
    async update(updateData) {
        return new Promise((resolve, reject) => {
            const fields = [];
            const values = [];

            Object.keys(updateData).forEach(key => {
                if (key !== 'id' && key !== 'password_hash' && updateData[key] !== undefined) {
                    fields.push(`${key} = ?`);
                    values.push(updateData[key]);
                }
            });

            if (fields.length === 0) {
                return resolve(this);
            }

            fields.push('updated_at = CURRENT_TIMESTAMP');
            values.push(this.id);

            const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;

            database.getConnection().run(query, values, (err) => {
                if (err) {
                    return reject(err);
                }

                User.findById(this.id).then(resolve).catch(reject);
            });
        });
    }

    // Get user info (without password)
    toJSON() {
        const { password_hash, ...userInfo } = this;
        return userInfo;
    }
}

module.exports = User;