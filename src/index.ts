import { parse, ParsedCron, ParsedRate, validateParsedRule, } from './lib/parse';
import { nextCron, nextRate } from './lib/next';
import { getScheduleDescription } from './lib/desc'
import { convertLocalDaysOfWeekToUTC, getLocalDays, } from './lib/local';

/**
 * cron is assumed to be validated by AWS already
 * cron is always stored in UTC
 * AWS Cron Expression specs
 * https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html#CronExpressions
 */

/**
 * Every 5 minutes: rate(5 minutes, 3600000)
 * Every hour: rate(1 hour)
 * Every seven days: rate(7 days)
 */

class EventCronParser {
    #cron: string; // can be either a cron or a rate expression
    parsedCron: ParsedCron | ParsedRate;
    #prevDate: Date | null;
    earliestDate: Date;
    latestDate: Date | null;
    #isRateExpression: boolean;

    // cron can be rate as well, maybe call it schedule instead?
    constructor(cron: string, start?: Date | number, end?: Date | number) {
        if (cron.startsWith('rate(') && cron.at(-1) === ')') {
            this.#isRateExpression = true;
        } else {
            this.#isRateExpression = false;
        }
        this.#cron = cron;
        this.#prevDate = new Date(0) // first occurrence will still be after start, cuz start put in parse
        this.latestDate = end ? new Date(end) : null;
        this.earliestDate = start ? new Date(start) : new Date(0);
        this.parsedCron = parse(this.#cron, start, end, this.#isRateExpression);
    }

    // if from is given, return next after or equal to from date
    // if from not given, give next after prev, prev is initialized as new Date(0)
    next(from?: Date | number, inclusive = false) {
        if (this.#isRateExpression) {
            let nextDate = nextRate(<ParsedRate>this.parsedCron, from || this.#prevDate, inclusive)
            this.#prevDate = nextDate
            return nextDate
        }
        const cron = this.parsedCron as ParsedCron
        if (from !== undefined) this.#prevDate = nextCron(cron, new Date(from), cron.duration, inclusive) // including from
        else if (this.#prevDate) this.#prevDate = nextCron(cron, new Date(this.#prevDate.getTime() + cron.duration), cron.duration, inclusive) // !!! not sure if i should be adding duration but seems right in next()?
        return this.#prevDate;
    }

    setRate(value: number, unit: string, duration = 0, start=this.earliestDate, end=this.latestDate) {
        this.#isRateExpression = true;
        const newCron = `rate(${value} ${unit}, ${duration})`
        this.#cron = newCron
        this.latestDate = end;
        this.earliestDate = start;
        this.parsedCron = parse(newCron, start, end || undefined, true);
    }

    setCron(cron: string, start=this.earliestDate, end = this.latestDate) {
        if (cron.startsWith('rate(') && cron.at(-1) === ')') {
            this.#isRateExpression = true;
        } else {
            this.#isRateExpression = false;
        }
        this.latestDate = end;
        this.earliestDate = start;
        this.#cron = cron;
        this.parsedCron = parse(this.#cron, start, end || undefined, this.#isRateExpression);
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

    // check if an event occurs within the range start-end i think exclusive but not sure
    isInRange(start: number | Date, end: number | Date) {
        const first = this.next(new Date(start))
        return first && first.getTime() < end
    }

    desc(timezone = 'local' as 'local' | 'utc') {
        return getScheduleDescription(this.parsedCron, this.#isRateExpression, timezone)
    }

    // returns days of week in local time
    getLocalDays() { // should only be called if cron not rate expression
        if (this.#isRateExpression) return []
        return getLocalDays(<ParsedCron>this.parsedCron)
    }

    // hours and minutes are in UTC, preserveLocalDaysOfWeek keeps the local days the same regardless of how hour + minutes change 
    setUTCHours(hours: number[], minutes?: number[], preserveLocalDaysOfWeek = false) {
        if (this.#isRateExpression) {
            this.earliestDate.setUTCHours(hours[0], minutes && minutes[0])
            return
        }

        const cron = <ParsedCron>this.parsedCron

        const localDays = getLocalDays(cron)
        // if (preserveLocalDaysOfWeek) {
        //     const oldDate = new Date()
        //     oldDate.setUTCHours(this.parsedCron.hours[0] as number, this.parsedCron.minutes[0] as number,0,0)

        //     const newDate = new Date()
        //     newDate.setUTCHours(hours[0], minutes ? minutes[0] : this.parsedCron.minutes[0] as number,0,0)

        //     // check if same utcday but different localday
        //     const oldLocalDay = nextUTCDay(oldDate, 1).getDay()
        //     const newLocalDay = nextUTCDay(newDate, 1).getDay()

        //     if (oldLocalDay !== newLocalDay) {
        //         // change hours then set days of week again
        //         this.setDaysOfWeek(localDays, 'local')
        //     }
        // }

        const cronArray = this.#cron.split(' ')
        cronArray[1] = hours.join(',')
        if (minutes)
            cronArray[0] = minutes.join(',')
        this.#cron = cronArray.join(' ')

        cron.hours = hours
        if (minutes)
            cron.minutes = minutes

        if (preserveLocalDaysOfWeek)
            this.setDaysOfWeek(localDays, 'local')
    }

    setDaysOfWeek(daysOfWeek: number[], timezone = 'utc' as 'local' | 'utc') {
        if (this.#isRateExpression) return []
        const parsedCron = <ParsedCron>this.parsedCron
        // 1. convert daysOfWeek to UTC
        // 2. update cron
        const updated = timezone === 'utc' ? daysOfWeek : convertLocalDaysOfWeekToUTC(daysOfWeek, parsedCron)
        const cronArray = this.#cron.split(' ')
        cronArray[4] = updated.join(',')
        this.#cron = cronArray.join(' ')
        parsedCron.daysOfWeek = updated

        return updated;
    }

    getCron() {
        return this.#cron
    }

    isRateExpression() {
        return this.#isRateExpression
    }

    validate() {
        if (isNaN(this.parsedCron.duration)) throw new Error('invalid duration')
        if (this.#isRateExpression) {
            return // validated in parse
        }
        const parsedCron = <ParsedCron>this.parsedCron
        validateParsedRule(parsedCron.minutes)
        validateParsedRule(parsedCron.hours)
        validateParsedRule(parsedCron.daysOfMonth)
        validateParsedRule(parsedCron.months)
        validateParsedRule(parsedCron.daysOfWeek)
        validateParsedRule(parsedCron.years)
    }
}

export default EventCronParser;