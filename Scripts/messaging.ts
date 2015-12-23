
namespace RMET
{

/*********************************
 * Send signals to other clients *
 *********************************/


/**
 * Sends a signal that indicates that the central RMET is waiting for data
 */
export function signal_central_waiting(channel, trialId: string): void
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
export function signal_central_complete(channel, trialId: string): void
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
export function signal_peripheral_complete(channel, trialId: string, withinGroupId: number): void
{
    var message = {
        "task": "RMETp",
        "withinGroupId": withinGroupId,
        "trial": trialId,
        "status": "complete"
    };

    channel.onNext(message);
}    
}