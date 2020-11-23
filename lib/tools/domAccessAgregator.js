var debug   = require('debug')('ylt:domAccessAgregator');

var domAccessAgregator = function() {
    'use strict';

    this.agregate = function(data) {
        debug('Starting to agregate DOM Accesses...');

        let count = 0;
        let offenders = {
            byType: {}
        };

        const metricsToGather = [
            'DOMqueriesById',
            'DOMqueriesByTagName',
            'DOMqueriesByClassName',
            'DOMqueriesByQuerySelectorAll',
            'DOMinserts',
            'DOMmutationsInserts',
            'DOMmutationsRemoves',
            'DOMmutationsAttributes',
            'eventsBound'
        ];

        metricsToGather.forEach(key => {
            
            if (data.toolsResults.phantomas.metrics[key]) {
                count += data.toolsResults.phantomas.metrics[key];
            }
            
            offenders.byType[key] = [];
            if (data.toolsResults.phantomas.offenders[key]) {
                offenders.byType[key] = data.toolsResults.phantomas.offenders[key];
            }
        });

        data.toolsResults.domAccessAgregator = {
            metrics: {
                DOMaccesses: count
            },
            offenders: {
                DOMaccesses: offenders
            }
        };

        debug('Done agregating DOM Accesses.');

        return data;
    };
};

module.exports = new domAccessAgregator();