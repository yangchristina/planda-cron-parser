import { parse, ParsedCron, } from './lib/parse';
import { next } from './lib/next';
import { getScheduleDescription } from './lib/desc'

/**
 * cron is assumed to be validated by AWS already
 * cron is always stored in UTC
 * AWS Cron Expression specs
 * https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html#CronExpressions
 */

class AwsCronParser {
    cron: string;
    parsedCron: ParsedCron;
    #prevDate: Date | null;
    earliestDate: Date;
    latestDate: Date | null;

    constructor(cron: string, start?: Date | number, end?: Date | number,) {
        this.cron = cron;
        this.parsedCron = parse(cron, start, end);
        this.earliestDate = start ? new Date(start) : new Date(0);
        this.latestDate = end ? new Date(end) : null;
        this.#prevDate = new Date(0)


    }

    // if from is given, return next after or equal to from date
    // if from not given, give next after prev, prev is initialized as new Date(0)
    next(from?: Date | number) {
        if (from !== undefined) this.#prevDate = next(this.parsedCron, new Date(from)) // including from
        else if (this.#prevDate) this.#prevDate = next(this.parsedCron, new Date(this.#prevDate.getTime() + this.parsedCron.duration + 60000))
        return this.#prevDate;
    }

    // TODO !!!
    prev() {
        return
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

    isInRange(start: number | Date, end: number | Date) {
        return this.range(start, end).length > 0
    }

    desc(timezone = 'local' as 'local' | 'utc') {
        return getScheduleDescription(this.parsedCron, timezone)
    }
}
// { ...parse, ...next, ...prev, ...desc }

export default AwsCronParser;

export * from './lib/parse'
export * from './lib/desc'
export * from './lib/next'
export * from './lib/prev'