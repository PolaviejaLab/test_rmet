
experimentFrontendControllers.controller('RMET', ['$scope', '$http', '$cookies', '$controller',
  function($scope, $http, $cookies, $controller)
  {
    $scope.resources = $scope.screen.root;
    $scope.prefix += "RMET.";

    // List of all trials
    $scope.trial = {};
    $scope.trials = [];

    // Definitions for the emotions
    $scope.description = {};
    $scope.descriptions = {};


    /** Determine the mode of the RMET task **/
    if("mode" in $scope.screen.options) {
      $scope.mode = $scope.screen.options['mode'];
      
      // Invalid mode specified
      if(!($scope.mode in ["individual", "tablet", "group"]))
        $scope.mode = "individual";      
    } else {
      $scope.mode = "individual";
    }


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
      if(evt.key == 'Enter') {
        $scope.next();
        return;
      }

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


    /**
     * Changes the current trial
     * 
     * trial - number of the trial to change to
     * return - True on success, false on failure
     */
    $scope.set_trial = function(trial)
    {
      $scope.responses[ $scope.prefix + 'Page' ] = trial;
      $scope.trial = $scope.trials[$scope.get_trial()];
      
      var canvas = document.getElementById("image");
      
      if(canvas === undefined)
        return false;
      
      var context = canvas.getContext("2d");
      
      if(context === undefined)
        return false;

      context.drawImage($scope.trial.image, 0, 0, canvas.clientWidth, canvas.clientHeight);
      
      return true;
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
     * Load stimuli and call oncomplete callback
     */
    $scope.load_stimuli = function(complete_callback)
    {
      return new Promise(function(resolve, reject)
      {
        $http.get($scope.resources + 'Data/Stimuli.json').
            success(function (data, status) {
            
              var itemsLeft = data.length;
            
              // Preload all images           
              for(var i in data) {
                var path = $scope.resources + 'Faces/' + data[i].image;
                              
                data[i].image = new Image();              
                data[i].image.onload = function() {
                  itemsLeft--;
                  
                  if(itemsLeft == 0)
                    resolve();
                }.bind(this);
                
                data[i].image.onerror = function() { reject(); };              
                data[i].image.src = path;
              }
              
              // Add trials to scope
              $scope.trials = data;
              $scope.trial = data[$scope.get_trial()];          
            });
      }.bind(this));
    }
    

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
      var definition = $scope.responses[$scope.prefix + 'Definition'];
      var key = $scope.prefix + 'Definition.' + definition;

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
        } else {
          return false;
        }
      }
    }
    
    
    /**
     * Load stimuli and mark them as loaded
     */
    $scope.load_stimuli().then(function() {
      $scope.set_trial(0);
    });
  }
]);
