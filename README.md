# Recuring Events Cron Parser

A fork of [@aws-cron-parser](https://github.com/beemhq/aws-cron-parser.git)

NOTE: class not tested yet, use at own discretion

Using aws cron syntax, with a few additional features, to schedule recurring events. Built in Typescript support.
Supports events with durations, and can pass a time interval into parser that specifies the time range the cron can occur in.

Syntax: `min hr dayOfMonth month dayOfWeek year *duration* `
values in ** are optional, can be omitted

This utility was built to process AWS Cron Expressions used by Amazon CloudWatch. It can support all the specs listed in the link below, including the special wildcards L W and #.

## Specs

[AWS Cron Expression specs](https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html#CronExpressions)

## Installation

```sh
npm install recurring-event-cron-parser
```

## Usage

There are only 4 methods: `parse`, `next`, `prev`, `withinRange`

```js
import AwsCronParser from "aws-cron-parser";

const duration = 3600000

// first we need to parse the cron expression, can also include an earliest possible date and a latest possible date
const cronParser = new AwsCronParser(`9 * 7,9,11 5 ? 2020,2022,2024-2099 ${duration}`, new Date(), new Date(Date.now() + 5 * 86400000), 'local') // default tz is 'local', can use setTimezone to change, or pass into constructor, only timezones currently supported are local and utc (default)


// to get the first occurrence that ends after or at the same time as now
let occurrence = cronParser.next(new Date());

// to get the next occurrence following the previous one
occurrence = cronParser.next();

// and use prev to get the previous occurrence
occurrence = cronParser.prev();

// and use withinRange to see whether event will occur within given time frame, can pass in either number or date for start and end
occurence = cronParser.withinRange(new Date(), Date.now() + 86400000);

// use range to get dates of all events within range, includes everything that ends after start, and starts before end
const occurence: Date[] = cronParser.withinRange(new Date(), Date.now() + 86400000);

```