# Recuring Events Cron Parser

A fork of [@aws-cron-parser](https://www.npmjs.com/package/aws-cron-parser)

[![npm](https://img.shields.io/npm/v/aws-cron-parser)](https://www.npmjs.com/package/aws-cron-parser)
[![circleci](https://circleci.com/gh/beemhq/aws-cron-parser.svg?style=shield)](https://app.circleci.com/pipelines/github/beemhq/aws-cron-parser)
[![benchmark](https://img.shields.io/badge/benchmark-129%2C287%20ops%2Fsec-informational)](https://runkit.com/vinhtnguyen/aws-cron-parser---benchmark)
[![codacy](https://app.codacy.com/project/badge/Grade/6c1314916ad54dbfbe1a4698af373883)](https://app.codacy.com/manual/vinhtnguyen/aws-cron-parser/dashboard)

Using aws cron syntax, with a few additional features, to schedule recurring events. Built in Typescript support.
Supports events with durations, and can pass a time interval into parser that specifies the time range the cron can occur in.

Syntax: `min hr dayOfMonth month dayOfWeek year *duration* `
values in ** are optional, can be omitted

This utility was built to process AWS Cron Expressions used by Amazon CloudWatch. It can support all the specs listed in the link below, including the special wildcards L W and #.

## Specs

[AWS Cron Expression specs](https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html#CronExpressions)

## Installation

```sh
npm install event-cron-parser
```

## Usage

There are only 4 methods: `parse`, `next`, `prev`, `withinRange`

```js
import awsCronParser from "aws-cron-parser";

const duration = 3600000

// first we need to parse the cron expression, can also include an earliest possible date and a latest possible date
const cron = awsCronParser.parse(`9 * 7,9,11 5 ? 2020,2022,2024-2099 ${duration}`, new Date(), new Date(Date.now() + 5 * 86400000));

// to get the first occurrence that ends after now
// only timezones currently supported are local and utc (default)
let occurrence = awsCronParser.next(cron, new Date(), 'local');

// to get the next occurrence following the previous one
occurrence = awsCronParser.next(cron, new Date(occurrence.getTime() + cron.duration + 60000) , 'UTC');

// occurrence = awsCronParser.next(cron, new Date(occurrence.getTime() + duration + 60000) , 'UTC');

// and use prev to get the previous occurrence
occurrence = awsCronParser.prev(cron, occurrence);

// and use withinRange to see whether event will occur within given time frame, can pass in either number or date for start and end
occurence = awsCronParser.withinRange(cron, new Date(), Date.now() + 86400000);

```