import { logger } from '../logger';
import { parse, 
    convertLocalDaysOfWeekToUTC, 
    getLocalDays } from '../../lib';

test('test getLocalDays', () => {
    // const cronsUTC = [
    //     // ['0 8 * * ? * 3600000', 'every day from 8:00 AM - 9:00 AM'],
    //     ['0 15 ? * 2,4,6 * 3600000', [2,4,6]],
    //     ['0 18 ? * 2,4,6 * 3600000', [2,4,6]],
    // ]

    const cronsLocal = [
        // ['0 15 * * ? * 3600000', 'every day from 8:00 AM - 9:00 AM'],
        ['0 15 ? * 2,4,6 * 3600000', [2,4,6]],
        ['0 18 ? * 2,4,6 * 3600000', [2,4,6]],
        ['0 6 ? * 2,4,6 * 3600000', [1,3,5]],
    ]

    cronsLocal.forEach(([cron, itShouldBe]) => {
        const parsed = parse(cron as string);
        // const daysOfWeekUTC = convertLocalDaysOfWeekToUTC()
        const daysOfWeekLocal = getLocalDays(parsed)
        logger.debug(daysOfWeekLocal, { label: cron });
        expect(daysOfWeekLocal).toStrictEqual(itShouldBe as number[]);
    });
});

test('test convertLocalDaysOfWeekToUTC', () => {
    const cronsLocal = [
        // ['0 15 * * ? * 3600000', 'every day from 8:00 AM - 9:00 AM'],
        [[2,4,6], '0 15 ? * 2,4,6 * 3600000', [2,4,6]],
        [[2,4,6], '0 18 ? * 2,4,6 * 3600000', [2,4,6]],
        [[2,4,6], '0 7 ? * 2,4,6 * 3600000', [2,4,6]],
        [[1,3,5], '0 6 ? * 2,4,6 * 3600000', [2,4,6]],
    ]

    cronsLocal.forEach(([daysOfWeek, cron, itShouldBe]) => {
        const parsed = parse(cron as string);
        // const daysOfWeekUTC = convertLocalDaysOfWeekToUTC()
        const daysOfWeekUTC = convertLocalDaysOfWeekToUTC(daysOfWeek as number[], parsed)
        logger.debug(daysOfWeekUTC, { label: cron });
        expect(daysOfWeekUTC).toStrictEqual(itShouldBe as number[]);
    });
});
