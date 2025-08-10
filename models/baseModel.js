// Base model with common functionality
// Note: This is a simple in-memory model for demonstration
// In production, this would connect to a database

class BaseModel {
    constructor() {
        this.data = new Map();
        this.nextId = 1;
    }

    // Generate unique ID
    generateId() {
        return this.nextId++;
    }

    // Create a new record
    create(data) {
        const id = this.generateId();
        const record = {
            id: id,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.data.set(id, record);
        return record;
    }

    // Find record by ID
    findById(id) {
        return this.data.get(parseInt(id)) || null;
    }

    // Find all records
    findAll() {
        return Array.from(this.data.values());
    }

    // Find record by criteria
    findBy(criteria) {
        const records = this.findAll();
        return records.find(record => {
            return Object.keys(criteria).every(key => {
                return record[key] === criteria[key];
            });
        }) || null;
    }

    // Update record by ID
    update(id, updates) {
        const record = this.findById(id);
        if (!record) return null;

        const updatedRecord = {
            ...record,
            ...updates,
            updatedAt: new Date()
        };
        this.data.set(parseInt(id), updatedRecord);
        return updatedRecord;
    }

    // Delete record by ID
    delete(id) {
        const record = this.findById(id);
        if (!record) return false;

        this.data.delete(parseInt(id));
        return true;
    }

    // Count all records
    count() {
        return this.data.size;
    }

    // Clear all data (useful for testing)
    clear() {
        this.data.clear();
        this.nextId = 1;
    }
}

module.exports = BaseModel;