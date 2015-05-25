var wwwRedirectMiddleware = function(req, res, next) {
    'use strict';

    // Redirect www.yellowlab.tools to yellowlab.tools without "www" (for SEO purpose)
    if(/^www\.yellowlab\.tools/.test(req.headers.host)) {
        res.redirect(301, req.protocol + '://' + req.headers.host.replace(/^www\./, '') + req.url);
    } else {
        next();
    }
};

module.exports = wwwRedirectMiddleware;