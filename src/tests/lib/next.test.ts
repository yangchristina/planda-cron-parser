// import AwsCronParser from '../..';
import EventCronParser from '../../'

function testMultipleNext(crons: any[], start: Date, inclusive = false) {
    crons.forEach(({ cron, should: theyShouldBe }) => {
        const event = new EventCronParser(cron, start, undefined, 'utc')
        let occurence: Date = start;
        theyShouldBe.forEach((itShouldBe: any, i: number) => {
            if (i % 2 == 0) {
                occurence = event.next(new Date(occurence.getTime()), inclusive) || new Date(0);
            } else {
                occurence = event.next() || new Date(0)
            }
            // logger.debug(cron, { label: `${i}:${occurence?.toUTCString()}` });
            expect(occurence?.toUTCString()).toBe(itShouldBe);
        });
    });
}

interface TestCaseOptions {
    occurrence_arg?: Date,
    start?: Date,
}
function testCases(crons: any[], tz: 'utc' | 'local' = 'utc', duration = 0, options?: TestCaseOptions) {
    const { occurrence_arg, start } = options || {}
    crons.forEach(({ cron, should: theyShouldBe }) => {
        const event = new EventCronParser(cron, start, undefined, tz)
        let occurence: Date = occurrence_arg ?? new Date(2022, 6, 5); // 'Tue Jul 05 2022 00:00:00 GMT-0700 (Pacific Daylight Time)'
        theyShouldBe.forEach((itShouldBe: any, i: number) => {
            // logger.debug(cron, { label: `arg-${i}:${new Date(occurence.getTime() + duration + 60000)?.toString()}` });
            occurence = event.next(new Date(occurence.getTime() + duration + 60000), undefined) || new Date(0);
            // logger.debug(cron, { label: `${i}:${occurence?.toString()}` });
            // logger.debug(cron, { label: `itshouldbe${i}:${itShouldBe}` });
            expect(tz === 'utc' ? occurence.toUTCString() : occurence?.toString()).toBe(itShouldBe);
        });
    });
}

test('near end timezone shift bug', ()=>{
    const parser = new EventCronParser('0 23 ? * 4 * 3600000', new Date(2023, 8, 1), new Date(2023, 11, 1), 'local')
    const next = parser.next(new Date(2023, 10, 29, 15, 30), true)
    expect(next).toBeTruthy()
})

test('test local #1', () => {
    const crons: { cron: string; should: string[] }[] = [
        {
            cron: "0 7 ? * MON,WED,FRI *",
            should: [
                new Date(Date.UTC(2022, 6, 6, 7)).toString(), // wed
                new Date(Date.UTC(2022, 6, 8, 7)).toString(), // fri
                new Date(Date.UTC(2022, 6, 11, 7)).toString(), // mon
                new Date(Date.UTC(2022, 6, 13, 7)).toString(), // wed
                new Date(Date.UTC(2022, 6, 15, 7)).toString(), // fri
                new Date(Date.UTC(2022, 6, 18, 7)).toString(), // fri
            ],
        },
    ]

    testCases(crons, 'local', undefined, { start: new Date(2022, 6, 1, 21) })
});

test('test local daylight savings #1', () => {
    const crons: { cron: string; should: string[] }[] = [
        {
            cron: "0 11 ? * * *",
            should: [
                new Date(Date.UTC(2023, 10, 4, 11)).toString(), // sat
                new Date(Date.UTC(2023, 10, 5, 12)).toString(), // sun
                new Date(Date.UTC(2023, 10, 6, 12)).toString(), // mon
            ],
        },
    ]

    testCases(crons, 'local', undefined,
        { occurrence_arg: new Date(Date.UTC(2023, 10, 3, 14)),
            start: new Date(Date.UTC(2023, 10, 1, 9)) }
    )
});

