require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('./models/User');
const Supplier = require('./models/Supplier');
const Product = require('./models/Product');

// Kết nối MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/product_supplier_management', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Kết nối MongoDB thành công');
    } catch (error) {
        console.error('❌ Lỗi kết nối MongoDB:', error);
        process.exit(1);
    }
};

// Xóa dữ liệu cũ
const clearDatabase = async () => {
    try {
        await User.deleteMany({});
        await Supplier.deleteMany({});
        await Product.deleteMany({});
        console.log('🗑️ Đã xóa dữ liệu cũ');
    } catch (error) {
        console.error('❌ Lỗi xóa dữ liệu:', error);
    }
};

// Tạo users mẫu
const createUsers = async () => {
    try {
        const users = [
            {
                username: 'admin',
                email: 'admin@example.com',
                password: await bcrypt.hash('Admin123', 10),
                phone: '0123456789',
                role: 'admin'
            },
            {
                username: 'manager',
                email: 'manager@example.com',
                password: await bcrypt.hash('Manager123', 10),
                phone: '0987654321',
                role: 'user'
            },
            {
                username: 'staff',
                email: 'staff@example.com',
                password: await bcrypt.hash('Staff123', 10),
                phone: '0345678901',
                role: 'user'
            }
        ];

        const createdUsers = await User.insertMany(users);
        console.log(`✅ Đã tạo ${createdUsers.length} users`);
        return createdUsers;
    } catch (error) {
        console.error('❌ Lỗi tạo users:', error);
        return [];
    }
};

// Tạo suppliers mẫu
const createSuppliers = async (adminUser) => {
    try {
        const suppliers = [
            {
                name: 'Công ty TNHH Samsung Việt Nam',
                address: '15 Phố Lê Thái Tổ, Hoàn Kiếm, Hà Nội',
                phone: '0241234567',
                email: 'contact@samsung.vn',
                website: 'https://samsung.com',
                description: 'Nhà cung cấp thiết bị điện tử, điện thoại thông minh và thiết bị gia dụng',
                createdBy: adminUser._id
            },
            {
                name: 'Công ty Cổ phần FPT',
                address: '17 Duy Tân, Cầu Giấy, Hà Nội',
                phone: '0242345678',
                email: 'info@fpt.com.vn',
                website: 'https://fpt.com.vn',
                description: 'Cung cấp giải pháp công nghệ thông tin và viễn thông',
                createdBy: adminUser._id
            },
            {
                name: 'Công ty TNHH Apple Việt Nam',
                address: '68 Nguyễn Huệ, Quận 1, TP.HCM',
                phone: '0283456789',
                email: 'support@apple.vn',
                website: 'https://apple.com',
                description: 'Nhà cung cấp thiết bị công nghệ cao và phần mềm',
                createdBy: adminUser._id
            },
            {
                name: 'Tập đoàn Vingroup',
                address: '7 Bằng Lăng 1, Vinhomes Riverside, Long Biên, Hà Nội',
                phone: '0244567890',
                email: 'contact@vingroup.net',
                website: 'https://vingroup.net',
                description: 'Tập đoàn đa ngành với các sản phẩm từ bất động sản đến công nghệ',
                createdBy: adminUser._id
            },
            {
                name: 'Công ty TNHH LG Electronics Việt Nam',
                address: '20 Cộng Hòa, Tân Bình, TP.HCM',
                phone: '0285678901',
                email: 'info@lge.com',
                website: 'https://lg.com',
                description: 'Sản xuất và cung cấp thiết bị gia dụng, điện tử tiêu dùng',
                createdBy: adminUser._id
            }
        ];

        const createdSuppliers = await Supplier.insertMany(suppliers);
        console.log(`✅ Đã tạo ${createdSuppliers.length} suppliers`);
        return createdSuppliers;
    } catch (error) {
        console.error('❌ Lỗi tạo suppliers:', error);
        return [];
    }
};

