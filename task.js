
experimentFrontendControllers.controller('RMET', ['$scope', '$http', '$cookies', '$controller',
  function($scope, $http, $cookies, $controller)
  {
    $scope.resources = $scope.screen.root;
    $scope.prefix += "RMET.";

    $controller('Keyboard', {$scope: $scope});

    // List of all trials
    $scope.trial = {};
    $scope.trials = [];

    // Definitions for the emotions
    $scope.description = {};
    $scope.descriptions = {};


    /**
     * Return index (0..3) of the current response
     */
    function get_response_index()
    {
      var key = $scope.prefix + $scope.trial.id;
      
      // Options
      var options = $scope.trial.options;      
      
      // Find ID of response given value
      if(key in $scope.responses) {
        // Current response
        var response = $scope.responses[key];       
        
        // Loop over options and return index if matches
        for(var i = 0; i < options.length; i++) {
          if(options[i] == response) {
            return i;
          }
        }        
      }      

      return undefined;
    }


    /**
     * Allow number keys (1..4) and arrow keys to 
     * navigate through options.
     */
    $scope.handle_keyboard_event = function(evt)
    {
      var key = $scope.prefix + $scope.trial.id;      
      var value = get_response_index();
            
      // Set response using keys 1..4
      if(evt.key >= "1" && evt.key <= "4")
      {
        var option = $scope.trial.options[evt.key - 1];        
        $scope.responses[key] = option;
        return;
      }
      
      // Allow the use of arrow keys
      if(evt.key == 'ArrowLeft')
      {
        if(value == undefined) value = 0;
        if(value == 1) value = 0;
        if(value == 3) value = 2;
      }
      
      if(evt.key == 'ArrowRight')
      {
        if(value == undefined) value = 1;
        if(value == 0) value = 1;
        if(value == 2) value = 3;
      }
           
      if(evt.key == 'ArrowUp')
      {
        if(value == undefined) value = 0;
        if(value == 2) value = 0;
        if(value == 3) value = 1;
      }
      
      if(evt.key == 'ArrowDown')
      {
        if(value == undefined) value = 2;
        if(value == 0) value = 2;
        if(value == 1) value = 3;
      }

      $scope.responses[key] = $scope.trial.options[value];
    }


    $scope.set_trial = function(trial) 
    {
      $scope.responses[ $scope.prefix + 'Page' ] = trial;
    }


    $scope.get_trial = function() 
    {
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
    $scope.mark_definition_request = function() 
    {
      var key = $scope.prefix + 'Definition.' + $scope.emotion;

      if(!(key in $scope.responses)) {
        $scope.responses[key] = 0;
      }

      $scope.responses[key] += 1;
    }


    $scope.is_next_allowed = function() 
    {
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
    $scope.next = function() 
    {
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
    $scope.previous = function() 
    {
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
