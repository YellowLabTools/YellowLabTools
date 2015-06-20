var timelineCtrl=angular.module("timelineCtrl",[])
timelineCtrl.controller("TimelineCtrl",["$scope","$rootScope","$routeParams","$location","$timeout","Menu","Results","API",function(e,t,n,r,i,a,l,u){function o(){t.loadedResult&&t.loadedResult.runId===n.runId?(e.result=t.loadedResult,c()):l.get({runId:n.runId,exclude:"toolsResults"},function(n){t.loadedResult=n,e.result=n,c()})}function c(){s(),d(),f(),m(),i(p,100)}function s(){var t=r.hash(),n=null
0===t.indexOf("filter=")&&(n=t.substr(7)),e.warningsFilterOn=null!==n,e.warningsFilters={queryWithoutResults:null===n||"queryWithoutResults"===n,jQueryCallOnEmptyObject:null===n||"jQueryCallOnEmptyObject"===n,eventNotDelegated:null===n||"eventNotDelegated"===n,jsError:null===n||"jsError"===n}}function d(){var t=e.result.rules.jsCount.offendersObj.list
e.scripts=[],t.forEach(function(t){var n=t.file
n.length>100&&(n=n.substr(0,98)+"...")
var r={fullPath:t.file,shortPath:n}
e.scripts.push(r)})}function f(){var t=e.result.javascriptExecutionTree.children||[],n=t[t.length-1]
e.endTime=n.data.timestamp+(n.data.time||0),e.executionTree=[],t.forEach(function(t){if(e.selectedScript){if(t.data.backtrace&&-1===t.data.backtrace.indexOf(e.selectedScript.fullPath+":"))return
if("jQuery loaded"===t.data.type||"jQuery version change"===t.data.type)return}e.executionTree.push(t)})}function m(){var t=199
e.timelineIntervalDuration=e.endTime/t
var n=Array.apply(null,Array(e.endTime+1)).map(Number.prototype.valueOf,0)
e.executionTree.forEach(function(e){if(void 0!==e.data.time)for(var t=Math.min(e.data.time,100)||1,r=e.data.timestamp,i=e.data.timestamp+t;i>r;r++)n[r]|=1}),e.timeline=Array.apply(null,Array(t+1)).map(Number.prototype.valueOf,0),n.forEach(function(t,n){1===t&&(e.timeline[Math.floor(n/e.timelineIntervalDuration)]+=1)}),e.timelineMax=Math.max.apply(Math,e.timeline)}function p(){e.profilerData=e.executionTree}e.runId=n.runId,e.Menu=a.setCurrentPage("timeline",e.runId),e.changeScript=function(){f(),m(),p()},e.findLineIndexByTimestamp=function(t){for(var n=0,r=0;r<e.executionTree.length;r++){var i=e.executionTree[r].data.timestamp-t
if(i<e.timelineIntervalDuration&&(n=r),i>0)break}return n},e.backToDashboard=function(){r.path("/result/"+e.runId)},e.testAgain=function(){u.relaunchTest(e.result)},o()}]),timelineCtrl.directive("scrollOnClick",["$animate","$timeout",function(e,t){return{restrict:"A",link:function(n,r,i){r.on("click",function(){var r=n.findLineIndexByTimestamp(i.scrollOnClick),a=angular.element(document.getElementById("line_"+r))
a.addClass("highlight"),t(function(){e.removeClass(a,"highlight"),n.$digest()},50),window.scrollTo(0,a[0].offsetTop)})}}}])
