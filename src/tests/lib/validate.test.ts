import EventCronParser from '../..';
import { logger } from '../logger';

test('test local #1', () => {
    const crons: (string | boolean)[][] = [
        ["0 0 ? *  *", false],
        ['0 8 * * NaN * 3600000', false],
        ['0 a * * ? * 3600000', false],
        ['0 ) * * ? * 3600000', false],
        ['0 true * * ? * 3600000', false],
        ["0 0 ? * 1 *", true]
    ]

    crons.forEach(([cron, itShouldBe]) => {
        const parsed = new EventCronParser(cron as string);
        try {
            parsed.validate()
            if (!itShouldBe) fail('should have thrown error')
        } catch (e: any) {
            if (itShouldBe) fail('should not have thrown error')
        }
        logger.debug(cron, { label: cron });
    });
});