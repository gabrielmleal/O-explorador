/**
 * User Model
 * Basic user model structure for future authentication implementation
 */

class User {
  constructor(data = {}) {
    this.id = data.id || null;
    this.username = data.username || '';
    this.email = data.email || '';
    this.password = data.password || '';
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Validate user data
   */
  validate() {
    const errors = [];
    
    if (!this.username || this.username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }
    
    if (!this.email || !this.isValidEmail(this.email)) {
      errors.push('Please provide a valid email address');
    }
    
    if (!this.password || this.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Check if email format is valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Convert to safe object (without password)
   */
  toSafeObject() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = User;