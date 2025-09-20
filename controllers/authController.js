const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const authController = {
    // GET /auth/register - Hiển thị trang đăng ký
    showRegister: (req, res) => {
        res.render('auth/register', {
            title: 'Đăng ký tài khoản',
            user: {}
        });
    },

    // POST /auth/register - Xử lý đăng ký
    register: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorMessages = errors.array().map(error => error.msg);
                req.flash('error', errorMessages.join(', '));
                return res.render('auth/register', {
                    title: 'Đăng ký tài khoản',
                    user: req.body
                });
            }

            const { username, email, password, phone } = req.body;

            // Kiểm tra user đã tồn tại
            const existingUser = await User.findOne({
                $or: [{ email }, { username }]
            });

            if (existingUser) {
                req.flash('error', 'Email hoặc username đã tồn tại');
                return res.render('auth/register', {
                    title: 'Đăng ký tài khoản',
                    user: req.body
                });
            }

            // Tạo user mới
            const user = new User({
                username,
                email,
                password,
                phone
            });

            await user.save();

            req.flash('success', 'Đăng ký thành công! Vui lòng đăng nhập.');
            res.redirect('/auth/login');

        } catch (error) {
            console.error('Register error:', error);
            req.flash('error', 'Có lỗi xảy ra: ' + error.message);
            res.render('auth/register', {
                title: 'Đăng ký tài khoản',
                user: req.body
            });
        }
    },

    // GET /auth/login - Hiển thị trang đăng nhập
    showLogin: (req, res) => {
        res.render('auth/login', {
            title: 'Đăng nhập'
        });
    },

    // POST /auth/login - Xử lý đăng nhập
    login: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorMessages = errors.array().map(error => error.msg);
                req.flash('error', errorMessages.join(', '));
                return res.render('auth/login', {
                    title: 'Đăng nhập'
                });
            }

            const { identifier, password, rememberMe } = req.body;

            // Tìm user bằng email hoặc username
            const user = await User.findByEmailOrUsername(identifier);
            if (!user) {
                req.flash('error', 'Thông tin đăng nhập không chính xác');
                return res.render('auth/login', {
                    title: 'Đăng nhập'
                });
            }

            // Kiểm tra tài khoản active
            if (!user.isActive) {
                req.flash('error', 'Tài khoản đã bị vô hiệu hóa');
                return res.render('auth/login', {
                    title: 'Đăng nhập'
                });
            }

            // Verify password
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                req.flash('error', 'Thông tin đăng nhập không chính xác');
                return res.render('auth/login', {
                    title: 'Đăng nhập'
                });
            }

            // Cập nhật last login
            user.lastLogin = new Date();
            await user.save();

            // Tạo session
            req.session.userId = user._id;
            req.session.user = {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            };

            // Tạo JWT token nếu remember me
            if (rememberMe) {
                const token = jwt.sign(
                    { 
                        userId: user._id, 
                        email: user.email, 
                        role: user.role 
                    },
                    process.env.JWT_SECRET || 'jwt-secret-key',
                    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
                );

                res.cookie('authToken', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                    sameSite: 'lax'
                });
            }

            req.flash('success', 'Đăng nhập thành công!');
            const redirectTo = req.session.returnTo || '/';
            delete req.session.returnTo;
            res.redirect(redirectTo);

        } catch (error) {
            console.error('Login error:', error);
            req.flash('error', 'Có lỗi xảy ra trong quá trình đăng nhập');
            res.render('auth/login', {
                title: 'Đăng nhập'
            });
        }
    },

    // POST /auth/logout - Đăng xuất
    logout: (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destruction error:', err);
                req.flash('error', 'Có lỗi xảy ra khi đăng xuất');
                return res.redirect('/');
            }

            // Clear cookies
            res.clearCookie('sessionId');
            res.clearCookie('authToken');
            
            req.flash('success', 'Đăng xuất thành công!');
            res.redirect('/');
        });
    },

    // GET /auth/forgot - Hiển thị trang quên mật khẩu
    showForgot: (req, res) => {
        res.render('auth/forgot', {
            title: 'Quên mật khẩu'
        });
    },

    // POST /auth/forgot - Xử lý quên mật khẩu
    forgot: async (req, res) => {
        try {
            const { email } = req.body;
            
            const user = await User.findOne({ email: email.toLowerCase() });
            if (!user) {
                req.flash('error', 'Không tìm thấy tài khoản với email này');
                return res.render('auth/forgot', {
                    title: 'Quên mật khẩu'
                });
            }

            // Tạo reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            user.resetPasswordToken = resetToken;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
            await user.save();

            // Gửi email (nếu có cấu hình)
            if (process.env.EMAIL_HOST) {
                const transporter = nodemailer.createTransporter({
                    host: process.env.EMAIL_HOST,
                    port: process.env.EMAIL_PORT,
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });

                const resetUrl = `${req.protocol}://${req.get('host')}/auth/reset/${resetToken}`;
                
                await transporter.sendMail({
                    to: user.email,
                    subject: 'Reset Password',
                    html: `
                        <h3>Reset Password</h3>
                        <p>Bạn đã yêu cầu reset mật khẩu. Click vào link bên dưới để reset:</p>
                        <a href="${resetUrl}">Reset Password</a>
                        <p>Link này sẽ hết hiệu lực sau 1 giờ.</p>
                    `
                });
            }

            req.flash('success', 'Link reset mật khẩu đã được gửi đến email của bạn');
            res.redirect('/auth/login');

        } catch (error) {
            console.error('Forgot password error:', error);
            req.flash('error', 'Có lỗi xảy ra');
            res.render('auth/forgot', {
                title: 'Quên mật khẩu'
            });
        }
    },

    // GET /auth/reset/:token - Hiển thị trang reset mật khẩu
    showReset: async (req, res) => {
        try {
            const user = await User.findOne({
                resetPasswordToken: req.params.token,
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!user) {
                req.flash('error', 'Token reset không hợp lệ hoặc đã hết hiệu lực');
                return res.redirect('/auth/forgot');
            }

            res.render('auth/reset', {
                title: 'Reset mật khẩu',
                token: req.params.token
            });

        } catch (error) {
            console.error('Show reset error:', error);
            req.flash('error', 'Có lỗi xảy ra');
            res.redirect('/auth/forgot');
        }
    },

    // POST /auth/reset/:token - Xử lý reset mật khẩu
    reset: async (req, res) => {
        try {
            const { password, confirmPassword } = req.body;

            if (password !== confirmPassword) {
                req.flash('error', 'Mật khẩu xác nhận không khớp');
                return res.render('auth/reset', {
                    title: 'Reset mật khẩu',
                    token: req.params.token
                });
            }

            const user = await User.findOne({
                resetPasswordToken: req.params.token,
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!user) {
                req.flash('error', 'Token reset không hợp lệ hoặc đã hết hiệu lực');
                return res.redirect('/auth/forgot');
            }

            user.password = password;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            req.flash('success', 'Mật khẩu đã được reset thành công! Vui lòng đăng nhập.');
            res.redirect('/auth/login');

        } catch (error) {
            console.error('Reset password error:', error);
            req.flash('error', 'Có lỗi xảy ra');
            res.render('auth/reset', {
                title: 'Reset mật khẩu',
                token: req.params.token
            });
        }
    }
};

module.exports = authController;