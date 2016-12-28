

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

    this.domPathToDomElementObj = function(domPath) {

        if (typeof domPath === 'boolean') {
            return {
                // Not a normal element path
                type: 'notAnElement',
                element: domPath
            };
        }

        var domArray = this.domPathToArray(domPath);
        var domTree = this.listOfDomArraysToTree([this.domPathToArray(domPath)]);

        if (domArray[0] === 'html') {
            return {
                type: 'html'
            };
        }
        if (domArray[0] === 'body') {
            if (domArray.length === 1) {
                return {
                    type: 'body'
                };
            } else {
                return {
                    type: 'domElement',
                    element: domArray[domArray.length - 1],
                    tree: domTree
                };
            }
        }
        if (domArray[0] === 'head') {
            return {
                type: 'head'
            };
        }
        if (domArray[0] === '#document') {
            return {
                type: 'document'
            };
        }
        if (domArray[0] === 'window') {
            return {
                type: 'window'
            };
        }
        if (domArray[0] === 'DocumentFragment') {
            if (domArray.length === 1) {
                return {
                    type: 'fragment'
                };
            } else {
                return {
                    type: 'fragmentElement',
                    element: domArray[domArray.length - 1],
                    tree: domTree
                };
            }
        }
        
        // Not attached element, such as just created with document.createElement()
        if (domArray.length === 1) {
            return {
                type: 'createdElement',
                element: domPath
            };
        } else {
            return {
                type: 'createdElement',
                element: domArray[domArray.length - 1],
                tree: domTree
            };
        }
    };


    this.backtraceToArray = function(str) {
        var traceArray = str.split(/ \/ /);

        if (traceArray) {
            var results = [];
            var parts = null;
            var obj;

            for (var i=0 ; i<traceArray.length ; i++) {
                // Handle the new PhantomJS 2.x syntax
                parts = /^(([\w$]+)@)?([^ ]+):(\d+):(\d+)$/.exec(traceArray[i]);

                if (parts) {
                    obj = {
                        file: parts[3],
                        line: parseInt(parts[4], 10),
                        column: parseInt(parts[5], 10)
                    };

                    if (parts[2]) {
                        obj.functionName = parts[2];
                    }

                    results.push(obj);

                } else {
                    // Old syntax
                    parts = /^(([\w$]+) )?\(?([^ ]+):(\d+)\)?$/.exec(traceArray[i]);

                    if (parts) {
                        obj = {
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
            }
            return results;
        } else {
            return null;
        }
    };


    this.sortVarsLikeChromeDevTools = function(vars) {
        return vars.sort(function(a, b) {
            return (a < b) ? -1 : 1;
        });
    };

    this.urlToLink = function(url) {
        var shortUrl = (url.length > 110) ? url.substr(0, 47) + ' ... ' + url.substr(-48) : url;
        return '<a href="' + url + '" target="_blank" title="' + url + '">' + shortUrl + '</a>';
    };

    this.cssOffenderPattern = function(offender) {
        // Remove any line breaks
        offender = offender.replace(/(\r\n|\n|\r)/gm, '');

        var parts = /^(.*) (?:<([^ \(]*)>|\[inline CSS\]) ?@ ?(\d+):(\d+)$/.exec(offender);
        
        if (!parts) {
            return {
                offender: offender
            };
        } else {
            return {
                css: parts[1],
                file: parts[2] || null,
                line: parseInt(parts[3], 10),
                column: parseInt(parts[4], 10)
            };
        }
    };

    this.fileWithSizePattern = function(fileWithSize) {
        var parts = /^([^ ]*) \((\d+\.\d{2}|NaN) kB\)$/.exec(fileWithSize);

        if (!parts) {
            return {
                file: fileWithSize
            };
        } else {
            return {
                file: parts[1],
                size: parseFloat(parts[2])
            };
        }
    };

    this.orderByFile = function(offenders) {
        var byFileObj = {};

        offenders.forEach(function(offender) {
            var file = offender.file || 'Inline CSS';
            delete offender.file;

            if (!byFileObj[file]) {
                byFileObj[file] = {
                    url: file,
                    count: 0,
                    offenders: []
                };
            }

            byFileObj[file].count ++;
            byFileObj[file].offenders.push(offender);
        });

        // Transform object into array
        var byFileArray = [];
        for (var file in byFileObj) {
            byFileArray.push(byFileObj[file]);
        }

        return {byFile: byFileArray};
    };

};

module.exports = new OffendersHelpers();