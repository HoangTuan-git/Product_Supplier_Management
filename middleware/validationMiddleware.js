const { body } = require('express-validator');

const authValidation = {
    register: [
        body('username')
            .trim()
            .isLength({ min: 3, max: 30 })
            .withMessage('Username phải có từ 3-30 ký tự')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username chỉ được chứa chữ cái, số và dấu gạch dưới'),
        
        body('email')
            .trim()
            .isEmail()
            .withMessage('Email không hợp lệ')
            .normalizeEmail(),
        
        body('password')
            .isLength({ min: 6 })
            .withMessage('Mật khẩu phải có ít nhất 6 ký tự')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Mật khẩu phải có ít nhất 1 chữ thường, 1 chữ hoa và 1 số'),
        
        body('confirmPassword')
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Mật khẩu xác nhận không khớp');
                }
                return true;
            }),
        
        body('phone')
            .optional({ checkFalsy: true })
            .trim()
            .matches(/^[0-9]{10,11}$/)
            .withMessage('Số điện thoại phải có 10-11 chữ số')
    ],

    login: [
        body('identifier')
            .trim()
            .notEmpty()
            .withMessage('Vui lòng nhập email hoặc username'),
        
        body('password')
            .notEmpty()
            .withMessage('Vui lòng nhập mật khẩu')
    ],

    forgot: [
        body('email')
            .trim()
            .isEmail()
            .withMessage('Email không hợp lệ')
            .normalizeEmail()
    ],

    reset: [
        body('password')
            .isLength({ min: 6 })
            .withMessage('Mật khẩu phải có ít nhất 6 ký tự')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Mật khẩu phải có ít nhất 1 chữ thường, 1 chữ hoa và 1 số'),
        
        body('confirmPassword')
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Mật khẩu xác nhận không khớp');
                }
                return true;
            })
    ]
};

const supplierValidation = {
    create: [
        body('name')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Tên nhà cung cấp phải có từ 2-100 ký tự'),
        
        body('address')
            .trim()
            .isLength({ min: 5, max: 200 })
            .withMessage('Địa chỉ phải có từ 5-200 ký tự'),
        
        body('phone')
            .trim()
            .isMobilePhone('vi-VN')
            .withMessage('Số điện thoại không hợp lệ'),
        
        body('description')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Mô tả không được quá 500 ký tự')
    ],

    update: [
        body('name')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Tên nhà cung cấp phải có từ 2-100 ký tự'),
        
        body('address')
            .trim()
            .isLength({ min: 5, max: 200 })
            .withMessage('Địa chỉ phải có từ 5-200 ký tự'),
        
        body('phone')
            .trim()
            .isMobilePhone('vi-VN')
            .withMessage('Số điện thoại không hợp lệ'),
        
        body('description')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Mô tả không được quá 500 ký tự')
    ]
};

const productValidation = {
    create: [
        body('name')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Tên sản phẩm phải có từ 2-100 ký tự'),
        
        body('price')
            .isFloat({ min: 0.01 })
            .withMessage('Giá phải là số dương lớn hơn 0'),
        
        body('quantity')
            .isInt({ min: 0 })
            .withMessage('Số lượng phải là số nguyên không âm'),
        
        body('supplier')
            .notEmpty()
            .withMessage('Vui lòng chọn nhà cung cấp')
            .isMongoId()
            .withMessage('Nhà cung cấp không hợp lệ'),
        
        body('description')
            .optional()
            .trim()
            .isLength({ max: 1000 })
            .withMessage('Mô tả không được quá 1000 ký tự')
    ],

    update: [
        body('name')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Tên sản phẩm phải có từ 2-100 ký tự'),
        
        body('price')
            .isFloat({ min: 0.01 })
            .withMessage('Giá phải là số dương lớn hơn 0'),
        
        body('quantity')
            .isInt({ min: 0 })
            .withMessage('Số lượng phải là số nguyên không âm'),
        
        body('supplier')
            .notEmpty()
            .withMessage('Vui lòng chọn nhà cung cấp')
            .isMongoId()
            .withMessage('Nhà cung cấp không hợp lệ'),
        
        body('description')
            .optional()
            .trim()
            .isLength({ max: 1000 })
            .withMessage('Mô tả không được quá 1000 ký tự')
    ]
};

const contactValidation = {
    submit: [
        body('name')
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('Tên phải có từ 2-50 ký tự'),
        
        body('email')
            .trim()
            .isEmail()
            .withMessage('Email không hợp lệ')
            .normalizeEmail(),
        
        body('subject')
            .trim()
            .isLength({ min: 5, max: 100 })
            .withMessage('Tiêu đề phải có từ 5-100 ký tự'),
        
        body('message')
            .trim()
            .isLength({ min: 10, max: 1000 })
            .withMessage('Nội dung phải có từ 10-1000 ký tự')
    ]
};

module.exports = {
    authValidation,
    supplierValidation,
    productValidation,
    contactValidation
};