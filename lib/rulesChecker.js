var Q = require('q');
var debug = require('debug')('ylt:ruleschecker');

var RulesChecker = function() {
    'use strict';

    this.check = function(data, policies) {

        var results = {};

        debug('Starting checking rules');

        for (var metricName in policies) {
            var policy = policies[metricName];

            if (data.toolsResults[policy.tool] &&
                data.toolsResults[policy.tool].metrics &&
                (data.toolsResults[policy.tool].metrics[metricName] || data.toolsResults[policy.tool].metrics[metricName] === 0)) {
                    
                    var rule = {
                        value: data.toolsResults[policy.tool].metrics[metricName],
                        policy: policy
                    };

                    if (data.toolsResults[policy.tool].offenders &&
                        data.toolsResults[policy.tool].offenders[metricName] &&
                        data.toolsResults[policy.tool].offenders[metricName].length > 0) {
                            rule.offenders = data.toolsResults[policy.tool].offenders[metricName];
                    }

                    rule.bad = rule.value > policy.isOkThreshold;
                    rule.abnormal = policy.isAbnormalThreshold && rule.value >= policy.isAbnormalThreshold;

                    // A value between 0 (bad) and 100 (very good).
                    var score = (policy.isBadThreshold - rule.value) * 100 / (policy.isBadThreshold - policy.isOkThreshold);
                    rule.score = Math.min(Math.max(Math.round(score), 0), 100);

                    // A value between 0 (abnormal) and negative-infinity (your website is a blackhole)
                    var abnormalityScore = (policy.isAbnormalThreshold - rule.value) * 100 / (policy.isAbnormalThreshold - policy.isOkThreshold);
                    rule.abnormalityScore = Math.min(Math.round(abnormalityScore), 0);

                    results[metricName] = rule;
            
            } else {

                debug('Metric %s not found for tool %s', metricName, policy.tool);

            }
        }

        debug('Rules checking finished');

        return results;
    };
};

module.exports = new RulesChecker();