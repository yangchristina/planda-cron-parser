// // import AwsCronParser from '../..';
// import EventCronParser from '../..'

import EventCronParser from "../../index";

// function testMultipleNext(crons: any[], start: Date, inclusive = false) {
//     crons.forEach(({ cron, should: theyShouldBe }) => {
//         const event = new EventCronParser(cron, start)
//         let occurence: Date = start;
//         theyShouldBe.forEach((itShouldBe: any, i: number) => {
//             if (i % 2 == 0) {
//                 occurence = event.next(new Date(occurence.getTime()), inclusive) || new Date(0);
//             } else {
//                 occurence = event.next() || new Date(0)
//             }
//             // logger.debug(cron, { label: `${i}:${occurence?.toUTCString()}` });
//             expect(occurence?.toUTCString()).toBe(itShouldBe);
//         });
//     });
// }

// function testCases(crons: any[], tz: 'utc' | 'local' = 'utc', duration = 0) {
//     crons.forEach(({ cron, should: theyShouldBe }) => {
//         const event = new EventCronParser(cron)
//         let occurence: Date = new Date(2022, 6, 5); // 'Tue Jul 05 2022 00:00:00 GMT-0700 (Pacific Daylight Time)'
//         theyShouldBe.forEach((itShouldBe: any, i: number) => {
//             logger.debug(cron, { label: `arg-${i}:${new Date(occurence.getTime() + duration + 60000)?.toString()}` });
//             occurence = event.next(new Date(occurence.getTime() + duration + 60000)) || new Date(0);
//             logger.debug(cron, { label: `${i}:${occurence?.toString()}` });
//             logger.debug(cron, { label: `itshouldbe${i}:${itShouldBe}` });
//             expect(tz === 'utc' ? occurence.toUTCString() : occurence?.toString()).toBe(itShouldBe);
//         });
//     });
// }

test('test range local #1', () => {
    const crons = ["0 1 ? * 4,6 * 4800000"]

    const start = 1678089600000;
    const end = 1678690799999;

    crons.forEach((cron) => {
        const cronParser = new EventCronParser(cron, start - 60000, undefined, 'local')
        let dates = cronParser.range(start, end)
        const hour = dates[0].getHours()
        // logger.debug(cron, { label: `itshouldbe ${hour}: ${dates.map(x=>x.getHours() + ' utc: ' + x.getUTCHours() +';')}` });
        // logger.debug("dates", { label: `itshouldbe ${hour}: ${dates}` });
        expect(dates.every(d=>d.getHours() === hour)).toBe(true)
        // expect(dates.every(d=>d.getUTCHours() === hour)).toBe(true)
    });
});

// test('next-rate-1', ()=> {
//     const crons: { cron: string; should: string[] }[] = [
//         {
//             cron: 'rate(2 days)',
//             should: [
//                 'Sun, 10 May 2020 09:30:00 GMT',
//                 'Tue, 12 May 2020 09:30:00 GMT',
//                 'Thu, 14 May 2020 09:30:00 GMT',
//                 'Sat, 16 May 2020 09:30:00 GMT',
//                 'Mon, 18 May 2020 09:30:00 GMT',
//                 'Wed, 20 May 2020 09:30:00 GMT',
//             ],
//         },
//     ];

//     console.log('date-next')
//     console.log(new Date(Date.UTC(2020, 5 - 1, 8, 9, 30, 0, 0)).toUTCString())

//     testMultipleNext(crons, new Date(Date.UTC(2020, 5 - 1, 8, 9, 30, 0, 0)))
// })
