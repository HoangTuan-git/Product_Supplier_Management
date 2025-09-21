const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const User = require('../models/User');

const homeController = {
    // GET / - Trang chủ
    index: async (req, res) => {
        try {
            // Handle logout messages from URL params
            const { success, error } = req.query;
            if (success) {
                req.flash('success', success);
            }
            if (error) {
                req.flash('error', error);
            }

            // Lấy thống kê tổng quan
            const totalProducts = await Product.countDocuments();
            const totalSuppliers = await Supplier.countDocuments();
            const totalUsers = await User.countDocuments();
            const lowStockProducts = await Product.countDocuments({ quantity: { $lte: 5 } });

            // Lấy sản phẩm mới nhất
            const latestProducts = await Product.find()
                .populate('supplier', 'name')
                .sort({ createdAt: -1 })
                .limit(8);

            // Lấy danh sách nhà cung cấp cho menu
            const suppliers = await Supplier.getActiveSuppliers();

            // Thống kê theo nhà cung cấp
            const supplierStats = await Product.aggregate([
                {
                    $group: {
                        _id: '$supplier',
                        productCount: { $sum: 1 },
                        totalQuantity: { $sum: '$quantity' },
                        totalValue: { $sum: { $multiply: ['$price', '$quantity'] } }
                    }
                },
                {
                    $lookup: {
                        from: 'suppliers',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'supplier'
                    }
                },
                {
                    $unwind: '$supplier'
                },
                {
                    $sort: { productCount: -1 }
                },
                {
                    $limit: 5
                }
            ]);

            res.render('index', {
                title: 'Trang chủ - Quản lý sản phẩm',
                stats: {
                    totalProducts,
                    totalSuppliers,
                    totalUsers,
                    lowStockProducts
                },
                latestProducts,
                suppliers,
                supplierStats
            });

        } catch (error) {
            console.error('Home index error:', error);
            req.flash('error', 'Có lỗi xảy ra khi tải trang chủ');
            res.render('index', {
                title: 'Trang chủ - Quản lý sản phẩm',
                stats: { totalProducts: 0, totalSuppliers: 0, totalUsers: 0, lowStockProducts: 0 },
                latestProducts: [],
                suppliers: [],
                supplierStats: []
            });
        }
    },

    // GET /search - Tìm kiếm chung
    search: async (req, res) => {
        try {
            const { q, type = 'all', supplier } = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = 12;
            const skip = (page - 1) * limit;

            if (!q || q.trim().length === 0) {
                return res.redirect('/');
            }

            const searchQuery = q.trim();
            let results = {
                products: [],
                suppliers: [],
                total: 0
            };

            if (type === 'all' || type === 'products') {
                const productQuery = {
                    $or: [
                        { name: { $regex: searchQuery, $options: 'i' } },
                        { sku: { $regex: searchQuery, $options: 'i' } },
                        { description: { $regex: searchQuery, $options: 'i' } }
                    ]
                };

                if (supplier) {
                    productQuery.supplier = supplier;
                }

                const products = await Product.find(productQuery)
                    .populate('supplier', 'name')
                    .sort({ name: 1 })
                    .skip(type === 'products' ? skip : 0)
                    .limit(type === 'products' ? limit : 20);

                results.products = products;
                
                if (type === 'products') {
                    results.total = await Product.countDocuments(productQuery);
                }
            }

            if (type === 'all' || type === 'suppliers') {
                const suppliers = await Supplier.find({
                    $or: [
                        { name: { $regex: searchQuery, $options: 'i' } },
                        { address: { $regex: searchQuery, $options: 'i' } },
                        { phone: { $regex: searchQuery, $options: 'i' } }
                    ]
                })
                .sort({ name: 1 })
                .skip(type === 'suppliers' ? skip : 0)
                .limit(type === 'suppliers' ? limit : 10);

                results.suppliers = suppliers;
                
                if (type === 'suppliers') {
                    results.total = await Supplier.countDocuments({
                        $or: [
                            { name: { $regex: searchQuery, $options: 'i' } },
                            { address: { $regex: searchQuery, $options: 'i' } },
                            { phone: { $regex: searchQuery, $options: 'i' } }
                        ]
                    });
                }
            }

            // Lấy danh sách suppliers cho filter
            const allSuppliers = await Supplier.getActiveSuppliers();

            const totalPages = Math.ceil(results.total / limit);

            res.render('search', {
                title: `Kết quả tìm kiếm: "${searchQuery}"`,
                searchQuery,
                results,
                suppliers: allSuppliers,
                pagination: {
                    current: page,
                    total: totalPages,
                    totalRecords: results.total
                },
                query: { q: searchQuery, type, supplier }
            });

        } catch (error) {
            console.error('Search error:', error);
            req.flash('error', 'Có lỗi xảy ra khi tìm kiếm');
            res.redirect('/');
        }
    },

    // GET /suppliers/:id/products - Hiển thị sản phẩm theo nhà cung cấp
    productsBySupplier: async (req, res) => {
        try {
            const { id } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = 12;
            const skip = (page - 1) * limit;
            const search = req.query.search || '';

            const supplier = await Supplier.findById(id);
            if (!supplier) {
                req.flash('error', 'Không tìm thấy nhà cung cấp');
                return res.redirect('/');
            }

            let productQuery = { supplier: id };
            if (search) {
                productQuery.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { sku: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            const products = await Product.find(productQuery)
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit);

            const total = await Product.countDocuments(productQuery);
            const totalPages = Math.ceil(total / limit);

            // Thống kê nhà cung cấp
            const stats = await Product.aggregate([
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

            const supplierStats = stats[0] || {
                totalProducts: 0,
                totalQuantity: 0,
                averagePrice: 0,
                totalValue: 0
            };

            res.render('supplier-products', {
                title: `Sản phẩm của ${supplier.name}`,
                supplier,
                products,
                stats: supplierStats,
                pagination: {
                    current: page,
                    total: totalPages,
                    totalRecords: total
                },
                query: { search }
            });

        } catch (error) {
            console.error('Products by supplier error:', error);
            req.flash('error', 'Có lỗi xảy ra');
            res.redirect('/');
        }
    },

    // GET /about - Trang giới thiệu
    about: (req, res) => {
        res.render('about', {
            title: 'Giới thiệu'
        });
    },

    // GET /contact - Trang liên hệ
    contact: (req, res) => {
        res.render('contact', {
            title: 'Liên hệ'
        });
    },

    // POST /contact - Xử lý form liên hệ
    submitContact: async (req, res) => {
        try {
            const { name, email, subject, message } = req.body;

            // Xử lý form liên hệ (có thể gửi email, lưu database, etc.)
            console.log('Contact form submission:', { name, email, subject, message });

            req.flash('success', 'Cảm ơn bạn đã gửi tin nhắn! Chúng tôi sẽ phản hồi sớm nhất có thể.');
            res.redirect('/contact');

        } catch (error) {
            console.error('Contact form error:', error);
            req.flash('error', 'Có lỗi xảy ra khi gửi tin nhắn');
            res.redirect('/contact');
        }
    }
};

module.exports = homeController;