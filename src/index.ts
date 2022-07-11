import { parse, ParsedCron } from './lib/parse';
import { next } from './lib/next';

/**
 * cron is assumed to be validated by AWS already
 * AWS Cron Expression specs
 * https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html#CronExpressions
 */

class AwsCronParser {
    parsedCron: ParsedCron;
    prev: Date | null;
    earliestDate: Date;
    latestDate: Date | null;
    timezone = 'local'

    constructor(cron: string, start?: Date | number, end?: Date | number, tz?: 'local' | 'utc' | 'UTC') {
        this.parsedCron = parse(cron, start, end);
        this.earliestDate = start ? new Date(start) : new Date(0);
        this.latestDate = end ? new Date(end) : null;
        this.prev = new Date(0)
        if (tz) this.timezone = tz
    }

    setTimezone(tz: 'local' | 'utc' | 'UTC') {
        this.timezone = tz
    }

    // if from is given, return next after or equal to from date
    // if from not given, give next after prev, prev is initialized as new Date(0)
    next(from?: Date | number) {
        if (from !== undefined) this.prev = next(this.parsedCron, new Date(from), this.timezone) // including from
        else if (this.prev) this.prev = next(this.parsedCron, new Date(this.prev.getTime() + this.parsedCron.duration + 60000), this.timezone)
        return this.prev;
    }

    // returns all occurences that occur within given interval
    // includes occurances that start
    range(start: number | Date, end: number | Date) {
        const first = this.next(new Date(start))
        const occurences: Date[] = []
        if (first === null) return occurences
        occurences.push(first)
        while (true) { // add end to while statement, using at(-1)
            const occurence = this.next()
            if (occurence === null ||
                occurences[occurences.length - 1].getTime() >= new Date(end).getTime()) return occurences
            occurences.push(occurence)
        }
    }

    getParsedCron() {
        return this.parsedCron
    }
}
// { ...parse, ...next, ...prev, ...desc }

export default AwsCronParser;

export * from './lib/parse'
export * from './lib/desc'
export * from './lib/next'
export * from './lib/prev'