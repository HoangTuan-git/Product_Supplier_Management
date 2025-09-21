const errorMiddleware = {
    // 404 Error Handler
    notFound: (req, res, next) => {
        // Don't create errors for common browser requests and DevTools
        const ignoredPaths = [
            '/favicon.ico', 
            '/robots.txt', 
            '/sitemap.xml', 
            '/apple-touch-icon.png',
            '/.well-known/appspecific/com.chrome.devtools.json'
        ];
        
        if (ignoredPaths.includes(req.originalUrl)) {
            return res.status(204).end();
        }
        
        const error = new Error(`Not Found - ${req.originalUrl}`);
        error.status = 404;
        next(error);
    },

    // General Error Handler
    errorHandler: (err, req, res, next) => {
        // Don't log common browser request errors and DevTools
        const ignoredPaths = [
            '/favicon.ico', 
            '/robots.txt', 
            '/sitemap.xml', 
            '/apple-touch-icon.png',
            '/.well-known/appspecific/com.chrome.devtools.json'
        ];
        const shouldLog = !ignoredPaths.includes(req.originalUrl) || err.status !== 404;
        
        if (shouldLog) {
            console.error('Error details:', {
                message: err.message,
                stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
                url: req.originalUrl,
                method: req.method,
                userAgent: req.get('User-Agent'),
                ip: req.ip,
                user: req.user ? req.user.username : 'Anonymous',
                timestamp: new Date().toISOString()
            });
        }

        // Determine status code
        let statusCode = err.status || err.statusCode || 500;
        
        // Handle specific error types
        if (err.name === 'ValidationError') {
            statusCode = 400;
        } else if (err.name === 'CastError') {
            statusCode = 400;
        } else if (err.code === 11000) {
            statusCode = 409; // Duplicate key error
        }

        // Development vs Production error responses
        const isDevelopment = process.env.NODE_ENV === 'development';
        
        const errorResponse = {
            message: err.message || 'Internal Server Error',
            status: statusCode,
            ...(isDevelopment && { stack: err.stack })
        };

        // Handle different response types
        if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
            // API/AJAX request - return JSON
            return res.status(statusCode).json({
                success: false,
                error: errorResponse
            });
        }

        // Web request - render error page
        const errorTitle = getErrorTitle(statusCode);
        const errorMessage = getErrorMessage(statusCode, err.message);

        res.status(statusCode).render('error', {
            title: errorTitle,
            statusCode,
            message: errorMessage,
            ...(isDevelopment && { stack: err.stack }),
            layout: 'partials/layout'
        });
    },

    // Async error wrapper
    asyncHandler: (fn) => {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    },

    // Validation error formatter
    formatValidationErrors: (errors) => {
        return errors.array().map(error => ({
            field: error.param,
            message: error.msg,
            value: error.value
        }));
    },

    // Database error handler
    handleDatabaseError: (err, req, res, next) => {
        if (err.name === 'MongoError' || err.name === 'MongooseError') {
            console.error('Database error:', err);
            
            if (err.code === 11000) {
                // Duplicate key error
                const field = Object.keys(err.keyPattern)[0];
                err.message = `${field} đã tồn tại trong hệ thống`;
                err.status = 409;
            } else if (err.name === 'ValidationError') {
                // Mongoose validation error
                const messages = Object.values(err.errors).map(e => e.message);
                err.message = messages.join(', ');
                err.status = 400;
            } else if (err.name === 'CastError') {
                // Invalid ObjectId
                err.message = 'ID không hợp lệ';
                err.status = 400;
            } else {
                err.message = 'Lỗi cơ sở dữ liệu';
                err.status = 500;
            }
        }
        next(err);
    }
};

// Helper functions
function getErrorTitle(statusCode) {
    switch (statusCode) {
        case 400:
            return 'Yêu cầu không hợp lệ';
        case 401:
            return 'Không có quyền truy cập';
        case 403:
            return 'Bị cấm truy cập';
        case 404:
            return 'Không tìm thấy trang';
        case 409:
            return 'Xung đột dữ liệu';
        case 500:
            return 'Lỗi máy chủ';
        default:
            return 'Có lỗi xảy ra';
    }
}

function getErrorMessage(statusCode, originalMessage) {
    switch (statusCode) {
        case 400:
            return originalMessage || 'Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại.';
        case 401:
            return 'Bạn cần đăng nhập để truy cập trang này.';
        case 403:
            return 'Bạn không có quyền truy cập vào trang này.';
        case 404:
            return 'Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.';
        case 409:
            return originalMessage || 'Dữ liệu bị trùng lặp. Vui lòng thử lại.';
        case 500:
            return 'Đã có lỗi xảy ra trên máy chủ. Vui lòng thử lại sau.';
        default:
            return originalMessage || 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
    }
}

module.exports = errorMiddleware;