const { validationResult } = require('express-validator');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

const productController = {
    // GET /products - Hiển thị danh sách sản phẩm
    index: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 12;
            const search = req.query.search || '';
            const supplier = req.query.supplier || '';
            const sortBy = req.query.sortBy || 'name';
            const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
            const minPrice = parseFloat(req.query.minPrice) || 0;
            const maxPrice = parseFloat(req.query.maxPrice) || 0;
            const inStock = req.query.inStock === 'true';

            const skip = (page - 1) * limit;

            // Build query
            let query = {};
            
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { sku: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            if (supplier) {
                query.supplier = supplier;
            }

            if (minPrice > 0 || maxPrice > 0) {
                query.price = {};
                if (minPrice > 0) query.price.$gte = minPrice;
                if (maxPrice > 0) query.price.$lte = maxPrice;
            }

            if (inStock) {
                query.quantity = { $gt: 0 };
            }

            const products = await Product.find(query)
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(limit)
                .populate('supplier', 'name address phone')
                .populate('createdBy', 'username email')
                .populate('updatedBy', 'username email');

            const total = await Product.countDocuments(query);
            const totalPages = Math.ceil(total / limit);

            // Lấy danh sách suppliers cho filter
            const suppliers = await Supplier.getActiveSuppliers();

            res.render('products/index', {
                title: 'Quản lý sản phẩm',
                products,
                suppliers,
                pagination: {
                    current: page,
                    total: totalPages,
                    limit,
                    skip,
                    totalRecords: total
                },
                query: { 
                    search, 
                    supplier, 
                    sortBy, 
                    sortOrder, 
                    limit, 
                    minPrice, 
                    maxPrice, 
                    inStock 
                }
            });

        } catch (error) {
            console.error('Product index error:', error);
            req.flash('error', 'Có lỗi xảy ra khi tải danh sách sản phẩm');
            res.render('products/index', {
                title: 'Quản lý sản phẩm',
                products: [],
                suppliers: [],
                pagination: { current: 1, total: 0 },
                query: {}
            });
        }
    },

    // GET /products/new - Hiển thị form tạo sản phẩm mới
    new: async (req, res) => {
        try {
            const suppliers = await Supplier.getActiveSuppliers();
            
            res.render('products/new', {
                title: 'Thêm sản phẩm mới',
                formData: null,
                suppliers
            });

        } catch (error) {
            console.error('Product new form error:', error);
            req.flash('error', 'Có lỗi xảy ra');
            res.redirect('/products');
        }
    },

    // POST /products - Tạo sản phẩm mới
    create: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorMessages = errors.array().map(error => error.msg);
                req.flash('error', errorMessages.join(', '));
                const suppliers = await Supplier.getActiveSuppliers();
                return res.render('products/new', {
                    title: 'Thêm sản phẩm mới',
                    formData: req.body,
                    suppliers
                });
            }

            const { name, price, quantity, supplier, description } = req.body;

            // Kiểm tra supplier tồn tại
            const supplierDoc = await Supplier.findById(supplier);
            if (!supplierDoc) {
                req.flash('error', 'Nhà cung cấp không tồn tại');
                const suppliers = await Supplier.getActiveSuppliers();
                return res.render('products/new', {
                    title: 'Thêm sản phẩm mới',
                    formData: req.body,
                    suppliers
                });
            }

            // Kiểm tra trùng lặp tên sản phẩm trong cùng nhà cung cấp
            const existingProduct = await Product.findOne({
                name: name.trim(),
                supplier: supplier
            });

            if (existingProduct) {
                req.flash('error', 'Sản phẩm với tên này đã tồn tại trong nhà cung cấp này');
                const suppliers = await Supplier.getActiveSuppliers();
                return res.render('products/new', {
                    title: 'Thêm sản phẩm mới',
                    product: req.body,
                    suppliers
                });
            }

            const product = new Product({
                name: name.trim(),
                price: parseFloat(price),
                quantity: parseInt(quantity),
                supplier: supplier,
                description: description ? description.trim() : '',
                createdBy: req.user._id
            });

            await product.save();

            req.flash('success', 'Thêm sản phẩm thành công!');
            res.redirect('/products');

        } catch (error) {
            console.error('Product create error:', error);
            req.flash('error', 'Có lỗi xảy ra: ' + error.message);
            const suppliers = await Supplier.getActiveSuppliers();
            res.render('products/new', {
                title: 'Thêm sản phẩm mới',
                formData: req.body,
                suppliers
            });
        }
    },

    // GET /products/:id - Hiển thị chi tiết sản phẩm
    show: async (req, res) => {
        try {
            const product = await Product.findById(req.params.id)
                .populate('supplier', 'name address phone email')
                .populate('createdBy', 'username email createdAt')
                .populate('updatedBy', 'username email');

            if (!product) {
                req.flash('error', 'Không tìm thấy sản phẩm');
                return res.redirect('/products');
            }

            res.render('products/show', {
                title: `Sản phẩm: ${product.name}`,
                product
            });

        } catch (error) {
            console.error('Product show error:', error);
            req.flash('error', 'Có lỗi xảy ra khi tải thông tin sản phẩm');
            res.redirect('/products');
        }
    },

    // GET /products/:id/edit - Hiển thị form chỉnh sửa
    edit: async (req, res) => {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) {
                req.flash('error', 'Không tìm thấy sản phẩm');
                return res.redirect('/products');
            }

            const suppliers = await Supplier.getActiveSuppliers();

            res.render('products/edit', {
                title: `Chỉnh sửa sản phẩm: ${product.name}`,
                product,
                suppliers
            });

        } catch (error) {
            console.error('Product edit form error:', error);
            req.flash('error', 'Có lỗi xảy ra');
            res.redirect('/products');
        }
    },

    // PUT /products/:id - Cập nhật sản phẩm
    update: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorMessages = errors.array().map(error => error.msg);
                req.flash('error', errorMessages.join(', '));
                const product = await Product.findById(req.params.id);
                const suppliers = await Supplier.getActiveSuppliers();
                return res.render('products/edit', {
                    title: `Chỉnh sửa sản phẩm: ${product.name}`,
                    product: { ...product.toObject(), ...req.body },
                    suppliers
                });
            }

            const { name, price, quantity, supplier, description } = req.body;

            const product = await Product.findById(req.params.id);
            if (!product) {
                req.flash('error', 'Không tìm thấy sản phẩm');
                return res.redirect('/products');
            }

            // Kiểm tra supplier tồn tại
            const supplierDoc = await Supplier.findById(supplier);
            if (!supplierDoc) {
                req.flash('error', 'Nhà cung cấp không tồn tại');
                const suppliers = await Supplier.getActiveSuppliers();
                return res.render('products/edit', {
                    title: `Chỉnh sửa sản phẩm: ${product.name}`,
                    product: { ...product.toObject(), ...req.body },
                    suppliers
                });
            }

            // Kiểm tra trùng lặp tên (trừ chính nó)
            const existingProduct = await Product.findOne({
                _id: { $ne: req.params.id },
                name: name.trim(),
                supplier: supplier
            });

            if (existingProduct) {
                req.flash('error', 'Sản phẩm với tên này đã tồn tại trong nhà cung cấp này');
                const suppliers = await Supplier.getActiveSuppliers();
                return res.render('products/edit', {
                    title: `Chỉnh sửa sản phẩm: ${product.name}`,
                    product: { ...product.toObject(), ...req.body },
                    suppliers
                });
            }

            product.name = name.trim();
            product.price = parseFloat(price);
            product.quantity = parseInt(quantity);
            product.supplier = supplier;
            product.description = description ? description.trim() : '';
            product.updatedBy = req.user._id;

            await product.save();

            req.flash('success', 'Cập nhật sản phẩm thành công!');
            res.redirect('/products/' + product._id);

        } catch (error) {
            console.error('Product update error:', error);
            req.flash('error', 'Có lỗi xảy ra: ' + error.message);
            const product = await Product.findById(req.params.id);
            const suppliers = await Supplier.getActiveSuppliers();
            res.render('products/edit', {
                title: `Chỉnh sửa sản phẩm: ${product.name}`,
                product: { ...product.toObject(), ...req.body },
                suppliers
            });
        }
    },

    // DELETE /products/:id - Xóa sản phẩm
    delete: async (req, res) => {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) {
                req.flash('error', 'Không tìm thấy sản phẩm');
                return res.redirect('/products');
            }

            await Product.findByIdAndDelete(req.params.id);

            req.flash('success', 'Xóa sản phẩm thành công!');
            res.redirect('/products');

        } catch (error) {
            console.error('Product delete error:', error);
            req.flash('error', 'Có lỗi xảy ra khi xóa sản phẩm');
            res.redirect('/products');
        }
    },

    // GET /api/products/search - API tìm kiếm sản phẩm (cho AJAX)
    search: async (req, res) => {
        try {
            const { q, supplier } = req.query;
            const products = await Product.searchProducts(q, supplier, 10);
            
            res.json({
                success: true,
                data: products.map(product => ({
                    id: product._id,
                    name: product.name,
                    sku: product.sku,
                    price: product.price,
                    quantity: product.quantity,
                    formattedPrice: product.formattedPrice,
                    stockStatus: product.stockStatus,
                    supplier: product.supplier ? {
                        id: product.supplier._id,
                        name: product.supplier.name
                    } : null
                }))
            });

        } catch (error) {
            console.error('Product search API error:', error);
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi tìm kiếm'
            });
        }
    },

    // GET /api/products/by-supplier/:supplierId - API lấy sản phẩm theo nhà cung cấp
    getBySupplier: async (req, res) => {
        try {
            const { supplierId } = req.params;
            const products = await Product.getProductsBySupplier(supplierId);
            
            res.json({
                success: true,
                data: products.map(product => ({
                    id: product._id,
                    name: product.name,
                    sku: product.sku,
                    price: product.price,
                    quantity: product.quantity,
                    formattedPrice: product.formattedPrice,
                    stockStatus: product.stockStatus
                }))
            });

        } catch (error) {
            console.error('Get products by supplier error:', error);
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi tải sản phẩm'
            });
        }
    },

    // GET /products/statistics - Hiển thị thống kê sản phẩm
    statistics: async (req, res) => {
        try {
            const stats = await Product.getStatistics();
            const lowStockProducts = await Product.find({ quantity: { $lte: 5 } })
                .populate('supplier', 'name')
                .sort({ quantity: 1 })
                .limit(10);

            res.render('products/statistics', {
                title: 'Thống kê sản phẩm',
                stats,
                lowStockProducts
            });

        } catch (error) {
            console.error('Product statistics error:', error);
            req.flash('error', 'Có lỗi xảy ra khi tải thống kê');
            res.redirect('/products');
        }
    }
};

module.exports = productController;