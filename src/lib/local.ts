import { DateInput } from "./types"
import { ParsedCron } from "./parse"
export function nextLocalDay(
    date: DateInput,
    day: number
) {
    date = new Date(date)
    let delta = day - date.getDay()
    if (delta <= 0) delta += 7

    date.setDate(date.getDate() + delta)
    return date
}

export function nextUTCDay(
    date: DateInput,
    day: number
): Date {
    date = new Date(date)
    day = day % 7
    let delta = day - date.getUTCDay()
    if (delta <= 0) delta += 7

    date.setUTCDate(date.getUTCDate() + delta)
    return date
}

function ruleAsNumber(x: string | number): number {
    return (typeof x === 'string' ? parseInt(x) : x)
}

export function convertLocalDaysOfWeekToUTC(daysOfWeek: number[], parsedCron: ParsedCron) {
    return daysOfWeek.map(dayNum=>{
        const date = new Date()
        date.setUTCHours(ruleAsNumber(parsedCron.hours[0]), ruleAsNumber(parsedCron.minutes[0]))
        return nextLocalDay(date, dayNum - 1).getUTCDay() + 1
    })
}

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
export function getLocalDays(parsedCron: ParsedCron) {
    return parsedCron.daysOfWeek.map(dow => {
        dow = ruleAsNumber(dow)
        if (isNaN(dow)) {
            dow = DAYS_OF_WEEK.findIndex(x => x === dow) + 1
        }

        const date = nextUTCDay(Date.now(), dow - 1)
        date.setUTCHours(ruleAsNumber(parsedCron.hours[0]), ruleAsNumber(parsedCron.minutes[0]))

        return date.getDay() + 1
    })
}