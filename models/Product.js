const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên sản phẩm là bắt buộc'],
        trim: true,
        maxlength: [100, 'Tên sản phẩm không được vượt quá 100 ký tự'],
        minlength: [2, 'Tên sản phẩm phải có ít nhất 2 ký tự']
    },
    price: {
        type: Number,
        required: [true, 'Giá sản phẩm là bắt buộc'],
        min: [0, 'Giá sản phẩm phải lớn hơn hoặc bằng 0'],
        validate: {
            validator: function(value) {
                return Number.isFinite(value) && value >= 0;
            },
            message: 'Giá sản phẩm phải là số hợp lệ'
        }
    },
    quantity: {
        type: Number,
        required: [true, 'Số lượng là bắt buộc'],
        min: [0, 'Số lượng phải lớn hơn hoặc bằng 0'],
        validate: {
            validator: function(value) {
                return Number.isInteger(value) && value >= 0;
            },
            message: 'Số lượng phải là số nguyên không âm'
        }
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: [true, 'Nhà cung cấp là bắt buộc']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Mô tả không được vượt quá 500 ký tự']
    },
    image: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        trim: true,
        maxlength: [50, 'Danh mục không được vượt quá 50 ký tự']
    },
    sku: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        maxlength: [20, 'SKU không được vượt quá 20 ký tự']
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
productSchema.index({ name: 1 });
productSchema.index({ supplier: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ price: 1 });
productSchema.index({ category: 1 });

// Virtual để format giá tiền
productSchema.virtual('formattedPrice').get(function() {
    if (this.price === undefined || this.price === null) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(this.price);
});

// Virtual để tính tổng giá trị
productSchema.virtual('totalValue').get(function() {
    return this.price * this.quantity;
});

// Virtual để format tổng giá trị
productSchema.virtual('formattedTotalValue').get(function() {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(this.totalValue);
});

// Virtual để hiển thị trạng thái kho
productSchema.virtual('stockStatus').get(function() {
    if (this.quantity === 0) return 'Hết hàng';
    if (this.quantity <= 10) return 'Sắp hết';
    return 'Còn hàng';
});

// Virtual để hiển thị class CSS cho trạng thái
productSchema.virtual('stockStatusClass').get(function() {
    if (this.quantity === 0) return 'danger';
    if (this.quantity <= 10) return 'warning';
    return 'success';
});

// Method để lấy thông tin tóm tắt
productSchema.methods.getSummary = function() {
    return {
        id: this._id,
        name: this.name,
        price: this.formattedPrice,
        quantity: this.quantity,
        stockStatus: this.stockStatus,
        supplier: this.supplier ? this.supplier.name : 'N/A'
    };
};

// Static method để tìm kiếm sản phẩm
productSchema.statics.searchProducts = function(keyword) {
    const regex = new RegExp(keyword, 'i');
    return this.find({
        isActive: true,
        $or: [
            { name: regex },
            { description: regex },
            { category: regex },
            { sku: regex }
        ]
    }).populate('supplier', 'name');
};

// Static method để lấy sản phẩm theo supplier
productSchema.statics.getProductsBySupplier = function(supplierId) {
    return this.find({ 
        supplier: supplierId, 
        isActive: true 
    }).populate('supplier', 'name');
};

// Static method để lấy sản phẩm active
productSchema.statics.getActiveProducts = function() {
    return this.find({ isActive: true })
        .populate('supplier', 'name')
        .sort({ createdAt: -1 });
};

// Static method để thống kê
productSchema.statics.getStats = function() {
    return this.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: null,
                totalProducts: { $sum: 1 },
                totalValue: { $sum: { $multiply: ['$price', '$quantity'] } },
                avgPrice: { $avg: '$price' },
                totalQuantity: { $sum: '$quantity' },
                outOfStock: {
                    $sum: { $cond: [{ $eq: ['$quantity', 0] }, 1, 0] }
                },
                lowStock: {
                    $sum: { $cond: [{ $and: [{ $gt: ['$quantity', 0] }, { $lte: ['$quantity', 10] }] }, 1, 0] }
                }
            }
        }
    ]);
};

// Middleware để populate supplier khi query
productSchema.pre(/^find/, function(next) {
    this.populate('supplier', 'name phone address')
        .populate('createdBy', 'username email')
        .populate('updatedBy', 'username email');
    next();
});

// Auto-generate SKU nếu chưa có
productSchema.pre('save', function(next) {
    if (!this.sku && this.isNew) {
        this.sku = 'PRD' + Date.now().toString().slice(-8);
    }
    next();
});

// Đảm bảo virtuals được serialize
productSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;