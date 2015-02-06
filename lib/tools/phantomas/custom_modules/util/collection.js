/**
 * Push items and count them
 */

function collection() {
    /* jshint validthis: true */
    this.items = {};
}

collection.prototype = {
    push: function(item) {
        if (typeof this.items[item] === 'undefined') {
            this.items[item] = {
                cnt: 1
            };
        } else {
            this.items[item].cnt++;
        }
    },

    sort: function() {
        var newItems = {},
            sortedKeys;

        // sort in descending order (by cnt)
        sortedKeys = Object.keys(this.items).sort((function(a, b) {
            return this.items[b].cnt - this.items[a].cnt;
        }).bind(this));

        // build new items dictionary
        sortedKeys.forEach(function(key) {
            newItems[key] = this.items[key];
        }, this);

        this.items = newItems;
        return this;
    },

    forEach: function(callback) {
        Object.keys(this.items).forEach(function(key) {
            callback(key, this.items[key].cnt);
        }, this);
    },

    has: function(item) {
        return (typeof this.items[item] !== 'undefined');
    },

    getLength: function() {
        return Object.keys(this.items).length;
    }
};

module.exports = collection;
