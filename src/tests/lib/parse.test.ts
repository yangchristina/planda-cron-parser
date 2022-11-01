import { logger } from '../logger';
import { ParsedCron, ParsedRate } from '../../lib/parse'
import EventCronParser from '../..';

const arr = (s: number, e: number, step = 1) => {
    const rs = [];
    for (let i = s; i <= e; i += step) {
        rs.push(i);
    }
    return rs;
};

const TEST_CRONS_NO_DUR = [
    {
        cron: '6 4/3 8,18-20,26-28 * ? 2020-2030',
        minutes: [6],
        hours: [4, 7, 10, 13, 16, 19, 22],
        daysOfMonth: [8, 18, 19, 20, 26, 27, 28],
        months: arr(1, 12),
        daysOfWeek: [],
        years: arr(2020, 2030),
        duration: 0,
    },
    {
        cron: '2/13 5-8,17,21-23 * NOV ? *',
        minutes: [2, 15, 28, 41, 54],
        hours: [5, 6, 7, 8, 17, 21, 22, 23],
        daysOfMonth: arr(1, 31),
        months: [11],
        daysOfWeek: [],
        years: arr(1970, 2199),
        duration: 0,
    },
    {
        cron: '1,24,50-55,58 * 25 MAR/4 ? 2020,2021,2023,2028',
        minutes: [1, 24, 50, 51, 52, 53, 54, 55, 58],
        hours: arr(0, 23),
        daysOfMonth: [25],
        months: [3, 7, 11],
        daysOfWeek: [],
        years: [2020, 2021, 2023, 2028],
        duration: 0,
    },
    {
        cron: '* 14 6/10 FEB-JUN,OCT ? 2021/20',
        minutes: arr(0, 59),
        hours: [14],
        daysOfMonth: [6, 16, 26],
        months: [...arr(2, 6), 10],
        daysOfWeek: [],
        years: [2021, 2041, 2061, 2081, 2101, 2121, 2141, 2161, 2181],
        duration: 0,
    },
]

const TEST_CRONS_WITH_DUR = [
    {
        cron: '15 10 ? * 6L 2002-2025 3600000',
        minutes: [15],
        hours: [10],
        daysOfMonth: [],
        months: arr(1, 12),
        daysOfWeek: ['L', 6],
        years: arr(2002, 2025),
        duration: 3600000,
    },
    {
        cron: '15 10 ? * 6L 2002-2025 0',
        minutes: [15],
        hours: [10],
        daysOfMonth: [],
        months: arr(1, 12),
        daysOfWeek: ['L', 6],
        years: arr(2002, 2025),
        duration: 0,
    },
    {
        cron: '15 10 ? * 6L 2002-2025 1',
        minutes: [15],
        hours: [10],
        daysOfMonth: [],
        months: arr(1, 12),
        daysOfWeek: ['L', 6],
        years: arr(2002, 2025),
        duration: 1,
    },
]

const TEST_CRONS_WITH_START = [
    {
        cron: '*/5 10 ? * MON-FRI *',
        minutes: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
        hours: [10],
        daysOfMonth: [],
        months: arr(1, 12),
        daysOfWeek: arr(2, 6),
        years: arr(1970, 2199),
        duration: 0

    },
    {
        cron: '30 9 L-2 * ? *',
        minutes: [30],
        hours: [9],
        daysOfMonth: ['L', 2],
        months: arr(1, 12),
        daysOfWeek: [],
        years: arr(1970, 2199),
        duration: 0,
    }
]

const TEST_CRONS_WITH_END = [
    {
        cron: '0 */3 */1 * ? *',
        minutes: [0],
        hours: arr(0, 21, 3),
        daysOfMonth: arr(1, 31),
        months: arr(1, 12),
        daysOfWeek: [],
        years: arr(1970, 2199),
        duration: 0,
    },
    {
        cron: '0-29/5 22 09 05 ? 2020',
        minutes: arr(0, 25, 5),
        hours: [22],
        daysOfMonth: [9],
        months: [5],
        daysOfWeek: [],
        years: [2020],
        duration: 0,
    }
]

const duration = 3600000


