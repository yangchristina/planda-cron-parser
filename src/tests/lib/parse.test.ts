import AwsCronParser from '../..';
import { logger } from '../logger';

const arr = (s: number, e: number, step = 1) => {
    const rs = [];
    for (let i = s; i <= e; i += step) {
        rs.push(i);
    }
    return rs;
};

test('should parse regular AWS cron expressions #1', () => {
    let p;

    p = AwsCronParser.parse('6 4/3 8,18-20,26-28 * ? 2020-2030');
    logger.debug(JSON.stringify(p), { label: 'cron 1' });
    expect(p.minutes).toEqual([6]);
    expect(p.hours).toEqual([4, 7, 10, 13, 16, 19, 22]);
    expect(p.daysOfMonth).toEqual([8, 18, 19, 20, 26, 27, 28]);
    expect(p.months).toEqual(arr(1, 12));
    expect(p.daysOfWeek).toEqual([]);
    expect(p.years).toEqual(arr(2020, 2030));
    expect(p.duration).toEqual(0)
    expect(p.start.getTime()).toEqual(0)
    expect(p.end).toBeNull()

    p = AwsCronParser.parse('2/13 5-8,17,21-23 * NOV ? *');
    logger.debug(JSON.stringify(p), { label: 'cron 2' });
    expect(p.minutes).toEqual([2, 15, 28, 41, 54]);
    expect(p.hours).toEqual([5, 6, 7, 8, 17, 21, 22, 23]);
    expect(p.daysOfMonth).toEqual(arr(1, 31));
    expect(p.months).toEqual([11]);
    expect(p.daysOfWeek).toEqual([]);
    expect(p.years).toEqual(arr(1970, 2199));
    expect(p.duration).toEqual(0)
    expect(p.start.getTime()).toEqual(0)
    expect(p.end).toBeNull()

    p = AwsCronParser.parse('1,24,50-55,58 * 25 MAR/4 ? 2020,2021,2023,2028');
    logger.debug(JSON.stringify(p), { label: 'cron 3' });
    expect(p.minutes).toEqual([1, 24, 50, 51, 52, 53, 54, 55, 58]);
    expect(p.hours).toEqual(arr(0, 23));
    expect(p.daysOfMonth).toEqual([25]);
    expect(p.months).toEqual([3, 7, 11]);
    expect(p.daysOfWeek).toEqual([]);
    expect(p.years).toEqual([2020, 2021, 2023, 2028]);
    expect(p.duration).toEqual(0)
    expect(p.start.getTime()).toEqual(0)
    expect(p.end).toBeNull()

    p = AwsCronParser.parse('* 14 6/10 FEB-JUN,OCT ? 2021/20');
    logger.debug(JSON.stringify(p), { label: 'cron 4' });
    expect(p.minutes).toEqual(arr(0, 59));
    expect(p.hours).toEqual([14]);
    expect(p.daysOfMonth).toEqual([6, 16, 26]);
    expect(p.months).toEqual([...arr(2, 6), 10]);
    expect(p.daysOfWeek).toEqual([]);
    expect(p.years).toEqual([2021, 2041, 2061, 2081, 2101, 2121, 2141, 2161, 2181]);
    expect(p.duration).toEqual(0)
    expect(p.start.getTime()).toEqual(0)
    expect(p.end).toBeNull()
});

test('should parse AWS cron expressions w/ duration #2', () => {
    let p = AwsCronParser.parse('15 10 ? * 6L 2002-2025 3600000');
    logger.debug(JSON.stringify(p), { label: 'cron 1' });
    expect(p.minutes).toEqual([15]);
    expect(p.hours).toEqual([10]);
    expect(p.daysOfMonth).toEqual([]);
    expect(p.months).toEqual(arr(1, 12));
    expect(p.daysOfWeek).toEqual(['L', 6]);
    expect(p.years).toEqual(arr(2002, 2025));
    expect(p.duration).toEqual(3600000)
    expect(p.start.getTime()).toEqual(0)
    expect(p.end).toBeNull()

    p = AwsCronParser.parse('15 10 ? * 6L 2002-2025 0');
    logger.debug(JSON.stringify(p), { label: 'cron 1' });
    expect(p.minutes).toEqual([15]);
    expect(p.hours).toEqual([10]);
    expect(p.daysOfMonth).toEqual([]);
    expect(p.months).toEqual(arr(1, 12));
    expect(p.daysOfWeek).toEqual(['L', 6]);
    expect(p.years).toEqual(arr(2002, 2025));
    expect(p.duration).toEqual(0)
    expect(p.start.getTime()).toEqual(0)
    expect(p.end).toBeNull()

    p = AwsCronParser.parse('15 10 ? * 6L 2002-2025 1');
    logger.debug(JSON.stringify(p), { label: 'cron 1' });
    expect(p.minutes).toEqual([15]);
    expect(p.hours).toEqual([10]);
    expect(p.daysOfMonth).toEqual([]);
    expect(p.months).toEqual(arr(1, 12));
    expect(p.daysOfWeek).toEqual(['L', 6]);
    expect(p.years).toEqual(arr(2002, 2025));
    expect(p.duration).toEqual(1)
    expect(p.start.getTime()).toEqual(0)
    expect(p.end).toBeNull()
});

