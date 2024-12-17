import EventCronParser from '../..';

process.env.TZ = 'America/Vancouver';

const msPerDay = 1000 * 60 * 60 * 24;
const msPerWeek = msPerDay * 7;

// "0 0 ? * 1 * 3600000"
// 1730592000000
// 5pm
test('setUTCHours for daylight savings, start in pdt, referenceDate in pst', () => {
    // const cronsUTC = [
    //     // ['0 8 * * ? * 3600000', 'every day from 8:00 AM - 9:00 AM'],
    //     ['0 15 ? * 2,4,6 * 3600000', [2,4,6]],
    //     ['0 18 ? * 2,4,6 * 3600000', [2,4,6]],
    // ]

    const cronsLocal: [string, number, number][] = [
        // ["0 0 ? * 1 * 3600000", 1730156400000, 17],
        ["0 4 ? * 1 * 3600000", 1730170800000, 21]
    ];
    // "0 0 ? * 1 * 3600000"

    cronsLocal.forEach(([cron, start, itShouldBe]) => {
        const parsed = new EventCronParser(cron, start - msPerWeek, undefined);
        const nextInPdt = parsed.next(start - msPerWeek)
        const referenceDate = new Date('2024-12-16')
        referenceDate.setHours(itShouldBe, 0, 0, 0)
        parsed.setUTCHours([referenceDate.getUTCHours()], [0], { preserveLocalDaysOfWeek: false, referenceDate: referenceDate})
        const nextInPst = parsed.next('2024-12-16')
        nextInPst && console.log(nextInPdt, 'nextInPst', new Date(nextInPst))
        expect(nextInPst?.getHours()).toBe(itShouldBe);
    });
});
