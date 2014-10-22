/**
 * Alternative to the standard String.prototype.replace function
 * Avoids problems with $$, $1, $2, ...
 */

module.exports = function(str, searched, replacement) {
    return str.split(searched).join(replacement);
};