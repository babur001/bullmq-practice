1. 2 jobs run, order is no clear either in both or in one only 2 jobs, if concurrently is > 1.
   Events runs 2 times only, based on event listener type (on success)
2. No depends on retry count if 5 retries 5 times fail -> 10 time jobs run. Failed jobs sits as retry until the attempts dries, and then sits in failed. In queuevents 1 event for failed job, 100 attempts made still only 1 failed event in events
3. Worker logs nothingf since there no job
   QueueEvents logged nothing since there is no events fired yet, cause it catches events when redis publishes it, not it goes to redis to read the events. Because redis is fire-and-forget it just publishes the event to listener whoever catches it catches, no catches forgot event. It is like nodejs event emitter and browsers addEventListener, if you suibscribe to event you will get events from the moment you subscribed to it not old values that happened before. You wont get notification to the channel you have not been before
