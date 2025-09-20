# Hệ thống Quản lý Sản phẩm và Nhà cung cấp

Một ứng dụng web đầy đủ tính năng để quản lý sản phẩm và nhà cung cấp với hệ thống xác thực người dùng.

## 🚀 Tính năng chính

### Xác thực người dùng
- ✅ Đăng ký tài khoản mới
- ✅ Đăng nhập với username/email
- ✅ Quên mật khẩu và reset password
- ✅ Hệ thống session + JWT cookies
- ✅ Bảo mật mật khẩu với bcrypt

### Quản lý Nhà cung cấp
- ✅ Thêm/sửa/xóa nhà cung cấp
- ✅ Thông tin: tên, địa chỉ, số điện thoại
- ✅ Tìm kiếm và lọc nhà cung cấp
- ✅ Xem sản phẩm của từng nhà cung cấp

### Quản lý Sản phẩm
- ✅ Thêm/sửa/xóa sản phẩm
- ✅ Thông tin: tên, giá, số lượng, nhà cung cấp
- ✅ Tìm kiếm sản phẩm theo tên
- ✅ Lọc sản phẩm theo nhà cung cấp
- ✅ Thống kê và báo cáo

### Giao diện người dùng
- ✅ Responsive design với Bootstrap 5
- ✅ Trang chủ với menu nhà cung cấp
- ✅ Thanh tìm kiếm thông minh
- ✅ Flash messages cho thông báo
- ✅ Giao diện thân thiện và hiện đại

## 🛠️ Công nghệ sử dụng

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Web framework
- **MongoDB** - Cơ sở dữ liệu NoSQL
- **Mongoose** - ODM cho MongoDB

### Xác thực
- **bcryptjs** - Hash mật khẩu
- **express-session** - Quản lý session
- **jsonwebtoken** - JWT tokens
- **connect-mongo** - Lưu session trong MongoDB

### Frontend
- **EJS** - Template engine
- **Bootstrap 5** - CSS framework
- **Bootstrap Icons** - Icon library
- **jQuery** - JavaScript library

### Bảo mật
- **helmet** - Security headers
- **express-validator** - Input validation
- **express-rate-limit** - Rate limiting
- **cors** - CORS middleware

## 📋 Yêu cầu hệ thống

- Node.js >= 14.0.0
- MongoDB >= 4.4.0
- npm >= 6.0.0

## 🚀 Cài đặt và Chạy

### 1. Clone repository
```bash
git clone <repository-url>
cd project-root
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình môi trường
Tạo file `.env` trong thư mục gốc:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/product_supplier_management

# Authentication
SESSION_SECRET=your-super-secret-session-key-here
JWT_SECRET=your-jwt-secret-key-here
JWT_EXPIRES_IN=7d

# Password hashing
BCRYPT_ROUNDS=12

# Server
PORT=3000
NODE_ENV=development

# Email (optional - for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 4. Khởi động MongoDB
Đảm bảo MongoDB đang chạy trên máy của bạn:
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### 5. Chạy ứng dụng

#### Development mode
```bash
npm run dev
```

#### Production mode
```bash
npm start
```

Ứng dụng sẽ chạy tại: `http://localhost:3000`

## 📁 Cấu trúc thư mục

```
project-root/
├── config/                 # Cấu hình ứng dụng
│   └── session.js          # Cấu hình session
├── controllers/            # Controllers xử lý logic
│   ├── authController.js   # Xác thực người dùng
│   ├── homeController.js   # Trang chủ
│   ├── productController.js # Quản lý sản phẩm
│   └── supplierController.js # Quản lý nhà cung cấp
├── middleware/             # Middleware tùy chỉnh
│   ├── auth.js            # Middleware xác thực
│   ├── errorMiddleware.js  # Xử lý lỗi
│   └── validationMiddleware.js # Validation
├── models/                 # Models MongoDB
│   ├── User.js            # Model người dùng
│   ├── Product.js         # Model sản phẩm
│   └── Supplier.js        # Model nhà cung cấp
├── public/                 # Files tĩnh
│   ├── css/               # Stylesheet
│   │   └── style.css      # CSS tùy chỉnh
│   └── js/                # JavaScript
│       └── main.js        # JS tùy chỉnh
├── routes/                 # Routes định nghĩa
│   ├── authRoutes.js      # Routes xác thực
│   ├── homeRoutes.js      # Routes trang chủ
│   ├── productRoutes.js   # Routes sản phẩm
│   └── supplierRoutes.js  # Routes nhà cung cấp
├── views/                  # EJS templates
│   ├── auth/              # Views xác thực
│   ├── partials/          # Partial templates
│   ├── error.ejs          # Trang lỗi
│   └── index.ejs          # Trang chủ
├── .env                    # Biến môi trường
├── app.js                  # File chính ứng dụng
├── package.json           # Dependencies
└── README.md              # Tài liệu này
```

