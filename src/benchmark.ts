import Benchmark from 'benchmark';
import EventCronParser from '.';

new Benchmark.Suite()
    .add('aws-cron-parser-next', function () {
        new EventCronParser('1 2 3 4 ? *').next(new Date())
    })
    // .add('aws-cron-parser-prev', function () { // TODO
    //     prev(parse('1 2 3 4 ? *'), new Date());
    //     new EventCronParser('1 2 3 4 ? *').next(new Date())
    // })
    .on('cycle', function (event: { target: any }) {
        console.log(String(event.target));
    })
    .run({ async: true });
