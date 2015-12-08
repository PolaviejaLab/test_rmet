/**
 * Reading the mind in the eyes test
 * 
 * This test can be used in two modes:
 *   - Standalone
 *   - In a group
 * 
 * Group mode
 * ----------
 * 
 * When performing this test in a group, it will
 * display the current trial (eyes) on a central
 * screen and allows peripheral devices (e.g. tablets)
 * to give the responses.
 * 
 * Communication
 * -------------
 * 
 * Communication between the central and peripheral
 * devices will occur over a messaging channel named
 * after the group. For example if the ParticipantID is
 * MyGroup_MyName_T1, then MyGroup will be the channel.
 * 
 * JSON messages are exchanged to coordinate the devices.  
 * Messages must have the following field:
 * 
 *   task: "RMETc" for central or "RMETp" for peripheral
 *   withinGroupId: "" for central or "T1" .. "T3" for peripheral
 *   trial: Number of the current trial
 *   status: See below
 * 
 * The status field can have the following values:
 *   "complete": Central computer signals start of next trial
 *               Peripheral devices signal completion of trial
 *   "waiting": Central computer signals it is ready
 *              Peripheral devices are waiting for participant
 * 
 * Storage
 * -------
 * 
 * The trial results will be stored under key "RMET.[TrialNr]".
 * 
 * In case of the central computer, the list of devices that
 * have finished the trial is available under key 
 * "RMET.Central.[TrialNr].Ready".
 * 
 * In case of the peripheral devices, whether the answer is final
 * will be recorded under "RMET.Peripheral.[TrialNr].IsFinal".
 */


experimentFrontendControllers.controller('RMET', ['$scope', '$http', '$cookies', '$controller',
  function($scope, $http, $cookies, $controller)
  {
    // Constants that represent modes
    $scope.Mode_Individual = 0;
    $scope.Mode_Central = 1;
    $scope.Mode_Peripheral = 2;
    
    
    /**
     * Returns currently active mode
     */
    function get_mode()
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
    
    
    /**
     * Extract parts from participantId
     */
    function extract_participant_id()
    {
      var participantId = $scope.responses['ParticipantID'];
      var parts = participantId.split("_")
      
      $scope.groupId = parts[0];
            
      if(parts.length >= 2)
        $scope.withinGroupId = parts[2];        
    }
    
    
    
    $scope.resources = $scope.screen.root;
    $scope.prefix += "RMET.";

    // List of all trials
    $scope.trial = {};
    $scope.trials = [];

    // Definitions for the emotions
    $scope.description = {};
    $scope.descriptions = {};


    // Split participant id into parts
    extract_participant_id();
    

    /**
     * Setup messaging channel
     */
    var Channel = Messaging.subscribe($scope.groupId);
    
    Channel
      .filter(function(msg) { return msg.task == "RMETt" && msg.status == "complete" })
      .subscribe(function(msg) { }); // Mark mask.trial as complete for msg.withinGroupId
    
    // Send status
    Channel
      .filter(function(msg) { return msg.task == "RMETg" && msg.status == "waiting" })
      .subscribe(function(msg) { }); 

    // Move to next stimulus
    Channel
      .filter(function(msg) { return msg.task == "RMETg" && msg.status == "complete" })
      .subscribe(function(msg) { $scope.next(); });


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
     * Load list of descriptions from server
     */
    var get_descriptions = function(resources, language)
    {
      if(language == undefined)
        language = 'en';
      
      return Rx.Observable.fromPromise($http.get(resources + 'Data/Descriptions.' + language + '.json'))
        .map(function(reply) { return reply.data } );        
    }

        
    /**
     * Load stimuli and call oncomplete callback
     */
    var get_stimuli = function(resources, language)
    {
      if(language == undefined)
        language = 'en';
      
      return Rx.Observable.fromPromise($http.get(resources + 'Data/Stimuli.' + language + '.json'))
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
