var jsChildrenDirective = angular.module('jsChildrenDirective', []);

jsChildrenDirective.directive('jsChildren', function() {
 
    return {
        restrict: 'E',
        scope: {
            node: '=node'
        },
        template:   '<div class="children"></div>',
        replace: true,
        link: function(scope, element, attrs) {
            
            function recursiveHtmlBuilder(node) {
                var html = '';
                
                if (node.children) {
                    node.children.forEach(function(child) {
                        
                        var childArgs = '';
                        if (child.data.callDetails && child.data.callDetails.arguments && child.data.callDetails.arguments.length > 0) {
                            childArgs = child.data.callDetails.arguments.join(' : ');
                            if (childArgs.length > 100) {
                                childArgs = childArgs.substr(0, 98) + '...';
                            }
                        }

                        html += '<div class="child"><span>' + child.data.type + '<div class="childArgs">' + childArgs + '</div></span>' + recursiveHtmlBuilder(child) + '</div>';
                    });
                }

                return html;
            }

            element.append(recursiveHtmlBuilder(scope.node));

            // Bind a very special behavior:
            // We want to display something in the next table-cell, at the same hight.
            element.find('span').on('mouseenter', function() {
                
            });
        }
    };
});