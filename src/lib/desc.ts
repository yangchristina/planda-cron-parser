import * as n2w from 'number-to-words';
import { nextUTCDay } from './local';
import { ParsedCron, ParsedRate, } from './parse';
import { adjustDateForDST } from './common';

const monthNumberToWord = (n: number) => {
    return [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ][n - 1];
};

const weekdayNumberToWord = (n: number) => {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][n - 1];
};

const joinMultipleWords = (words: string[]) => {
    if (words.length === 1) return words[0];
    if (words.length === 2) return `${words[0]} and ${words[1]}`;
    let rs = '';
    words.forEach((w, i, a) => {
        if (i === 0) rs += `${w},`;
        else if (i < a.length - 1) rs += ` ${w},`;
        else rs += ` and ${w}`;
    });
    return rs;
};

const checkCurrentlyUnsupported = (p: ParsedCron) => {
    const dateUnits = ['months', 'daysOfMonth', 'daysOfWeek'] as const
    for (const part of dateUnits) {
        const found = p[part].find((e: string | number) => typeof e !== 'number');
        if (found) return true;
    }
    return false;
};

const handleDaysOfMonth = (p: ParsedCron) => {
    if (checkCurrentlyUnsupported(p)) return '';
    // N N * * ? * = every day
    // N N * 4,5 ? * = every day in April and May
    // N N 1,3,5 * ? * = on the 1st, 3rd, and 5th of every month
    // N N 1,3,5 4,5 ? * = on the 1st, 3rd, and 5th of April and May
    let desc = '';
    if (p.daysOfMonth.length === 31) {
        desc += 'every day';
        if (p.months.length < 12) desc += ` in ${joinMultipleWords((p.months as number[]).map(monthNumberToWord))}`;
    } else {
        desc += `on the ${joinMultipleWords((p.daysOfMonth as number[]).map(n2w.toOrdinal))}`;
        if (p.months.length === 12) desc += ' of every month';
        else desc += ` of ${joinMultipleWords((p.months as number[]).map(monthNumberToWord))}`;
    }
    return desc;
};

const handleDaysOfWeek = (p: ParsedCron) => {
    if (checkCurrentlyUnsupported(p)) return '';
    // N N ? * MON * = every Monday
    // N N ? * MON,FRI * = every Monday and Friday
    // N N ? 4,5 MON,FRI * = every Monday and Friday in April and May
    let desc = '';
    desc += `every ${joinMultipleWords((p.daysOfWeek as number[]).map(weekdayNumberToWord))}`;
    if (p.months.length < 12) desc += ` in ${joinMultipleWords((p.months as number[]).map(monthNumberToWord))}`;
    return desc;
};

const handleOncePerDay = (p: ParsedCron) => {
    const { hours, minutes } = p;
    const h = Math.round(+hours[0] % 12 || 12);
    const m = Math.round(+minutes[0]);
    const mm = m < 10 ? `0${m}` : `${m}`;
    const am = +hours[0] < 12 ? 'AM' : 'PM';
    return `${h}:${mm} ${am}`;
};

function ruleAsNumber(x: string | number): number {
    return (typeof x === 'string' ? parseInt(x) : x)
}

export function getRateDesc(p0: ParsedRate, tz: 'utc' | 'local') {
    const timeOptions = {
        hour: 'numeric' as const,
        minute: '2-digit' as const,
        ...(tz === 'utc' && { timeZone: 'UTC' }),
    }
    const options = {
        ...timeOptions,
        weekday: 'long' as const,
        // year: 'numeric' as const,
        month: 'long' as const,
        day: 'numeric' as const,
    }
    // const dateOptions = {
    //     ...(tz === 'utc' && { timeZone: 'UTC' }),
    //     weekday: 'long' as const,
    //     year: 'numeric' as const,
    //     month: 'long' as const,
    //     day: 'numeric' as const,
    // }
    let starting = new Date(p0.start).toLocaleTimeString(undefined, options)
    if (p0.duration) starting = starting.replace('at', 'from')
    return "Every " + formatDuration(p0.rate) + ' starting from ' + starting + (p0.duration ? ' - ' + new Date(p0.start.getTime() + p0.duration).toLocaleTimeString(undefined, timeOptions) : '')
}

