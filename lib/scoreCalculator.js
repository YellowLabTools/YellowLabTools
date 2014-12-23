var Q = require('q');
var debug = require('debug')('ylt:scoreCalculator');

var ScoreCalculator = function() {
    'use strict';

    this.calculate = function(data, profile) {

        var results = {
            categories: {}
        };
        var categoryScore;
        var categoryName;
        var weight;

        debug('Starting calculating scores');

        // Calculate categories
        for (categoryName in profile.categories) {
            var categoryResult = {
                label: profile.categories[categoryName].label
            };

            categoryScore = new ScoreMerger();
            var rules = [];
            var policyScore;

            for (var policyName in profile.categories[categoryName].policies) {
                weight = profile.categories[categoryName].policies[policyName];
                
                if (data.rules[policyName]) {
                    policyScore = data.rules[policyName].score + (data.rules[policyName].abnormalityScore * 2);
                    categoryScore.push(policyScore, weight);
                } else {
                    debug('Warning: could not find rule %s', policyName);
                }

                rules.push(policyName);
            }

            categoryResult.categoryScore = categoryScore.getScore();

            categoryResult.rules = rules;
            results.categories[categoryName] = categoryResult;
        }


        // Calculate general score
        var globalScore = new ScoreMerger();

        for (categoryName in profile.globalScore) {
            weight = profile.globalScore[categoryName];

            if (results.categories[categoryName]) {
                globalScore.push(results.categories[categoryName].categoryScore, weight);
            }
        }

        results.globalScore = Math.round(globalScore.getScore());


        debug('Score calculation finished:');
        debug(results);

        return results;
    };


    var ScoreMerger = function() {
        var sum = 0;
        var totalWeight = 0;

        this.push = function(score, weight) {
            sum += (100 - score) * weight;
            totalWeight += weight;
        };

        this.getScore = function() {
            if (totalWeight === 0) {
                return 100;
            }
            return Math.round(100 - (sum / totalWeight));
        };
    };
};

module.exports = new ScoreCalculator();