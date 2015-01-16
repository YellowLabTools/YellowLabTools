

var OffendersHelpers = function() {

    
    this.domPathToArray = function(str) {
        return str.split(/\s?>\s?/);
    };

    this.listOfDomArraysToTree = function(listOfDomArrays) {
        var result = {};

        function recursiveTreeBuilder(tree, domArray) {
            if (domArray.length > 0) {
                var currentDomElement = domArray.shift(domArray);
                if (tree === null) {
                    tree = {};
                }
                tree[currentDomElement] = recursiveTreeBuilder(tree[currentDomElement] || null, domArray);
                return tree;
            } else if (tree === null) {
                return 1;
            } else {
                return tree + 1;
            }
        }

        listOfDomArrays.forEach(function(domArray) {
            result = recursiveTreeBuilder(result, domArray);
        });

        return result;
    };

    this.domTreeToHTML = function(domTree) {

        function recursiveHtmlBuilder(tree) {
            var html = '';
            var keys = Object.keys(tree);
            
            keys.forEach(function(key) {
                if (isNaN(tree[key])) {
                    html += '<div><span>' + key + '</span>' + recursiveHtmlBuilder(tree[key]) + '</div>';
                } else if (tree[key] > 1) {
                    html += '<div><span>' + key + ' <span>(x' + tree[key] + ')</span></span></div>';
                } else {
                    html += '<div><span>' + key + '</span></div>';
                }
            });

            return html;
        }

        return '<div class="domTree">' + recursiveHtmlBuilder(domTree) + '</div>';
    };

    this.listOfDomPathsToHTML = function(domPaths) {
        var domArrays = domPaths.map(this.domPathToArray);
        var domTree = this.listOfDomArraysToTree(domArrays);
        return this.domTreeToHTML(domTree);
    };

};

module.exports = new OffendersHelpers();