// Tạo products mẫu
const createProducts = async (suppliers, adminUser) => {
    try {
        const samsungSupplier = suppliers.find(s => s.name.includes('Samsung'));
        const appleSupplier = suppliers.find(s => s.name.includes('Apple'));
        const fptSupplier = suppliers.find(s => s.name.includes('FPT'));
        const lgSupplier = suppliers.find(s => s.name.includes('LG'));
        const vingroupSupplier = suppliers.find(s => s.name.includes('Vingroup'));

        const products = [
            // Samsung products
            {
                name: 'Samsung Galaxy S24 Ultra',
                sku: 'SAM-S24U-001',
                price: 31990000,
                quantity: 25,
                description: 'Điện thoại thông minh cao cấp với camera 200MP, màn hình Dynamic AMOLED 6.8 inch',
                supplier: samsungSupplier._id,
                createdBy: adminUser._id
            },
            {
                name: 'Samsung QLED TV 65 inch',
                sku: 'SAM-TV65-002',
                price: 25990000,
                quantity: 15,
                description: 'Smart TV QLED 4K 65 inch với công nghệ Quantum Dot',
                supplier: samsungSupplier._id,
                createdBy: adminUser._id
            },
            {
                name: 'Samsung Galaxy Watch 6',
                sku: 'SAM-GW6-003',
                price: 7990000,
                quantity: 40,
                description: 'Đồng hồ thông minh với tính năng theo dõi sức khỏe toàn diện',
                supplier: samsungSupplier._id,
                createdBy: adminUser._id
            },

            // Apple products
            {
                name: 'iPhone 15 Pro Max',
                sku: 'APP-IP15PM-001',
                price: 34990000,
                quantity: 20,
                description: 'iPhone cao cấp nhất với chip A17 Pro, camera 48MP và khung Titanium',
                supplier: appleSupplier._id,
                createdBy: adminUser._id
            },
            {
                name: 'MacBook Pro 14 inch M3',
                sku: 'APP-MBP14-002',
                price: 52990000,
                quantity: 10,
                description: 'Laptop chuyên nghiệp với chip M3, màn hình Liquid Retina XDR',
                supplier: appleSupplier._id,
                createdBy: adminUser._id
            },
            {
                name: 'iPad Air 11 inch',
                sku: 'APP-IPAD11-003',
                price: 16990000,
                quantity: 30,
                description: 'Máy tính bảng mỏng nhẹ với chip M2, hỗ trợ Apple Pencil',
                supplier: appleSupplier._id,
                createdBy: adminUser._id
            },

            // FPT products
            {
                name: 'FPT Play Box S',
                sku: 'FPT-PBS-001',
                price: 1590000,
                quantity: 50,
                description: 'Android TV Box với kho nội dung phong phú từ FPT Play',
                supplier: fptSupplier._id,
                createdBy: adminUser._id
            },
            {
                name: 'Camera FPT Smart Home',
                sku: 'FPT-CAM-002',
                price: 990000,
                quantity: 35,
                description: 'Camera an ninh thông minh với tính năng AI nhận diện',
                supplier: fptSupplier._id,
                createdBy: adminUser._id
            },

            // LG products
            {
                name: 'LG OLED TV 77 inch',
                sku: 'LG-OLED77-001',
                price: 65990000,
                quantity: 8,
                description: 'TV OLED cao cấp với chất lượng hình ảnh tuyệt đỉnh',
                supplier: lgSupplier._id,
                createdBy: adminUser._id
            },
            {
                name: 'Tủ lạnh LG InstaView 626L',
                sku: 'LG-RF626-002',
                price: 32990000,
                quantity: 12,
                description: 'Tủ lạnh thông minh với công nghệ InstaView Door-in-Door',
                supplier: lgSupplier._id,
                createdBy: adminUser._id
            },
            {
                name: 'Máy giặt LG AI DD 9kg',
                sku: 'LG-WM9KG-003',
                price: 13990000,
                quantity: 18,
                description: 'Máy giặt thông minh với công nghệ AI Direct Drive',
                supplier: lgSupplier._id,
                createdBy: adminUser._id
            },

            // Vingroup products
            {
                name: 'VinSmart Joy 4',
                sku: 'VIN-JOY4-001',
                price: 2990000,
                quantity: 45,
                description: 'Smartphone tầm trung với thiết kế sang trọng, camera AI',
                supplier: vingroupSupplier._id,
                createdBy: adminUser._id
            },
            {
                name: 'VinSmart TV 43 inch',
                sku: 'VIN-TV43-002',
                price: 7990000,
                quantity: 22,
                description: 'Smart TV Android với độ phân giải 4K, kết nối wifi',
                supplier: vingroupSupplier._id,
                createdBy: adminUser._id
            },

            // Thêm một số sản phẩm sắp hết hàng
            {
                name: 'Samsung Galaxy Buds Pro',
                sku: 'SAM-GBP-004',
                price: 4990000,
                quantity: 3,
                description: 'Tai nghe không dây cao cấp với khử tiếng ồn chủ động',
                supplier: samsungSupplier._id,
                createdBy: adminUser._id
            },
            {
                name: 'Apple AirPods Pro 2',
                sku: 'APP-APP2-004',
                price: 6990000,
                quantity: 2,
                description: 'Tai nghe không dây với chip H2 và khử tiếng ồn thế hệ mới',
                supplier: appleSupplier._id,
                createdBy: adminUser._id
            }
        ];

        const createdProducts = await Product.insertMany(products);
        console.log(`✅ Đã tạo ${createdProducts.length} products`);
        return createdProducts;
    } catch (error) {
        console.error('❌ Lỗi tạo products:', error);
        return [];
    }
};

// Hàm chính để seed dữ liệu
const seedDatabase = async () => {
    console.log('🌱 Bắt đầu seed dữ liệu...');
    
    await connectDB();
    await clearDatabase();
    
    const users = await createUsers();
    const adminUser = users.find(user => user.role === 'admin');
    
    if (!adminUser) {
        console.error('❌ Không tìm thấy admin user');
        process.exit(1);
    }
    
    const suppliers = await createSuppliers(adminUser);
    const products = await createProducts(suppliers, adminUser);
    
    console.log('\n🎉 Seed dữ liệu hoàn thành!');
    console.log(`📊 Tổng kết:`);
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   🏢 Suppliers: ${suppliers.length}`);
    console.log(`   📦 Products: ${products.length}`);
    
    console.log('\n🔐 Thông tin đăng nhập:');
    console.log('   👨‍💼 Admin: admin / Admin123');
    console.log('   👨‍💻 Manager: manager / Manager123');
    console.log('   👨‍🔧 Staff: staff / Staff123');
    
    process.exit(0);
};

// Xử lý lỗi
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
    process.exit(1);
});

// Chạy seed
if (require.main === module) {
    seedDatabase();
}

module.exports = { seedDatabase, clearDatabase };