const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username là bắt buộc'],
        unique: true,
        trim: true,
        minlength: [3, 'Username phải có ít nhất 3 ký tự'],
        maxlength: [30, 'Username không được vượt quá 30 ký tự'],
        match: [/^[a-zA-Z0-9_]+$/, 'Username chỉ được chứa chữ cái, số và dấu gạch dưới']
    },
    email: {
        type: String,
        required: [true, 'Email là bắt buộc'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
    },
    password: {
        type: String,
        required: [true, 'Mật khẩu là bắt buộc'],
        minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự']
    },
    phone: {
        type: String,
        required: [true, 'Số điện thoại là bắt buộc'],
        trim: true,
        match: [/^[0-9]{10,11}$/, 'Số điện thoại phải có 10-11 chữ số']
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    }
}, {
    timestamps: true
});

// Index cho hiệu suất tìm kiếm
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

// Hash password trước khi lưu
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        this.password = await bcrypt.hash(this.password, rounds);
        next();
    } catch (error) {
        next(error);
    }
});

// Method để so sánh password
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Method để ẩn password khi chuyển đổi sang JSON
userSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.resetPasswordToken;
    delete userObject.resetPasswordExpires;
    return userObject;
};

// Static method để tìm user bằng email hoặc username
userSchema.statics.findByEmailOrUsername = function(identifier) {
    return this.findOne({
        $or: [
            { email: identifier.toLowerCase() },
            { username: identifier }
        ]
    });
};

// Virtual để format phone number
userSchema.virtual('formattedPhone').get(function() {
    if (this.phone && this.phone.length === 10) {
        return this.phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    return this.phone;
});

// Virtual để hiển thị full info
userSchema.virtual('displayName').get(function() {
    return this.username;
});

// Đảm bảo virtuals được serialize
userSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        return ret;
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;