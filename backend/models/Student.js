const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    rollNo: { type: String, required: true, unique: true },
    college: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
    year: { type: Number },
    sem: { type: Number },
    status: { type: String, enum: ['Active', 'Inactive', 'Graduated'], default: 'Active' },
    section: { type: String },
    contact: {
        email: { type: String },
        phone: { type: String }
    }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
