/**
 * Reading the mind in the eyes test (RMET)
 * 
 * See README.md for details.
 */
(function() {
    
  experimentFrontendControllers.controller('RMET', ['$scope', '$http', '$cookies', '$controller',
    function($scope, $http, $cookies, $controller)
    {
      // Constants that represent modes
      $scope.Mode_Individual = 0;
      $scope.Mode_Central = 1;
      $scope.Mode_Peripheral = 2;

      // Resource path
      $scope.resources = $scope.screen.root;
      
      // Prefix to use for all results
      $scope.prefix += "RMET.";
  
      // Current trial and list of all trials
      $scope.trial = {};
      $scope.trials = [];
  
      // Current definition and list of definitions for the emotions
      $scope.description = {};
      $scope.descriptions = {};


      /**
      * Returns currently active mode
      */
      $scope.get_mode = function()
      {
        var modeStrings = {};
        modeStrings[$scope.Mode_Individual] = "individual"; 
        modeStrings[$scope.Mode_Central] = "central"; 
        modeStrings[$scope.Mode_Peripheral] = "peripheral";
  
        // Default to individual
        if(!("mode" in $scope.screen.options))
          return $scope.Mode_Individual;
  
        // Look for role in roleStrings array
        for(var key in modeStrings) {
          if($scope.screen.options['mode'] == modeStrings[key])
            return key;
        }
        
        // No role found
        return $scope.Mode_Individual;
      }
      

      /*****************************************
       * Final flag used by peripheral devices *
       *****************************************/


      /**
       * Returns the key that specifies whether the current response is final 
       */
      $scope.get_final_key = function()
      {
        return $scope.prefix + 'Peripheral.' + $scope.trial['id'] + '.IsFinal';
      }


      /**
       * Returns whether the current participant has given a final answer
       */
      $scope.is_final = function()
      {
        var key = $scope.get_final_key();
        
        if(key in $scope.responses)
          return $scope.responses[key];
        return false;
      }
      
      
      /**
       * Marks the current response as final
       */
      $scope.set_final = function(value)
      {
        // Default is to set it as final
        if(value === undefined)
          value = true;

        var key = $scope.get_final_key();
        $scope.responses[key] = value;

        // Send signal        
        if(value)
          signal_peripheral_complete(Channel, $scope.trial['id'], $scope.withinGroupId);
      }
      
      
      /************************************************
       * List of ready devices used by central device *
       ************************************************/
      
      
      /**
       * Returns the key that stores which clients are ready
       */
      $scope.get_ready_key = function()
      {
        return $scope.prefix + 'Central.' + $scope.trial['id'] + '.Ready';
      }
      
      
      /**
       * Mark a peripheral device as ready
       */
      $scope.mark_ready = function(clientId)
      {
        var key = $scope.get_ready_key();
        
        if(!(key in $scope.responses))
          $scope.responses[key] = [];
        
        if($scope.responses[key].indexOf(clientId) == -1) 
          $scope.responses[key].push(clientId);

        return $scope.get_ready_count();
      }
      
      
      /**
       * Returns the number of clients that are marked as ready for the current trial
       */
      $scope.get_ready_count = function()
      {
        var key = $scope.get_ready_key();
        
        if(!(key in $scope.responses))
          return 0;

        return $scope.responses[key].length;
      }
      
      
      /*****************************************
       * Manipulate current trial and response *
       *****************************************/
      
      
      /**
       * Changes the current trial
       * 
       * trialNr - number of the trial to change to
       * return - True on success, false on failure
       */
      $scope.set_trial = function(trialNr)
      {
        $scope.responses[ $scope.prefix + 'Page' ] = trialNr;
        $scope.trial = $scope.trials[$scope.get_trial()];
              
        var canvasId = "image";
        var canvas = document.getElementById(canvasId);
        
        if(canvas === null) {
          console.log("Could not find canvas element with id", canvasId);        
          return false;
        }
        
        var context = canvas.getContext("2d");
        
        if(context === null) {
          console.log("Unable to obtain context for canvas with id", canvasId);
          return false;
        }
    
        context.drawImage($scope.trial.image, 0, 0, canvas.clientWidth, canvas.clientHeight);

        if($scope.get_mode() == $scope.Mode_Central)
          signal_central_waiting(Channel, $scope.trial['id']);

        return true;
      }
  
  
      /**
       * Returns the currently active trial number - not the Id!
       */
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
      * Return index (0..3) of the current response
      */
      $scope.get_response_index = function()
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
      * navigate through options. Return will move
      * to the next trial.
      */
      $scope.handle_keyboard_event = function(evt)
      {
        if($scope.get_mode() == $scope.Mode_Central)
          return;
        
        if(evt.key == 'Enter' && $scope.get_mode() == $scope.Mode_Individual) {
          $scope.next();
          return;
        }
  
        var key = $scope.prefix + $scope.trial.id;
        var value = $scope.get_response_index();
    
        // Array that maps keyboard key and current value to next value
        var keyboardMap = { 
          "1": { undefined: 0, 1: 0, 2: 0, 3: 0, 4: 0},
          "2": { undefined: 1, 1: 1, 2: 1, 3: 1, 4: 1},
          "3": { undefined: 2, 1: 2, 2: 2, 3: 2, 4: 2},
          "4": { undefined: 3, 1: 3, 2: 3, 3: 3, 4: 3},
          "ArrowLeft":  { undefined: 0, 1: 0, 3: 2 },
          "ArrowRight": { undefined: 0, 0: 1, 2: 3 },
          "ArrowUp":    { undefined: 0, 2: 0, 3: 1 },
          "ArrowDown":  { undefined: 0, 0: 2, 1: 3 }
        };
  
        if(evt.key in keyboardMap && value in keyboardMap[evt.key])
          value = keyboardMap[evt.key][value];        
  
        $scope.responses[key] = $scope.trial.options[value];
      }      
      
      
      /**********************
       * Manage definitions *
       **********************/
      

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
      
      
      /**
       * Handle next/previous
       * 
       * Because code is shared between the three different modes of operation,
       * the next button is handled differently for the RMET task.
       * 
       *  - Individual: check is_next_allowed() and move to next screen
       *  - Central: move to next screen
       *  - Peripheral: if control signal arrived: move to next screen
       *                if button clicked: mark trial as "ready"
       *
       * To this end, the peripheral mode uses a different button
       *  that invokes the mark_ready() function instead. That way we
       *  can keep the next() implementation as-is. 
       */

  
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
       *
       * Central is always able to invoke next().
       * 
       * Clicking next on peripheral should only mark 
       * the trial as complete. Only reception of the 
       * "complete" message from the server should
       * progress the trial.
       * 
       * Individual should check is_next_allowed().
      */
      $scope.next = function()
      {
        // Check whether next is allowed
        if(!$scope.is_next_allowed() && !debug)
          return;
  
        // Continue with next screen
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
      
      
      /**************
       * Start task *
       **************/
      
      
      /**
      * Extract parts from participantId
      */
      $scope.extract_participant_id = function()
      {
        var participantId = $scope.responses['ParticipantID'];
        
        if(participantId === undefined)
          return false;
        
        var parts = participantId.split("_")
        
        $scope.groupId = parts[0];
              
        if(parts.length >= 2)
          $scope.withinGroupId = parts[2];
          
        return true;        
      }
      
     
      // Split participant id into parts
      $scope.extract_participant_id();
      
  
      /**
      * Setup messaging channel
      */
      var Channel = Messaging.subscribe($scope.groupId);
      
      Channel.subscribe(function(msg) { console.log("Got message:", msg) });
      
      // Mark msg.trial as complete for msg.withinGroupId
      Channel
        .filter(function(msg) { return msg.task == "RMETp" && msg.status == "complete" })
        .filter(function(msg) { return $scope.trial['id'] == msg.trial; })
        .subscribe(function(msg) {
          if($scope.get_mode() != $scope.Mode_Central)
            return;
                    
          $scope.mark_ready(msg.withinGroupId);

          // All clients present, continue to next trial          
          if($scope.get_ready_count() == 3) {
            signal_central_complete(Channel, $scope.trial['id']);
            $scope.next();            
          }          
        });
      
      // Send status
      Channel
        .filter(function(msg) { return msg.task == "RMETc" && msg.status == "waiting" })
        .subscribe(function(msg) {
          if($scope.get_mode() != $scope.Mode_Peripheral)
            return;
           
          if($scope.is_final())
            signal_peripheral_complete(Channel, $scope.trial['id'], $scope.withinGroupId);
        });
  
      // Move to next stimulus
      Channel
        .filter(function(msg) { return msg.task == "RMETc" && msg.status == "complete" })
        .subscribe(function(msg) {
          if($scope.get_mode() == $scope.Mode_Peripheral)
            $scope.next(); 
         });
  
      
      /**
       * Populate list of definitions
       */
      get_descriptions($scope.resources, 'en').subscribe(
        function(descriptions) { $scope.descriptions = descriptions; },
        function(error) { console.log("Could not load descriptions:", error); },
        function() { }
      );
  
  
      /**
       * Get stimuli and start experiment
       */
      get_stimuli($scope.resources, 'en').subscribe(
        function(trial) { $scope.trials.push(trial); },
        function(error) { console.log("Could not load stimuli:", error); },
        function() { $scope.$apply(function() { $scope.set_trial(0); }); }
      );    
    }
  ]);


  /**********************************************
   * Stream datafiles and resources from server *
   **********************************************/


  /**
   * Stream the array of descriptions from the server
   */
  var get_descriptions = function(resources, language)
  {
    if(language == undefined)
      language = 'en';
    
    return $.ajaxAsObservable({ url: resources + 'Data/Descriptions.' + language + '.json' })
      .map(function(reply) { return reply.data } );        
  }

      
  /**
   * Stream the stimuli from the server
   */
  var get_stimuli = function(resources, language)
  {
    if(language == undefined)
      language = 'en';
    
    return $.ajaxAsObservable({ url: resources + 'Data/Stimuli.' + language + '.json' })
      .map(function(reply) { return reply.data } )
      .flatMap(function(reply) { return Rx.Observable.fromArray(reply); })

      // Load images
      .flatMap(function(trial) {          
        var path = resources + 'Faces/' + trial.image;
        
        return Rx.Observable.create(function(observer) {
          trial.image = new Image();
          trial.image.onload = function() { observer.onNext(trial); observer.onCompleted(); };
          trial.image.onerror = function(error) { observer.onError(error); };
          trial.image.src = path;              
        });        
      });
  }


  /*********************************
   * Send signals to other clients *
   *********************************/


  /**
   * Sends a signal that indicates that the central RMET is waiting for data
   */
  function signal_central_waiting(channel, trialId)
  {
    var message = {
      "task": "RMETc",
      "withinGroupId": "",
      "trial": trialId,
      "status": "waiting" 
    };
    
    channel.onNext(message);
  }  
  
  
  /**
   * Sends a signal that indicates the trial is complete
   */
  function signal_central_complete(channel, trialId)
  {
    var message = {
      "task": "RMETc",
      "withinGroupId": "",
      "trial": trialId,
      "status": "complete"
    };
    
    channel.onNext(message);
  }      
  
  
  /**
   * Sends a signal that indicates the peripheral device is ready
   */
  function signal_peripheral_complete(channel, trialId, withinGroupId)
  {
    var message = {
      "task": "RMETp",
      "withinGroupId": withinGroupId,
      "trial": trialId,
      "status": "complete"
    };

    channel.onNext(message);
  }


}());
