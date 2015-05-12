var settingsService = angular.module('settingsService', []);

settingsService.factory('Settings', ['localStorageService', function(localStorageService) {

    return {

        getMergedSettings: function() {
            var defaultSettings = {
                device: 'desktop',
                showAdvanced: false
            };
            
            var savedValues = localStorageService.get('settings');

            return angular.extend(defaultSettings, savedValues);
        },

        saveSettings: function(settings) {
            localStorageService.set('settings', settings);
        }

    };

}]);