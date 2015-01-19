

var OffendersHelpers = function() {
    
    this.domPathToArray = function(str) {
        return str.split(/\s?>\s?/);
    };

    this.listOfDomArraysToTree = function(listOfDomArrays) {
        var result = {};

        function recursiveTreeBuilder(tree, domArray) {
            if (domArray.length > 0) {
                var currentDomElement = domArray.shift();
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
            return '<div class="offenderButton"><b>html</b></div>';
        }
        if (domArray[0] === 'body') {
            if (domArray.length === 1) {
                return '<div class="offenderButton"><b>body</b></div>';
            } else {
                return '<div class="offenderButton opens">DOM element <b>' + domArray[domArray.length - 1] + '</b>' + domTree + '</div>';
            }
        }
        if (domArray[0] === 'head') {
            return '<div class="offenderButton"><b>head</b></div>';
        }
        if (domArray[0] === '#document') {
            return '<div class="offenderButton"><b>document</b></div>';
        }
        if (domArray[0] === 'window') {
            return '<div class="offenderButton"><b>window</b></div>';
        }
        if (domArray[0] === 'DocumentFragment') {
            if (domArray.length === 1) {
                return '<div class="offenderButton">Fragment</div>';
            } else {
                return '<div class="offenderButton opens">Fragment element <b>' + domArray[domArray.length - 1] + '</b>' + domTree + '</div>';
            }
        }
        
        // Not attached element, such as just created with document.createElement()
        if (domArray.length === 1) {
            return '<div class="offenderButton">Created element <b>' + domPath + '</b></div>';
        } else {
            return '<div class="offenderButton opens">Created element <b>' + domArray[domArray.length - 1] + '</b>' + domTree + '</div>';
        }
    };


    this.backtraceToArray = function(str) {
        var traceArray = str.split(/ \/ /);

        if (traceArray) {
            var results = [];
            var parts = null;

            for (var i=0 ; i<traceArray.length ; i++) {
                parts = /^(([\w$]+) )?([^ ]+):(\d+)$/.exec(traceArray[i]);

                if (parts) {
                    var obj = {
                        file: parts[3],
                        line: parseInt(parts[4], 10)
                    };

                    if (parts[2]) {
                        obj.functionName = parts[2];
                    }

                    results.push(obj);
                } else {
                    return null;
                }
            }
            return results;
        } else {
            return null;
        }
    };

    this.backtraceArrayToHtml = function(backtraceArray) {
        if (backtraceArray.length === 0) {
            return '<div class="offenderButton">no backtrace</div>';
        }

        var html = '<div class="offenderButton opens">backtrace<div class="backtrace">';
        backtraceArray.forEach(function(backtraceObj) {
            var functionName = (backtraceObj.functionName) ? backtraceObj.functionName + '() ' : '';
            html += '<div>' + functionName + '<a href="' + backtraceObj.file + '" target="_blank">' + backtraceObj.file + '</a> line ' + backtraceObj.line + '</div>';
        });
        return html + '</div></div>';
    };


    this.sortVarsLikeChromeDevTools = function(vars) {
        return vars.sort(function(a, b) {
            return (a < b) ? -1 : 1;
        });
    };

};

module.exports = new OffendersHelpers();