## 🔐 Xác thực và Phân quyền

### Đăng ký tài khoản
- Username: 3-30 ký tự, chỉ chữ, số và dấu gạch dưới
- Email: Định dạng email hợp lệ
- Mật khẩu: Ít nhất 6 ký tự, có chữ hoa, thường và số
- Số điện thoại: Tùy chọn, định dạng Việt Nam

### Đăng nhập
- Hỗ trợ đăng nhập bằng email hoặc username
- Tùy chọn "Ghi nhớ đăng nhập" với JWT cookies
- Session timeout có thể cấu hình

### Bảo mật
- Mật khẩu được hash với bcrypt (12 rounds)
- Session được lưu trong MongoDB
- CSRF protection
- Rate limiting cho API
- Input validation và sanitization

## 📊 Tính năng Quản lý

### Sản phẩm
- **Thông tin cơ bản**: Tên, giá, số lượng, mô tả
- **Nhà cung cấp**: Liên kết với bảng suppliers
- **SKU**: Tự động tạo mã sản phẩm
- **Trạng thái kho**: Theo dõi tồn kho
- **Tìm kiếm**: Theo tên, SKU, mô tả
- **Lọc**: Theo nhà cung cấp, giá, số lượng

### Nhà cung cấp
- **Thông tin**: Tên, địa chỉ, số điện thoại
- **Sản phẩm**: Xem danh sách sản phẩm
- **Thống kê**: Số lượng sản phẩm, tổng giá trị
- **Tìm kiếm**: Theo tên, địa chỉ, số điện thoại

### Thống kê và Báo cáo
- Tổng số sản phẩm, nhà cung cấp
- Sản phẩm sắp hết hàng
- Top nhà cung cấp theo số lượng sản phẩm
- Thống kê giá trị kho hàng

## 🎨 Giao diện

### Responsive Design
- Hỗ trợ desktop, tablet, mobile
- Bootstrap 5 components
- Custom CSS với gradient và animation
- Dark/Light theme (có thể mở rộng)

### Components
- Navigation với dropdown menu
- Search bar với autocomplete
- Flash messages với auto-hide
- Pagination cho danh sách
- Modal dialogs cho confirmation
- Form validation với feedback

## 🔧 API Endpoints

### Authentication
```
POST /auth/register     # Đăng ký
POST /auth/login        # Đăng nhập
POST /auth/logout       # Đăng xuất
POST /auth/forgot       # Quên mật khẩu
POST /auth/reset/:token # Reset mật khẩu
```

### Suppliers
```
GET    /suppliers           # Danh sách nhà cung cấp
GET    /suppliers/new       # Form thêm mới
POST   /suppliers           # Tạo nhà cung cấp
GET    /suppliers/:id       # Chi tiết
GET    /suppliers/:id/edit  # Form chỉnh sửa
PUT    /suppliers/:id       # Cập nhật
DELETE /suppliers/:id       # Xóa
```

### Products
```
GET    /products            # Danh sách sản phẩm
GET    /products/new        # Form thêm mới
POST   /products            # Tạo sản phẩm
GET    /products/:id        # Chi tiết
GET    /products/:id/edit   # Form chỉnh sửa
PUT    /products/:id        # Cập nhật
DELETE /products/:id        # Xóa
GET    /products/statistics # Thống kê
```

## 🚀 Triển khai Production

### 1. Cấu hình môi trường
```env
NODE_ENV=production
MONGODB_URI=mongodb://your-production-db
SESSION_SECRET=your-strong-session-secret
JWT_SECRET=your-strong-jwt-secret
```

### 2. Build và Start
```bash
npm install --production
npm start
```

### 3. Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. Process Manager (PM2)
```bash
npm install -g pm2
pm2 start app.js --name "product-management"
pm2 startup
pm2 save
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Kiểm tra MongoDB service đang chạy
- Xác minh connection string trong .env
- Kiểm tra firewall và network

### Authentication Problems
- Xóa session cookies và thử lại
- Kiểm tra SESSION_SECRET và JWT_SECRET
- Verify MongoDB session store

### View Rendering Issues
- Đảm bảo tất cả EJS templates tồn tại
- Kiểm tra layout configuration
- Verify view paths

## 📈 Tối ưu hiệu suất

### Database
- Index cho các trường tìm kiếm thường xuyên
- Pagination cho danh sách lớn
- Aggregate pipelines cho thống kê

### Caching
- Session caching với Redis (có thể mở rộng)
- Static file caching
- Database query caching

### Security
- Rate limiting
- Input sanitization
- HTTPS in production
- Regular security updates

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📧 Liên hệ

Project Link: [https://github.com/yourusername/product-management](https://github.com/yourusername/product-management)

---

Made with ❤️ using Node.js + Express + MongoDB