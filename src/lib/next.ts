import { getDaysOfMonthFromDaysOfWeek, getDaysOfMonthForL, getDaysOfMonthForW, arrayFindFirst as find, adjustDateForDST } from './common';
import { ParsedCron, ParsedRate } from './parse';
import { DateInput } from './types';

const findOnce = (parsed: ParsedCron, from: Date, iter = 0): Date | null => {
    if (iter > 10) {
        throw new Error("AwsCronParser : this shouldn't happen, but iter > 10");
    }
    iter += 1;

    from = getLatestDate(from, parsed.start)

    const cYear = from.getUTCFullYear(); // timezone === 'local' ? from.getFullYear() :
    const cMonth = from.getUTCMonth() + 1; // timezone === 'local' ? from.getMonth() + 1 :
    const cDayOfMonth = from.getUTCDate(); // timezone === 'local' ? from.getDate() :
    const cHour = from.getUTCHours(); // timezone === 'local' ? from.getHours() :
    const cMinute = from.getUTCMinutes(); // timezone === 'local' ? from.getMinutes() :

    const year = find(parsed.years, (c: number) => c >= cYear);
    if (!year) {
        return null;
    }

    const month = find(parsed.months, (c: number) => c >= (year === cYear ? cMonth : 1));
    iter > 5 && console.log("month", month, new Date(from), parsed)
    if (!month) {
        return findOnce(parsed, getDate(year + 1, 1), iter);
    }

    const isSameMonth = year === cYear && month === cMonth;

    let pDaysOfMonth = parsed.daysOfMonth;
    if (pDaysOfMonth.length === 0) {
        pDaysOfMonth = getDaysOfMonthFromDaysOfWeek(year, month, parsed.daysOfWeek);
    } else if (pDaysOfMonth[0] === 'L') {
        pDaysOfMonth = getDaysOfMonthForL(year, month, pDaysOfMonth[1] as number);
    } else if (pDaysOfMonth[0] === 'W') {
        pDaysOfMonth = getDaysOfMonthForW(year, month, pDaysOfMonth[1] as number);
    }

    const dayOfMonth = find(pDaysOfMonth, (c: number) => c >= (isSameMonth ? cDayOfMonth : 1));
    iter > 5 && console.log("dayOfMonth", dayOfMonth, new Date(from))
    if (!dayOfMonth) {
        return findOnce(parsed, getDate(year, month + 1), iter);
    }

    const isSameDate = isSameMonth && dayOfMonth === cDayOfMonth;

    const hour = find(parsed.hours, (c: number) => c >= (isSameDate ? cHour : 0));
    iter > 5 && console.log('hour', hour)
    if (typeof hour === 'undefined') {
        return findOnce(parsed,
            getDate(year, month, dayOfMonth + 1), iter);
    }

    const minute = find(parsed.minutes, (c: number) => c >= (isSameDate && hour === cHour ? cMinute : 0));
    iter > 5 && console.log('minute', minute)
    if (typeof minute === 'undefined') {
        return findOnce(parsed, getDate(year, month, dayOfMonth, hour + 1, minute), iter);
    }
    iter > 5 && console.log("found", getDate(year, month, dayOfMonth, hour, minute))
    return getDate(year, month, dayOfMonth, hour, minute);
};

// function getEarliestDate(date1: Date, date2: Date) {
//     return date1.getTime() <= date2.getTime() ? date1 : date2
// }

function getLatestDate(date1: Date, date2: Date) {
    return date1.getTime() >= date2.getTime() ? date1 : date2
}

function getDate(year = 0, month = 1, dayOfMonth = 1, hour = 0, minute = 0) {
    try {
        return new Date(Date.UTC(year, month - 1, dayOfMonth, hour, minute))
    } catch (e) {
        console.error('get date error')
        console.error(e)
        return new Date(0)
    }
}

/**
 * generate the next occurrence which ends after or at the same time as the "from" date value,
 * includes occurences that start before the "from" date, but end after
 * NOTE: does not deal with durations, only start
 * returns NULL when there is no more future occurrence
 * @param {*} parsed the value returned by "parse" function of this module
 * @param {*} from the Date to start from
 */
interface NextCronOptions {
    inclusive?: boolean;
    tz?: 'local' | 'utc';
}

export function nextCron(parsed: ParsedCron, from: Date, duration: number, options?: NextCronOptions) {
    const { inclusive = false, tz = 'utc' as 'local' | 'utc' } = options || {}
    // iter is just a safety net to prevent infinite recursive calls
    // because I'm not 100% sure this won't happen

    const findFrom = (from: Date) => {
        return findOnce(parsed, new Date(((from.getTime() - duration + (inclusive ? -60000 : 60000)) / 60000) * 60000))
    }
    let nextOccurence = findFrom(from)

    const adjustAmountMin = nextOccurence ? adjustDateForDST(nextOccurence, parsed, tz) : 60

    if (adjustAmountMin !== 0) {
        const newNextOccurence = findFrom(new Date(from.getTime() - adjustAmountMin * 60000))
        if (newNextOccurence && adjustAmountMin === adjustDateForDST(newNextOccurence, parsed, tz)) {
            nextOccurence = newNextOccurence
        }
    }

    if (
        nextOccurence === null
        || parsed.end === null
        || nextOccurence.getTime() < parsed.end.getTime()
    ) return nextOccurence
    return null
    // new Date((Math.floor(from.getTime() / 60000) + 1) * 60000)
}

export function nextRate(rate: ParsedRate, from: DateInput | null, inclusive = false) {
    if (from == null) return null
    const fromTime = new Date(from).getTime()
    const startTime = rate.start.getTime()

    let time = startTime;
    while (inclusive ? time < fromTime : time <= fromTime) {
        time += rate.rate * 1000
    }

    if (rate.end && time + rate.duration > rate.end.getTime()) return null
    return new Date(time)
}
