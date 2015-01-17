

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

    this.domPathToButton = function(domPath) {
        var domArray = this.domPathToArray(domPath);
        var domTree = this.listOfDomPathsToHTML([domPath]);

        if (domArray[0] === 'html') {
            return '<div class="eltButton htmlButton"><b>html</b></div>';
        }
        if (domArray[0] === 'body') {
            if (domArray.length === 1) {
                return '<div class="eltButton bodyButton"><b>body</b></div>';
            } else {
                return '<div class="eltButton domButton opens">DOM element <b>' + domArray[domArray.length - 1] + '</b>' + domTree + '</div>';
            }
        }
        if (domArray[0] === 'head') {
            return '<div class="eltButton headButton"><b>head</b></div>';
        }
        if (domArray[0] === 'DocumentFragment') {
            if (domArray.length === 1) {
                return '<div class="eltButton fragButton">Fragment</div>';
            } else {
                return '<div class="eltButton fragEltButton opens">Fragment element <b>' + domArray[domArray.length - 1] + '</b>' + domTree + '</div>';
            }
        }
        
        // Not attached element, such as just created with document.createElement()
        if (domArray.length === 1) {
            return '<div class="eltButton aloneButton">Created element <b>' + domPath + '</b></div>';
        } else {
            return '<div class="eltButton aloneEltButton opens">Created element <b>' + domArray[domArray.length - 1] + '</b>' + domTree + '</div>';
        }
    };

};

module.exports = new OffendersHelpers();