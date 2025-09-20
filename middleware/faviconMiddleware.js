// Favicon middleware to handle /favicon.ico requests
const path = require('path');
const fs = require('fs');

const faviconMiddleware = (req, res, next) => {
    if (req.url === '/favicon.ico') {
        // Try to serve favicon from public directory, otherwise return empty response
        const faviconPath = path.join(__dirname, '../public/favicon.ico');
        
        if (fs.existsSync(faviconPath)) {
            res.sendFile(faviconPath);
        } else {
            // Return empty 204 response if no favicon exists
            res.status(204).end();
        }
        return;
    }
    next();
};

module.exports = faviconMiddleware;