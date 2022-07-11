import Benchmark from 'benchmark';
import { parse } from '@/lib/parse'
import { next } from '@/lib/next'
import { prev } from '@/lib/prev'

new Benchmark.Suite()
    .add('aws-cron-parser-next', function () {
        next(parse('1 2 3 4 ? *'), new Date());
    })
    .add('aws-cron-parser-prev', function () {
        prev(parse('1 2 3 4 ? *'), new Date());
    })
    .on('cycle', function (event: { target: any }) {
        console.log(String(event.target));
    })
    .run({ async: true });
