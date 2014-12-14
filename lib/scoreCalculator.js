var Q = require('q');
var debug = require('debug')('ylt:scoreCalculator');

var ScoreCalculator = function() {
    'use strict';

    this.calculate = function(data, profile) {

        var results = {
            categories: {}
        };
        var weight;
        var categoryName;

        debug('Starting calculating scores');

        // Calculate categories
        for (categoryName in profile.categories) {
            var categoryResult = {
                label: profile.categories[categoryName].label
            };

            var sum = 0;
            var totalWeight = 0;
            var rules = [];

            for (var policyName in profile.categories[categoryName].policies) {
                weight = profile.categories[categoryName].policies[policyName];
                
                if (data.rules[policyName]) {
                    sum += data.rules[policyName].score * weight;
                } else {
                    // Max value if rule is not here
                    sum += 100 * weight;
                    debug('Warning: could not find rule %s', policyName);
                }

                totalWeight += weight;
                rules.push(policyName);
            }

            if (totalWeight === 0) {
                categoryResult.categoryScore = 100;
            } else {
                categoryResult.categoryScore = Math.round(sum / totalWeight);
            }

            categoryResult.rules = rules;
            results.categories[categoryName] = categoryResult;
        }


        // Calculate general score
        var globalSum = 0;
        var globalTotalWeight = 0;

        for (categoryName in profile.globalScore) {
            weight = profile.globalScore[categoryName];

            if (results.categories[categoryName]) {
                globalSum += results.categories[categoryName].categoryScore * weight;
            } else {
                globalSum += 100 * weight;
            }
            globalTotalWeight += profile.globalScore[categoryName];
        }

        if (globalTotalWeight === 0) {
            results.globalScore = 100;
        } else {
            results.globalScore = Math.round(globalSum / globalTotalWeight);
        }



        debug('Score calculation finished:');
        debug(results);

        return results;
    };
};

module.exports = new ScoreCalculator();