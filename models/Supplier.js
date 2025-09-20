const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên nhà cung cấp là bắt buộc'],
        trim: true,
        maxlength: [100, 'Tên nhà cung cấp không được vượt quá 100 ký tự'],
        minlength: [2, 'Tên nhà cung cấp phải có ít nhất 2 ký tự']
    },
    address: {
        type: String,
        required: [true, 'Địa chỉ là bắt buộc'],
        trim: true,
        maxlength: [200, 'Địa chỉ không được vượt quá 200 ký tự'],
        minlength: [5, 'Địa chỉ phải có ít nhất 5 ký tự']
    },
    phone: {
        type: String,
        required: [true, 'Số điện thoại là bắt buộc'],
        trim: true,
        match: [/^[0-9]{10,11}$/, 'Số điện thoại phải có 10-11 chữ số']
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Mô tả không được vượt quá 500 ký tự']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Index cho tìm kiếm và hiệu suất
supplierSchema.index({ name: 1 });
supplierSchema.index({ isActive: 1 });
supplierSchema.index({ createdAt: -1 });

// Virtual để format phone number
supplierSchema.virtual('formattedPhone').get(function() {
    if (this.phone && this.phone.length === 10) {
        return this.phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    return this.phone;
});

// Virtual để tính số lượng sản phẩm
supplierSchema.virtual('productCount', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'supplier',
    count: true
});

// Method để lấy thông tin tóm tắt
supplierSchema.methods.getSummary = function() {
    return {
        id: this._id,
        name: this.name,
        phone: this.formattedPhone,
        isActive: this.isActive
    };
};

// Static method để tìm kiếm supplier
supplierSchema.statics.searchSuppliers = function(keyword) {
    const regex = new RegExp(keyword, 'i');
    return this.find({
        isActive: true,
        $or: [
            { name: regex },
            { address: regex },
            { phone: regex }
        ]
    });
};

// Static method để lấy suppliers active
supplierSchema.statics.getActiveSuppliers = function() {
    return this.find({ isActive: true }).sort({ name: 1 });
};

// Middleware để populate thông tin user khi query
supplierSchema.pre(/^find/, function(next) {
    this.populate('createdBy', 'username email')
        .populate('updatedBy', 'username email');
    next();
});

// Đảm bảo virtuals được serialize
supplierSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;