test('test local duration #1', () => {
    const duration = 3600000
    const crons: { cron: string; should: string[] }[] = [
        {
            cron: "30 7 ? * MON,WED,FRI * " + duration,
            should: [
                new Date(Date.UTC(2022, 6, 6, 7, 30)).toString(), // wed
                new Date(Date.UTC(2022, 6, 8, 7, 30)).toString(), // fri
                new Date(Date.UTC(2022, 6, 11, 7, 30)).toString(), // mon
                new Date(Date.UTC(2022, 6, 13, 7, 30)).toString(), // wed
                new Date(Date.UTC(2022, 6, 15, 7, 30)).toString(), // fri
                new Date(Date.UTC(2022, 6, 18, 7, 30)).toString(), // fri
            ],
        },
    ]

    testCases(crons, 'local', duration, { start: new Date(Date.UTC(2022, 5, 25, 7, 30)) })

});

test('test local duration #2', () => {
    const duration = 3600000
    const crons: { cron: string; should: string[] }[] = [
        {
            cron: "30 7 ? * MON,WED,FRI * " + duration,
            should: [
                new Date(Date.UTC(2022, 6, 6, 7, 30)).toString(), // wed
                new Date(Date.UTC(2022, 6, 6, 7, 30)).toString(), // wed
                new Date(Date.UTC(2022, 6, 6, 7, 30)).toString(), // wed
            ],
        },
    ]

    testCases(crons, 'local', duration / 2 - 60000, { start: new Date(Date.UTC(2022, 5, 25, 7, 30)) })
})

test('should generate multiple next occurences #1', () => {
    const crons: { cron: string; should: string[] }[] = [
        {
            cron: '23,24,25 17,18 25 MAR/4 ? 2020,2021,2023,2028 0',
            should: [
                'Sat, 25 Jul 2020 17:23:00 GMT',
                'Sat, 25 Jul 2020 17:24:00 GMT',
                'Sat, 25 Jul 2020 17:25:00 GMT',
                'Sat, 25 Jul 2020 18:23:00 GMT',
                'Sat, 25 Jul 2020 18:24:00 GMT',
                'Sat, 25 Jul 2020 18:25:00 GMT',
                'Wed, 25 Nov 2020 17:23:00 GMT',
                'Wed, 25 Nov 2020 17:24:00 GMT',
                'Wed, 25 Nov 2020 17:25:00 GMT',
                'Wed, 25 Nov 2020 18:23:00 GMT',
            ],
        },
    ]

    testMultipleNext(crons, new Date(Date.UTC(2020, 5 - 1, 9, 22, 30, 57)))
});

test('should generate multiple next occurences #2', () => {
    const crons: { cron: string; should: string[] }[] = [
        {
            cron: '15 10 ? * 6L 2002-2025',
            should: [
                'Fri, 29 May 2020 10:15:00 GMT',
                'Fri, 26 Jun 2020 10:15:00 GMT',
                'Fri, 31 Jul 2020 10:15:00 GMT',
                'Fri, 28 Aug 2020 10:15:00 GMT',
                'Fri, 25 Sep 2020 10:15:00 GMT',
                'Fri, 30 Oct 2020 10:15:00 GMT',
                'Fri, 27 Nov 2020 10:15:00 GMT',
                'Fri, 25 Dec 2020 10:15:00 GMT',
                'Fri, 29 Jan 2021 10:15:00 GMT',
                'Fri, 26 Feb 2021 10:15:00 GMT',
            ],
        },
    ];

    testMultipleNext(crons, new Date(Date.UTC(2020, 5 - 1, 9, 22, 30, 57)))
});

test('should generate multiple next occurences #3', () => {
    const crons: { cron: string; should: string[] }[] = [
        {
            cron: '0 */3 */1 * ? *',
            should: [
                'Mon, 07 Dec 2020 18:00:00 GMT',
                'Mon, 07 Dec 2020 21:00:00 GMT',
                'Tue, 08 Dec 2020 00:00:00 GMT',
                'Tue, 08 Dec 2020 03:00:00 GMT',
            ],
        },
    ];

    testMultipleNext(crons, new Date(Date.UTC(2020, 12 - 1, 7, 15, 57, 37)))
});

