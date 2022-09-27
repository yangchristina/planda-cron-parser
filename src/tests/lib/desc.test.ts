import { logger } from '../logger';
import { parse, getScheduleDescription } from '../../lib'

test('should generate readable schedule description', () => {
    const cronsUTC = [
        ['0 8 * * ? * 3600000', 'every day from 8:00 AM - 9:00 AM'],
        ['0 15 ? * 2,4,6 * 3600000', 'every Monday, Wednesday, and Friday from 3:00 PM - 4:00 PM'],
        ['0 18 ? * 2,4,6 * 3600000', 'every Monday, Wednesday, and Friday from 6:00 PM - 7:00 PM'],
        ['15,45 6 * * ? *', 'twice a day, every day'],
        ['0 7,8,9 * * ? *', 'three times a day, every day'],
        ['*/10 */6 * * ? * 3600000', 'twenty-four times a day, every day'],

        ['15 16 26 * ? *', 'on the 26th of every month at 4:15 PM'],
        ['15,45 6 * 4,7 ? *', 'twice a day, every day in April and July'],
        ['15,45 6 15,26 * ? *', 'twice a day, on the 15th and 26th of every month'],
        ['15,45 6 15,26 3,8 ? *', 'twice a day, on the 15th and 26th of March and August'],
        ['15,45 6 15,26,29 3,6,8 ? *', 'twice a day, on the 15th, 26th, and 29th of March, June, and August'],

        ['45 6 ? * SUN *', 'every Sunday at 6:45 AM'],
        ['15,45 6 ? * SUN *', 'twice a day, every Sunday'],
        ['15,45 6 ? * MON,FRI *', 'twice a day, every Monday and Friday'],
        ['15,45 6 ? 3,8 MON,FRI *', 'twice a day, every Monday and Friday in March and August'],
        [
            '15,45 6 ? 3,6,8 TUE,THU,SAT *',
            'twice a day, every Tuesday, Thursday, and Saturday in March, June, and August',
        ],
    ]

    const cronsLocal = [
        ['0 15 * * ? * 3600000', 'every day from 8:00 AM - 9:00 AM'],
        ['0 15 ? * 2,4,6 * 3600000', 'every Monday, Wednesday, and Friday from 8:00 AM - 9:00 AM'],
        ['0 18 ? * 2,4,6 * 3600000', 'every Monday, Wednesday, and Friday from 11:00 AM - 12:00 PM']
    ]

    cronsUTC.forEach(([cron, itShouldBe]) => {
        const parsed = parse(cron);
        const desc = getScheduleDescription(parsed);
        logger.debug(desc, { label: cron });
        expect(desc).toBe(itShouldBe);
    });

    cronsLocal.forEach(([cron, itShouldBe]) => {
        const parsed = parse(cron);
        const desc = getScheduleDescription(parsed, 'local');
        logger.debug(desc, { label: cron });
        expect(desc).toBe(itShouldBe);
    });
});
