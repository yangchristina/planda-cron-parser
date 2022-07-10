import { getDaysOfMonthFromDaysOfWeek, getDaysOfMonthForL, getDaysOfMonthForW, arrayFindFirst as find } from './common';
import { ParsedCron } from './parse';

let iter: number;
const findOnce = (parsed: ParsedCron, from: Date, useLocal: boolean): Date | null => {
    if (iter > 10) {
        throw new Error("AwsCronParser : this shouldn't happen, but iter > 10");
    }
    iter += 1;

    const cYear = useLocal ? from.getFullYear() : from.getUTCFullYear();
    const cMonth = useLocal ? from.getMonth() + 1 : from.getUTCMonth() + 1;
    const cDayOfMonth = useLocal ? from.getDate() : from.getUTCDate();
    const cHour = useLocal ? from.getHours() : from.getUTCHours();
    const cMinute = useLocal ? from.getMinutes() : from.getUTCMinutes();

    const year = find(parsed.years, (c: number) => c >= cYear);
    if (!year) {
        return null;
    }

    const month = find(parsed.months, (c: number) => c >= (year === cYear ? cMonth : 1));
    if (!month) {
        return findOnce(parsed, useLocal ? new Date(year + 1, 0) : new Date(Date.UTC(year + 1, 0)), useLocal);
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
        return findOnce(parsed, useLocal ? new Date(year, month + 1 - 1) : new Date(Date.UTC(year, month + 1 - 1)), useLocal);
    }

    const isSameDate = isSameMonth && dayOfMonth === cDayOfMonth;

    const hour = find(parsed.hours, (c: number) => c >= (isSameDate ? cHour : 0));
    if (typeof hour === 'undefined') {
        return findOnce(parsed, useLocal ? new Date(year, month - 1, dayOfMonth + 1) : new Date(Date.UTC(year, month - 1, dayOfMonth + 1)), useLocal);
    }

    const minute = find(parsed.minutes, (c: number) => c >= (isSameDate && hour === cHour ? cMinute : 0));
    if (typeof minute === 'undefined') {
        return findOnce(parsed, useLocal ? new Date(year, month - 1, dayOfMonth, hour + 1) : new Date(Date.UTC(year, month - 1, dayOfMonth, hour + 1)), useLocal);
    }

    return useLocal ? new Date(year, month - 1, dayOfMonth, hour, minute) : new Date(Date.UTC(year, month - 1, dayOfMonth, hour, minute));
};

/**
 * generate the next occurrence AFTER the "from" date value , <--- changed from AFTER to INCLUDING
 * returns NULL when there is no more future occurrence
 * @param {*} parsed the value returned by "parse" function of this module
 * @param {*} from the Date to start from
 */
export function next(parsed: ParsedCron, from: Date, useLocal = false) {
    // iter is just a safety net to prevent infinite recursive calls
    // because I'm not 100% sure this won't happen
    iter = 0;
    return findOnce(parsed, new Date((Math.floor(from.getTime() / 60000) + 1) * 60000), useLocal
        // new Date((Math.floor(from.getTime() / 60000) + 1) * 60000)
    );
}