test('should generate multiple next occurences #4', () => {
    const crons: { cron: string; should: string[] }[] = [
        {
            cron: '15 12 ? * sun,mon *',
            should: [
                'Sun, 13 Dec 2020 12:15:00 GMT',
                'Mon, 14 Dec 2020 12:15:00 GMT',
                'Sun, 20 Dec 2020 12:15:00 GMT',
                'Mon, 21 Dec 2020 12:15:00 GMT',
            ],
        },
    ];

    testMultipleNext(crons, new Date(Date.UTC(2020, 12 - 1, 7, 15, 57, 37)))
});

test('next-6', () => {
    const crons: { cron: string; should: string[] }[] = [
        {
            cron: '10 7/5 7 * ? 2020,2021',
            should: [
                'Mon, 07 Dec 2020 17:10:00 GMT',
                'Mon, 07 Dec 2020 22:10:00 GMT',
                'Thu, 07 Jan 2021 07:10:00 GMT',
                'Thu, 07 Jan 2021 12:10:00 GMT',
            ],
        },
    ];

    testMultipleNext(crons, new Date(Date.UTC(2020, 12 - 1, 7, 15, 57, 37)))
});

test('next-7', () => {
    const crons: { cron: string; should: string[] }[] = [
        {
            cron: '0-29/5 22 09 05 ? 2020,2021,2022',
            should: [
                'Sun, 09 May 2021 22:00:00 GMT',
                'Sun, 09 May 2021 22:05:00 GMT',
                'Sun, 09 May 2021 22:10:00 GMT',
                'Sun, 09 May 2021 22:15:00 GMT',
                'Sun, 09 May 2021 22:20:00 GMT',
                'Sun, 09 May 2021 22:25:00 GMT',
                'Mon, 09 May 2022 22:00:00 GMT',
                'Mon, 09 May 2022 22:05:00 GMT',
                'Mon, 09 May 2022 22:10:00 GMT',
                'Mon, 09 May 2022 22:15:00 GMT',
                'Mon, 09 May 2022 22:20:00 GMT',
                'Mon, 09 May 2022 22:25:00 GMT',
            ],
        },
    ];

    testMultipleNext(crons, new Date(Date.UTC(2020, 5 - 1, 9, 22, 30, 57)))
});

test('next-8', () => {
    const crons: { cron: string; should: string[] }[] = [
        {
            cron: '30 9 L-2 * ? *',
            should: [
                'Fri, 29 May 2020 09:30:00 GMT',
                'Sun, 28 Jun 2020 09:30:00 GMT',
                'Wed, 29 Jul 2020 09:30:00 GMT',
                'Sat, 29 Aug 2020 09:30:00 GMT',
                'Mon, 28 Sep 2020 09:30:00 GMT',
                'Thu, 29 Oct 2020 09:30:00 GMT',
                'Sat, 28 Nov 2020 09:30:00 GMT',
            ],
        },
    ];

    testMultipleNext(crons, new Date(Date.UTC(2020, 5 - 1, 9, 22, 30, 57)))
});

test('next-rate-1', () => {
    const crons: { cron: string; should: string[] }[] = [
        {
            cron: 'rate(2 days)',
            should: [
                'Sun, 10 May 2020 09:30:00 GMT',
                'Tue, 12 May 2020 09:30:00 GMT',
                'Thu, 14 May 2020 09:30:00 GMT',
                'Sat, 16 May 2020 09:30:00 GMT',
                'Mon, 18 May 2020 09:30:00 GMT',
                'Wed, 20 May 2020 09:30:00 GMT',
            ],
        },
    ];

    // console.log('date-next')
    // console.log(new Date(Date.UTC(2020, 5 - 1, 8, 9, 30, 0, 0)).toUTCString())

    testMultipleNext(crons, new Date(Date.UTC(2020, 5 - 1, 8, 9, 30, 0, 0)))
})
