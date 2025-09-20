const { validationResult } = require('express-validator');
const Supplier = require('../models/Supplier');

const supplierController = {
    // GET /suppliers - Hiển thị danh sách nhà cung cấp
    index: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || '';
            const sortBy = req.query.sortBy || 'name';
            const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

            const skip = (page - 1) * limit;

            let query = {};
            if (search) {
                query = {
                    $or: [
                        { name: { $regex: search, $options: 'i' } },
                        { address: { $regex: search, $options: 'i' } },
                        { phone: { $regex: search, $options: 'i' } }
                    ]
                };
            }

            const suppliers = await Supplier.find(query)
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(limit)
                .populate('createdBy', 'username email')
                .populate('updatedBy', 'username email');

            const total = await Supplier.countDocuments(query);
            const totalPages = Math.ceil(total / limit);

            res.render('suppliers/index', {
                title: 'Quản lý nhà cung cấp',
                suppliers,
                pagination: {
                    current: page,
                    total: totalPages,
                    limit,
                    skip,
                    totalRecords: total
                },
                query: { search, sortBy, sortOrder, limit }
            });

        } catch (error) {
            console.error('Supplier index error:', error);
            req.flash('error', 'Có lỗi xảy ra khi tải danh sách nhà cung cấp');
            res.render('suppliers/index', {
                title: 'Quản lý nhà cung cấp',
                suppliers: [],
                pagination: { current: 1, total: 0 },
                query: {}
            });
        }
    },

    // GET /suppliers/new - Hiển thị form tạo nhà cung cấp mới
    new: (req, res) => {
        res.render('suppliers/new', {
            title: 'Thêm nhà cung cấp mới',
            supplier: {}
        });
    },

    // POST /suppliers - Tạo nhà cung cấp mới
    create: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorMessages = errors.array().map(error => error.msg);
                req.flash('error', errorMessages.join(', '));
                return res.render('suppliers/new', {
                    title: 'Thêm nhà cung cấp mới',
                    supplier: req.body
                });
            }

            const { name, address, phone, description } = req.body;

            // Kiểm tra trùng lặp
            const existingSupplier = await Supplier.findOne({
                $or: [
                    { name: name.trim() },
                    { phone: phone.trim() }
                ]
            });

            if (existingSupplier) {
                req.flash('error', 'Nhà cung cấp với tên hoặc số điện thoại này đã tồn tại');
                return res.render('suppliers/new', {
                    title: 'Thêm nhà cung cấp mới',
                    supplier: req.body
                });
            }

            const supplier = new Supplier({
                name: name.trim(),
                address: address.trim(),
                phone: phone.trim(),
                description: description ? description.trim() : '',
                createdBy: req.user._id
            });

            await supplier.save();

            req.flash('success', 'Thêm nhà cung cấp thành công!');
            res.redirect('/suppliers');

        } catch (error) {
            console.error('Supplier create error:', error);
            req.flash('error', 'Có lỗi xảy ra: ' + error.message);
            res.render('suppliers/new', {
                title: 'Thêm nhà cung cấp mới',
                supplier: req.body
            });
        }
    },

    // GET /suppliers/:id - Hiển thị chi tiết nhà cung cấp
    show: async (req, res) => {
        try {
            const supplier = await Supplier.findById(req.params.id)
                .populate('createdBy', 'username email createdAt')
                .populate('updatedBy', 'username email');

            if (!supplier) {
                req.flash('error', 'Không tìm thấy nhà cung cấp');
                return res.redirect('/suppliers');
            }

            // Lấy thống kê sản phẩm của nhà cung cấp này
            const Product = require('../models/Product');
            const productStats = await Product.aggregate([
                { $match: { supplier: supplier._id } },
                {
                    $group: {
                        _id: null,
                        totalProducts: { $sum: 1 },
                        totalQuantity: { $sum: '$quantity' },
                        averagePrice: { $avg: '$price' },
                        totalValue: { $sum: { $multiply: ['$price', '$quantity'] } }
                    }
                }
            ]);

            const stats = productStats[0] || {
                totalProducts: 0,
                totalQuantity: 0,
                averagePrice: 0,
                totalValue: 0
            };

            res.render('suppliers/show', {
                title: `Nhà cung cấp: ${supplier.name}`,
                supplier,
                stats
            });

        } catch (error) {
            console.error('Supplier show error:', error);
            req.flash('error', 'Có lỗi xảy ra khi tải thông tin nhà cung cấp');
            res.redirect('/suppliers');
        }
    },

    // GET /suppliers/:id/edit - Hiển thị form chỉnh sửa
    edit: async (req, res) => {
        try {
            const supplier = await Supplier.findById(req.params.id);

            if (!supplier) {
                req.flash('error', 'Không tìm thấy nhà cung cấp');
                return res.redirect('/suppliers');
            }

            res.render('suppliers/edit', {
                title: `Chỉnh sửa nhà cung cấp: ${supplier.name}`,
                supplier
            });

        } catch (error) {
            console.error('Supplier edit form error:', error);
            req.flash('error', 'Có lỗi xảy ra');
            res.redirect('/suppliers');
        }
    },

    // PUT /suppliers/:id - Cập nhật nhà cung cấp
    update: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorMessages = errors.array().map(error => error.msg);
                req.flash('error', errorMessages.join(', '));
                const supplier = await Supplier.findById(req.params.id);
                return res.render('suppliers/edit', {
                    title: `Chỉnh sửa nhà cung cấp: ${supplier.name}`,
                    supplier: { ...supplier.toObject(), ...req.body }
                });
            }

            const { name, address, phone, description } = req.body;

            const supplier = await Supplier.findById(req.params.id);
            if (!supplier) {
                req.flash('error', 'Không tìm thấy nhà cung cấp');
                return res.redirect('/suppliers');
            }

            // Kiểm tra trùng lặp (trừ chính nó)
            const existingSupplier = await Supplier.findOne({
                _id: { $ne: req.params.id },
                $or: [
                    { name: name.trim() },
                    { phone: phone.trim() }
                ]
            });

            if (existingSupplier) {
                req.flash('error', 'Nhà cung cấp với tên hoặc số điện thoại này đã tồn tại');
                return res.render('suppliers/edit', {
                    title: `Chỉnh sửa nhà cung cấp: ${supplier.name}`,
                    supplier: { ...supplier.toObject(), ...req.body }
                });
            }

            supplier.name = name.trim();
            supplier.address = address.trim();
            supplier.phone = phone.trim();
            supplier.description = description ? description.trim() : '';
            supplier.updatedBy = req.user._id;

            await supplier.save();

            req.flash('success', 'Cập nhật nhà cung cấp thành công!');
            res.redirect('/suppliers/' + supplier._id);

        } catch (error) {
            console.error('Supplier update error:', error);
            req.flash('error', 'Có lỗi xảy ra: ' + error.message);
            const supplier = await Supplier.findById(req.params.id);
            res.render('suppliers/edit', {
                title: `Chỉnh sửa nhà cung cấp: ${supplier.name}`,
                supplier: { ...supplier.toObject(), ...req.body }
            });
        }
    },

    // DELETE /suppliers/:id - Xóa nhà cung cấp
    delete: async (req, res) => {
        try {
            const supplier = await Supplier.findById(req.params.id);
            if (!supplier) {
                req.flash('error', 'Không tìm thấy nhà cung cấp');
                return res.redirect('/suppliers');
            }

            // Kiểm tra có sản phẩm nào đang sử dụng nhà cung cấp này không
            const Product = require('../models/Product');
            const productCount = await Product.countDocuments({ supplier: supplier._id });

            if (productCount > 0) {
                req.flash('error', `Không thể xóa nhà cung cấp này vì có ${productCount} sản phẩm đang sử dụng`);
                return res.redirect('/suppliers/' + supplier._id);
            }

            await Supplier.findByIdAndDelete(req.params.id);

            req.flash('success', 'Xóa nhà cung cấp thành công!');
            res.redirect('/suppliers');

        } catch (error) {
            console.error('Supplier delete error:', error);
            req.flash('error', 'Có lỗi xảy ra khi xóa nhà cung cấp');
            res.redirect('/suppliers');
        }
    },

    // GET /api/suppliers/search - API tìm kiếm nhà cung cấp (cho AJAX)
    search: async (req, res) => {
        try {
            const { q } = req.query;
            const suppliers = await Supplier.searchSuppliers(q, 10);
            
            res.json({
                success: true,
                data: suppliers.map(supplier => ({
                    id: supplier._id,
                    name: supplier.name,
                    address: supplier.address,
                    phone: supplier.phone
                }))
            });

        } catch (error) {
            console.error('Supplier search API error:', error);
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi tìm kiếm'
            });
        }
    }
};

module.exports = supplierController;