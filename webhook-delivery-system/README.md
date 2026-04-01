> flow: 
	- a company/app's backend gives our system a url/an event type
	- the company/app's backend is basically now a subscriber 
	- something happens in our webhook delivery system backend (event)
	- we check : which subscriber wanted this event
	- if matches, then send them the data


> real world example/analogy:
	- youtube notifications:
		- you subscribe to a channel, you choose all videos/specific notifications
		- now when a youtube video is uploaded (event), youtube (our backend) checks which users (subscribers) needed the notification of this video(event-subscriber match), and send to only them



> who is a subscriber?
	- someone who wants to be notified when something happens, via webhooks 



> each folder/file function, explained:
1. modules/subscription/
	- create + store subscription
	- db related only

2. modules/event/
	- receive events
	- stores events
	- find matching subscriptions
	- (and then) enqueue jobs

3. modules/delivery/
	- takes event and subscription
	- generates HMAC > sends HTTP request > return result

4. queues/
	- defines BULLMQ queue
	- used by event.service(producer)

5. workers/
	- pulls jobs from queue
	- calls delivery.service
	- handlers retry automatically 

6. utils/
	- helpers



---
> Flow mapped from files:
POST /subscriptions
-> subscription.routes
-> subscription.service
-> DB

POST /emit
-> event.routes
-> event.service (stores event, finds matching subscriptions, enqueue)
	
QUEUE:
->delivery.worker
	->delivery.service
		->sends webhook (HTTP)
		->generate HMAC
		->log results

---
Two external requests exposed
1. Subscriptions: posts -> notify me when xyz event happens
2. Events: posts -> xyz just happened
Then we:
	Match > create a webhook > send back the notification to subscriber


> NOTE: replay functionality:
	- if eventId given, it fetches the event > find subscriptions for that event.type> enqueue jobs again for it , basically re-run the pipeline again
	