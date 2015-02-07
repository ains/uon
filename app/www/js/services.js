angular.module('starter.services', [])

.factory('Settings', function() {
  return {
    getSettings: function() {
      try {
        return JSON.parse(localStorage.getItem('user_settings'));
      } catch (e) {
        return null;
      }
    },
    saveSettings: function(settings) {
      localStorage.setItem('user_settings', JSON.stringify(settings));
    },
    clearSettings: function() {
      localStorage.removeItem('user_settings');
    }
  }
})

.factory('Decision', function($http, Settings, apiRoot) {
  return {
    getDecision: function(lat, lon) {
      $http.get(apiRoot + )
      return friends;
    },
    get: function(friendId) {
      // Simple index lookup
      return friends[friendId];
    }
  }
});
