/**
 * Analyzes images and detects which one can be lazy-loaded (are below the fold)
 *
 * @see https://github.com/macbre/phantomas/issues/494
 */
/* global document: true, window: true */

exports.version = '1.0.a';

exports.module = function(phantomas) {
    'use strict';
    
    phantomas.setMetric('lazyLoadableImagesBelowTheFold'); // @desc number of images displayed below the fold that can be lazy-loaded

    phantomas.on('report', function() {
        phantomas.log('lazyLoadableImages: analyzing which images can be lazy-loaded...');

        phantomas.evaluate(function() {
            (function(phantomas) {
                phantomas.spyEnabled(false, 'analyzing which images can be lazy-loaded');

                var images = document.body.getElementsByTagName('img'),
                    i,
                    len = images.length,
                    offset,
                    path,
                    processedImages = {},
                    src,
                    viewportHeight = window.innerHeight,
                    // Add an offset of 100px under the height of the screen
                    LAZYLOAD_OFFSET = 100;

                phantomas.log('lazyLoadableImages: %d image(s) found, assuming %dpx offset to be the fold', len, viewportHeight);

                for (i = 0; i < len; i++) {
                    // @see https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
                    offset = images[i].getBoundingClientRect().top;
                    src = images[i].src;

                    // ignore base64-encoded images
                    if (src === '' || /^data:/.test(src)) {
                        continue;
                    }

                    path = phantomas.getDOMPath(images[i]);

                    // get the most top position for a given image (deduplicate by src)
                    if (typeof processedImages[src] === 'undefined') {
                        processedImages[src] = {
                            offset: offset,
                            path: path
                        };
                    }

                    // maybe there's the same image loaded above the fold?
                    if (offset < processedImages[src].offset) {
                        processedImages[src] = {
                            offset: offset,
                            path: path
                        };
                    }
                }

                phantomas.log('lazyLoadableImages: checking %d unique image(s)', Object.keys(processedImages).length);

                Object.keys(processedImages).forEach(function(src) {
                    var img = processedImages[src];

                    if (img.offset > viewportHeight + LAZYLOAD_OFFSET) {
                        phantomas.log('lazyLoadableImages: <%s> image (%s) is below the fold (at %dpx)', src, img.path, img.offset);

                        phantomas.incrMetric('lazyLoadableImagesBelowTheFold');
                        phantomas.addOffender('lazyLoadableImagesBelowTheFold', src);
                    }
                });

                phantomas.spyEnabled(true);
            })(window.__phantomas);
        });
    });
};