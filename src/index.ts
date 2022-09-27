import { parse, ParsedCron, } from './lib/parse';
import { next } from './lib/next';
import { getScheduleDescription } from './lib/desc'
import { convertLocalDaysOfWeekToUTC, getLocalDays, } from './lib/local';

/**
 * cron is assumed to be validated by AWS already
 * cron is always stored in UTC
 * AWS Cron Expression specs
 * https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html#CronExpressions
 */

class EventCronParser {
    #cron: string;
    parsedCron: ParsedCron;
    #prevDate: Date | null;
    earliestDate: Date;
    latestDate: Date | null;

    constructor(cron: string, start?: Date | number, end?: Date | number,) {
        this.#cron = cron;
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
        const first = this.next(new Date(start))
        return first && first.getTime() < end
    }

    desc(timezone = 'local' as 'local' | 'utc') {
        return getScheduleDescription(this.parsedCron, timezone)
    }

    // returns days of week in local time
    getLocalDays() {
        return getLocalDays(this.parsedCron)
    }

    // hours and minutes are in UTC, preserveLocalDaysOfWeek keeps the local days the same regardless of how hour + minutes change 
    setUTCHours(hours: number[], minutes?: number[], preserveLocalDaysOfWeek = false) {
        const localDays = getLocalDays(this.parsedCron)
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

        this.parsedCron.hours = hours
        if (minutes)
            this.parsedCron.minutes = minutes

        if (preserveLocalDaysOfWeek)
            this.setDaysOfWeek(localDays, 'local')
    }

    setDaysOfWeek(daysOfWeek: number[], timezone = 'utc' as 'local' | 'utc') {
        // 1. convert daysOfWeek to UTC
        // 2. update cron
        const updated = timezone === 'utc' ? daysOfWeek : convertLocalDaysOfWeekToUTC(daysOfWeek, this.parsedCron)
        const cronArray = this.#cron.split(' ')
        cronArray[4] = updated.join(',')
        this.#cron = cronArray.join(' ')
        this.parsedCron.daysOfWeek = updated
    }

    getCron() {
        return this.#cron
    }
}

export default EventCronParser;