test('should parse AWS cron expression w/ start #3', () => {
    const date = Date.now()
    let p = AwsCronParser.parse('*/5 10 ? * MON-FRI *', date);
    logger.debug(JSON.stringify(p), { label: 'cron 1' });
    expect(p.minutes).toEqual([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
    expect(p.hours).toEqual([10]);
    expect(p.daysOfMonth).toEqual([]);
    expect(p.months).toEqual(arr(1, 12));
    expect(p.daysOfWeek).toEqual(arr(2, 6));
    expect(p.years).toEqual(arr(1970, 2199));
    expect(p.duration).toEqual(0)
    expect(p.start.getTime()).toEqual(date)
    expect(p.end).toBeNull()

    p = AwsCronParser.parse('30 9 L-2 * ? *', new Date(date));
    logger.debug(JSON.stringify(p), { label: 'cron 1' });
    expect(p.minutes).toEqual([30]);
    expect(p.hours).toEqual([9]);
    expect(p.daysOfMonth).toEqual(['L', 2]);
    expect(p.months).toEqual(arr(1, 12));
    expect(p.daysOfWeek).toEqual([]);
    expect(p.years).toEqual(arr(1970, 2199));
    expect(p.duration).toEqual(0)
    expect(p.start.getTime()).toEqual(date)
    expect(p.end).toBeNull()
});

test('should parse AWS cron expression w/ end #4', () => {
    const date = Date.now() + 3600000
    let p = AwsCronParser.parse('0 */3 */1 * ? *', undefined, date);
    logger.debug(JSON.stringify(p), { label: 'cron 1' });
    expect(p.minutes).toEqual([0]);
    expect(p.hours).toEqual(arr(0, 21, 3));
    expect(p.daysOfMonth).toEqual(arr(1, 31));
    expect(p.months).toEqual(arr(1, 12));
    expect(p.daysOfWeek).toEqual([]);
    expect(p.years).toEqual(arr(1970, 2199));
    expect(p.duration).toEqual(0)
    expect(p.start.getTime()).toEqual(0)
    expect(p.end?.getTime()).toEqual(date)

    p = AwsCronParser.parse('0-29/5 22 09 05 ? 2020', undefined, new Date(date));
    logger.debug(JSON.stringify(p), { label: 'cron 1' });
    expect(p.minutes).toEqual(arr(0, 25, 5));
    expect(p.hours).toEqual([22]);
    expect(p.daysOfMonth).toEqual([9]);
    expect(p.months).toEqual([5]);
    expect(p.daysOfWeek).toEqual([]);
    expect(p.years).toEqual([2020]);
    expect(p.duration).toEqual(0)
    expect(p.start.getTime()).toEqual(0)
    expect(p.end?.getTime()).toEqual(date)
});

test('should parse AWS cron expression w/ duration+start+end #5', () => {

    const start = Date.now(), end = start + 8400000, duration = 3600000

    let p = AwsCronParser.parse(`15 12 ? * sun,mon * ${duration}`, start, new Date(end));
    logger.debug(JSON.stringify(p), { label: 'cron 1' });
    expect(p.minutes).toEqual([15]);
    expect(p.hours).toEqual([12]);
    expect(p.daysOfMonth).toEqual([]);
    expect(p.months).toEqual(arr(1, 12));
    expect(p.daysOfWeek).toEqual([1, 2]);
    expect(p.years).toEqual(arr(1970, 2199));
    expect(p.duration).toEqual(duration)
    expect(p.start.getTime()).toEqual(start)
    expect(p.end?.getTime()).toEqual(end)

    p = AwsCronParser.parse(`10 7/5 7 * ? 2020 ${duration * 2}`, new Date(start), end);
    logger.debug(JSON.stringify(p), { label: 'cron 1' });
    expect(p.minutes).toEqual([10]);
    expect(p.hours).toEqual(arr(7, 22, 5));
    expect(p.daysOfMonth).toEqual([7]);
    expect(p.months).toEqual(arr(1, 12));
    expect(p.daysOfWeek).toEqual([]);
    expect(p.years).toEqual([2020]);
    expect(p.duration).toEqual(duration * 2)
    expect(p.start.getTime()).toEqual(start)
    expect(p.end?.getTime()).toEqual(end)
});
