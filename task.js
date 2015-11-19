
experimentFrontendControllers.controller('RMET', ['$scope', '$http', '$cookies',
  function($scope, $http, $cookies)
  {
    $scope.resources = $scope.screen.root;
    $scope.prefix += "RMET.";

    // List of all trials
    $scope.trial = {};
    $scope.trials = [];

    // Definitions for the emotions
    $scope.description = {};
    $scope.descriptions = {};


    $scope.set_trial = function(trial) {
      $scope.responses[ $scope.prefix + 'Page' ] = trial;
    }


    $scope.get_trial = function() {
      var trial = $scope.responses[ $scope.prefix + 'Page' ];

      if(trial === undefined) {
        $scope.set_trial(0);
        return 0;
      }

      return parseInt(trial);
    }


    /**
     * Populate list of trials
     */
    $http.get($scope.resources + 'Data/Stimuli.json').
        success(function (data, status) {
          $scope.trials = data;
          $scope.trial = data[$scope.get_trial()];
        });


    /**
     * Populate list of definitions
     */
    $http.get($scope.resources + 'Data/Descriptions.json').
      success(function (data, status) {
        $scope.descriptions = data;
      });


    /**
     * Keeps track of when a user requests the definition of an emotion
     */
    $scope.mark_definition_request = function() {
      var key = $scope.prefix + 'Definition.' + $scope.emotion;

      if(!(key in $scope.responses)) {
        $scope.responses[key] = 0;
      }

      $scope.responses[key] += 1;
    }


    $scope.is_next_allowed = function() {
      if($scope.get_trial() in $scope.trials)
      {
        var key = $scope.trials[$scope.get_trial()].id;
        return ($scope.prefix + key) in $scope.responses;
      } else {
        return false;
      }
    }

    /**
     * Move to the next trial
     */
    $scope.next = function() {
      if(!$scope.is_next_allowed() && !debug)
        return;

      if($scope.get_trial() + 1 >= $scope.trials.length) {
        $scope.next_screen();

        var id = $scope.prefix + "BalanceUpdate";
        $scope.update_balance(id, 0.10);
      } else {
        $scope.responses[$scope.prefix + 'Definition'] = "";
        $scope.set_trial($scope.get_trial() + 1);
        $scope.trial = $scope.trials[$scope.get_trial()];
      }
    }


    /**
     * Move to previous trial
     */
    $scope.previous = function() {
      if(!$scope.is_previous_allowed() && !debug)
        return;

      if($scope.get_trial() == 0) {
        $scope.previous_screen();
      } else {
        if($scope.get_trial() in $scope.trials)
        {
          $scope.responses[$scope.prefix + 'Definition'] = "";
          $scope.set_trial($scope.get_trial() - 1);
          $scope.trial = $scope.trials[$scope.get_trial()];
        } else {
          return false;
        }
      }
    }
  }
]);
