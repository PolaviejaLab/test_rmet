module RMET {

/**********************************************
 * Stream datafiles and resources from server *
 **********************************************/


/**
 * Stream the array of descriptions from the server
 */
export function get_descriptions(resources: string, language: string)
{
    if(language == undefined)
        language = 'en';

    return $.ajaxAsObservable({ url: resources + 'Data/Descriptions.' + language + '.json' })
        .map(function(reply) { return reply.data } );        
}

    
/**
 * Stream the stimuli from the server
 */
export function get_stimuli(resources: string, language: string)
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
}