import { ParsedCron } from '..'
import { next } from './next'
/**
 * returns true if parsed cron can occur between between start and end
 * @param {*} parsed the value returned by "parse" function of this module
 * @param {*} start start of date interval
 * @param {*} end end of date interval
 */
 export function withinRange(parsed: ParsedCron, start = new Date(0), end: Date | null = null): boolean {
    const occurence = next(parsed, start)
    if (occurence === null) return false
    if (end === null) return true

    if (occurence.getTime() < end.getTime())
        return true;
    return false;
}