const TEST_RATES_NO_DUR = [
    {
        r: "rate(1 minute)",
        rate: 60,
        duration: 0,
        value: 1,
        unit: 'minute',
        start: new Date(0),
        end: null
    },
    {
        r: "rate(10 minutes)",
        rate: 600,
        duration: 0,
        value: 10,
        unit: 'minutes',
        start: new Date(0),
        end: null
    },
    {
        r: "rate(1 hour)",
        rate: 3600,
        duration: 0,
        value: 1,
        unit: 'hour',
        start: new Date(0),
        end: null
    },
    {
        r: "rate(1 hours)",
        rate: 3600,
        duration: 0,
        value: 1,
        unit: 'hours',
        start: new Date(0),
        end: null
    },
    {
        r: "rate(1 day)",
        rate: 3600*24,
        duration: 0,
        value: 1,
        unit: 'day',
        start: new Date(0),
        end: null
    },
    {
        r: "rate(1 days)",
        rate: 3600*24,
        duration: 0,
        value: 1,
        unit: 'days',
        start: new Date(0),
        end: null
    },
]


function testCrons(testCases: any, start = 0, end: number | null = null) {
    testCases.forEach(({ cron, minutes, hours, daysOfMonth, months, daysOfWeek, years, duration }: any, i: number) => {
        const parsedCron = new EventCronParser(cron, start, end || undefined)
        const p = parsedCron.parsedCron as ParsedCron;
        logger.debug(cron, { label: 'cron ' + i });
        expect(p.minutes).toEqual(minutes);
        expect(p.hours).toEqual(hours);
        expect(p.daysOfMonth).toEqual(daysOfMonth);
        expect(p.months).toEqual(months);
        expect(p.daysOfWeek).toEqual(daysOfWeek);
        expect(p.years).toEqual(years);
        expect(p.duration).toEqual(duration)
        expect(p.start.getTime()).toEqual(start)
        if (end == null) expect(p.end).toBeNull()
        else expect(p.end?.getTime()).toEqual(end)
    })
}

function testRates(testCases: any) {
    testCases.forEach(({ r, rate, duration, value, unit, start, end }: any, i: number) => {
        const testRate = new EventCronParser(r, start, end).parsedCron as ParsedRate;
        expect(testRate.rate).toEqual(rate);
        expect(testRate.duration).toEqual(duration);
        expect(testRate.value).toEqual(value);
        expect(testRate.unit).toEqual(unit);
        expect(testRate.start).toEqual(start);
        expect(testRate.end).toEqual(end);
    })
}


test('should parse regular AWS cron expressions #1', () => {
    testCrons(TEST_CRONS_NO_DUR)
});

test('should parse AWS cron expressions w/ duration #2', () => {
    testCrons(TEST_CRONS_WITH_DUR)
});

test('should parse AWS cron expression w/ start #3', () => {
    const date = Date.now()
    testCrons(TEST_CRONS_WITH_START, date)
});

test('should parse AWS cron expression w/ end #4', () => {
    const date = Date.now() + 3600000
    testCrons(TEST_CRONS_WITH_END, undefined, date)
});

test('should parse AWS cron expression w/ duration+start+end #5', () => {
    const start = Date.now(), end = start + 8400000;
    testCrons(CRONS_WITH_DURATION_START_END, start, end)
});

const CRONS_WITH_DURATION_START_END = [
    {
        cron: `15 12 ? * sun,mon * ${duration}`,
        // logger.debug(JSON.stringify(p), { label: 'cron 1' });
        minutes: [15],
        hours: [12],
        daysOfMonth: [],
        months: arr(1, 12),
        daysOfWeek: [1, 2],
        years: arr(1970, 2199),
        duration: duration,
    },
    {
        cron: `10 7/5 7 * ? 2020 ${duration * 2}`,
        // logger.debug(JSON.stringify(p), { label: 'cron 1' },
        minutes: [10],
        hours: arr(7, 22, 5),
        daysOfMonth: [7],
        months: arr(1, 12),
        daysOfWeek: [],
        years: [2020],
        duration: duration * 2
    }
]
test('should parse rate expressions, no duration', () => {
    testRates(TEST_RATES_NO_DUR)
})
