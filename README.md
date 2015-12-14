
Reading the mind in the eyes test (RMET)
========================================
  
See http://autismresearchcentre.com/arc_tests
for details about the RMET test
 
This test can be used in two modes:
 * Standalone
 * In a group

 
Group mode
----------
 
When performing this test in a group, it will
display the current trial (eyes) on a central
screen and allows peripheral devices (e.g. tablets)
to give the responses.
 
  
Screens
-------
  
   Central                             Peripheral
   -=-=-=-                             -=-=--=-=-
   Group response                      Discuss with group
                   RMETc/started -->
                   RMETc/waiting -->
   Stimulus only                       Individual options
                   <-- RMETp/complete
   Stimulus only                       Wait for others
                   RMETc/complete -->
   
  
Communication
-------------
  
Communication between the central and peripheral
devices will occur over a messaging channel named
after the group. For example if the ParticipantID is
MyGroup_MyName_T1, then MyGroup will be the channel.
  
JSON messages are exchanged to coordinate the devices.  
Messages must have the following field:
  
 * task: "RMETc" for central or "RMETp" for peripheral
 * withinGroupId: "" for central or "T1" .. "T3" for peripheral
 * trial: Number of the current trial
 * status: See below
  
The status field can have the following values:
 * "stated": Signals start of individual phase.
 * "complete": Central computer signals start of next trial. Peripheral devices signal completion of trial.
 * "waiting": Central computer signals it is ready. Peripheral devices are waiting for participant.
 
  
Storage
-------
  
The trial results will be stored under key "RMET.[TrialNr]".
  
In case of the central computer, the list of devices that
have finished the trial is available under key 
"RMET.Central.[TrialNr].Ready".
  
In case of the peripheral devices, whether the answer is final
will be recorded under "RMET.Peripheral.[TrialNr].IsFinal".
 