import { getDaysOfMonthFromDaysOfWeek, getDaysOfMonthForL, getDaysOfMonthForW, arrayFindFirst as find } from './common';
import { ParsedCron } from './parse';

let iter: number;
const findOnce = (parsed: ParsedCron, from: Date, timezone: string): Date | null => {
    if (iter > 10) {
        throw new Error("AwsCronParser : this shouldn't happen, but iter > 10");
    }
    iter += 1;

    from = getLatestDate(from, parsed.start)

    const cYear = timezone === 'local' ? from.getFullYear() : from.getUTCFullYear();
    const cMonth = timezone === 'local' ? from.getMonth() + 1 : from.getUTCMonth() + 1;
    const cDayOfMonth = timezone === 'local' ? from.getDate() : from.getUTCDate();
    const cHour = timezone === 'local' ? from.getHours() : from.getUTCHours();
    const cMinute = timezone === 'local' ? from.getMinutes() : from.getUTCMinutes();

    const year = find(parsed.years, (c: number) => c >= cYear);
    if (!year) {
        return null;
    }

    const month = find(parsed.months, (c: number) => c >= (year === cYear ? cMonth : 1));
    if (!month) {
        return findOnce(parsed, getDate(timezone, year + 1, 1), timezone);
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
    if (!dayOfMonth) {
        return findOnce(parsed, getDate(timezone, year, month + 1), timezone);
    }

    const isSameDate = isSameMonth && dayOfMonth === cDayOfMonth;

    const hour = find(parsed.hours, (c: number) => c >= (isSameDate ? cHour : 0));
    if (typeof hour === 'undefined') {
        return findOnce(parsed,
            getDate(timezone, year, month, dayOfMonth + 1), timezone);
    }

    const minute = find(parsed.minutes, (c: number) => c >= (isSameDate && hour === cHour ? cMinute : 0));
    if (typeof minute === 'undefined') {
        return findOnce(parsed, getDate(timezone, year, month, dayOfMonth, hour + 1, minute), timezone);
    }

    return getDate(timezone, year, month, dayOfMonth, hour, minute);
};

// function getEarliestDate(date1: Date, date2: Date) {
//     return date1.getTime() <= date2.getTime() ? date1 : date2
// }

function getLatestDate(date1: Date, date2: Date) {
    return date1.getTime() >= date2.getTime() ? date1 : date2
}

function getDate(tz: string, year = 0, month = 1, dayOfMonth = 1, hour = 0, minute = 0) {
    try {
        switch (tz.toLowerCase()) {
            case 'local':
                return new Date(year, month - 1, dayOfMonth, hour, minute)
            default: // default is 'utc'
                return new Date(Date.UTC(year, month - 1, dayOfMonth, hour, minute))
        }
    } catch (e) {
        console.error('get date error')
        console.error(e)
        console.error(tz)
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
export function next(parsed: ParsedCron, from: Date, timezone = 'utc') {
    // iter is just a safety net to prevent infinite recursive calls
    // because I'm not 100% sure this won't happen
    iter = 0;
    const nextOccurence = findOnce(parsed, new Date(((from.getTime() - parsed.duration) / 60000) * 60000), timezone.toLowerCase())
    if (
        nextOccurence === null
        || parsed.end === null
        || nextOccurence.getTime() + parsed.duration < parsed.end.getTime()
    ) return nextOccurence
    return null
    // new Date((Math.floor(from.getTime() / 60000) + 1) * 60000)
}