export function getScheduleDescription(p0: ParsedCron | ParsedRate, isRateExpression = false, tz = 'utc' as 'local' | 'utc'): string {
    if (isRateExpression) return getRateDesc(<ParsedRate>p0, tz)
    return getCronDesc(<ParsedCron>p0, tz)
}

const toInt = (h: string | number) => {
    return typeof h === 'string' ? parseInt(h) : h
}

/**
 * @param {*} p the value returned by "parse" function of this module
 */
export function getCronDesc(p0: ParsedCron, tz = 'utc' as 'local' | 'utc'): string {
    const p = { ...p0 }
    let desc = '';

    // const
    if (tz == 'local') {
        // won't work a lot if there are multiple hours and minutes, only follows first hour and first minute
        p.daysOfWeek = p.daysOfWeek.map(dow => {
            dow = ruleAsNumber(dow)

            const date = nextUTCDay(Date.now(), dow - 1)
            date.setUTCHours(ruleAsNumber(p.hours[0]), ruleAsNumber(p.minutes[0]))

            adjustDateForDST(date, p0, tz)
            return date.getDay() + 1
            // const min = (typeof p.hours[0] === 'string' ? parseInt(p.hours[0]) : p.hours[0]) * 60 + (typeof p.minutes[0] === 'string' ? parseInt(p.minutes[0]) : p.minutes[0])
            // const offsetInMinutes = new Date().getTimezoneOffset()
            // const newMin = min + offsetInMinutes
            // if (newMin < 0) return (dow - 1) || 7
            // if (newMin < MIN_PER_DAY) return dow
            // return dow == 7 ? 1 : dow + 1
        })
        p.hours = p.hours.map(h => {
            h = toInt(h)
            const date1 = new Date()
            date1.setUTCHours(h)
            adjustDateForDST(date1, p0, tz)
            return date1.getHours()
        })
        // why am i getting 60 for minutes?
        p.minutes.map(m => {
            m = toInt(m)
            const date2 = new Date()
            date2.setUTCMinutes(m)
            adjustDateForDST(date2, p0, tz)
            return date2.getMinutes()
        })
    }

    const perDay = p.minutes.length * p.hours.length;
    if (perDay === 2) desc += 'twice a day, ';
    else if (perDay > 2) desc += `${n2w.toWords(perDay)} times a day, `;

    if (p.daysOfMonth.length > 0) desc += handleDaysOfMonth(p); // don't think timezone has large effect so shall just ignore for now
    else if (p.daysOfWeek.length > 0) desc += handleDaysOfWeek(p);


    if (perDay === 1) {
        if (p.duration) {
            const durationInMinutes = Math.round(p.duration / 1000 / 60)

            let durationMinutes = durationInMinutes % 60
            let durationHours = Math.floor(durationInMinutes / 60)

            // if all goes over 60, add one to durationHours
            while (p.minutes.every(x=>(toInt(x) + durationMinutes) >= 60)) {
                durationHours++
                durationMinutes -= 60
            }

            const end = { // what if it wraps?
                ...p,
                minutes: p.minutes.map(x => {
                    return toInt(x) + durationMinutes
                }),
                hours: p.hours.map(x => toInt(x) + durationHours) // TODO/WARNING: possible hour > 23
            }
            desc += ` from ${handleOncePerDay(p)} - ${handleOncePerDay(end)}`;
        } else {
            desc += ` at ${handleOncePerDay(p)}`;
        }
        // desc += p.duration ? ` from ${handleOncePerDay(p)} - ${handleOncePerDay({ ...p, minutes: p.minutes.map(x => x + durationMinutes), hours: p.hours.map(x => x + durationHours) })}` : ` at ${handleOncePerDay(p)}`;
    }
    return desc;
}

export default function formatDuration(duration: number): string {
    const time = {
        week: Math.floor(duration / 86400 / 7),
        day: Math.floor(duration / 86400) % 7,
        hour: Math.floor(duration / 3600) % 24,
        minute: Math.floor(duration / 60) % 60,
        second: Math.floor(duration / 1) % 60,
    };
    return Object.entries(time)
        .filter(val => val[1] !== 0)
        .map(([key, val]) => `${val} ${key}${val !== 1 ? 's' : ''}`)
        .join(', ');
}