var policies = {

    "metric1": {
        "tool": "tool1",
        "label": "The metric 1",
        "message": "A great message",
        "isOkThreshold": 1000,
        "isBadThreshold": 3000,
        "isAbnormalThreshold": 5000,
        "hasOffenders": false
    },
    "metric2": {
        "tool": "tool1",
        "label": "The metric 2",
        "message": "A great message",
        "isOkThreshold": 1000,
        "isBadThreshold": 3000,
        "isAbnormalThreshold": 5000,
        "takeOffendersFrom": "metric3",
        "hasOffenders": true,
        "offendersTransformFn": function(offenders) {
            return {
                count: 2,
                str: offenders.join(' - ')
            };
        }
    },
    "metric3": {
        "tool": "tool1",
        "label": "The metric 3",
        "message": "A great message",
        "isOkThreshold": 1000,
        "isBadThreshold": 3000,
        "isAbnormalThreshold": 5000,
        "hasOffenders": true,
        "offendersTransformFn": function(offenders) {
            return {
                count: 2,
                test: offenders.join('/')
            };
        }
    },
    "metric4": {
        "tool": "tool1",
        "label": "The metric 4",
        "message": "A great message",
        "isOkThreshold": 1000,
        "isBadThreshold": 3000,
        "isAbnormalThreshold": 5000,
        "hasOffenders": true,
    },
    "metric5": {
        "tool": "tool1",
        "label": "The metric 5",
        "message": "A great message",
        "isOkThreshold": 1000,
        "isBadThreshold": 3000,
        "isAbnormalThreshold": 5000,
        "hasOffenders": true,
        "takeOffendersFrom": ["metric3", "metric4"]
    },
    "metric6": {
        "tool": "tool1",
        "label": "The metric 6",
        "message": "A great message",
        "isOkThreshold": 1000,
        "isBadThreshold": 3000,
        "isAbnormalThreshold": 5000
    },
    "metric7": {
        "tool": "tool1",
        "label": "The metric 7",
        "message": "A great message",
        "isOkThreshold": 1000,
        "isBadThreshold": 3000,
        "isAbnormalThreshold": 5000
    },

    "metric10": {
        "tool": "tool2",
        "label": "The metric 10",
        "message": "<p>This is from another tool!</p>",
        "isOkThreshold": 0,
        "isBadThreshold": 3,
        "isAbnormalThreshold": 11,
        "hasOffenders": false,
    },

    "unexistantMetric": {
        "tool": "tool1",
        "label": "",
        "message": "",
        "isOkThreshold": 1000,
        "isBadThreshold": 3000,
        "isAbnormalThreshold": 5000,
        "hasOffenders": true
    },
    "unexistantTool": {
        "tool": "unexistant",
        "isOkThreshold": 1000,
        "isBadThreshold": 3000,
        "isAbnormalThreshold": 5000,
        "hasOffenders": false
    }
};

module.exports = policies;