export type ParsedRule = (string | number)[];

export interface ParsedCron {
    minutes: ParsedRule;
    hours: ParsedRule;
    daysOfMonth: ParsedRule;
    months: ParsedRule;
    daysOfWeek: ParsedRule;
    years: ParsedRule;
    duration: number, // in ms
    start: Date, // this should affect years
    end: Date | null,
}

export interface ParsedRate {
    rate: number, // in seconds
    duration: number, // in ms
    value: number,
    unit: string,
    start: Date,
    end: Date | null,
}

const parseIntMinMax = (str: string, min: number, max: number): number => {
    const num = parseInt(str, 10);
    if (num < min || num > max) throw new Error(`Invalid: number ${num} is not between ${min} and ${max}`);
    return num;
};

// example rules: 'L' '1,2'
const parseOneRule = (rule: string, min: number, max: number): ParsedRule => {
    if (rule === '?') {
        return [];
    }
    if (rule === 'L') {
        return ['L', 0];
    }
    if (rule.startsWith('L-')) {
        return ['L', parseIntMinMax(rule.substring(2), min, max)];
    }
    if (rule.endsWith('L')) {
        return ['L', parseIntMinMax(rule.substring(0, rule.length - 1), min, max)];
    }
    if (rule.endsWith('W')) {
        return ['W', parseIntMinMax(rule.substring(0, rule.length - 1), min, max)];
    }
    if (rule.includes('#')) {
        return ['#', parseIntMinMax(rule.split('#')[0], min, max), parseIntMinMax(rule.split('#')[1], min, max)];
    }

    let newRule;
    if (rule === '*') {
        newRule = `${min}-${max}`;
    } else if (rule.includes('/')) {
        const parts = rule.split('/');
        let start, end;
        if (parts[0] === '*') {
            start = min;
            end = max;
        } else if (parts[0].includes('-')) {
            const splits = parts[0].split('-');
            start = parseIntMinMax(splits[0], min, max);
            end = parseIntMinMax(splits[1], min, max);
        } else {
            start = parseIntMinMax(parts[0], min, max);
            end = max;
        }
        const increment = parseIntMinMax(parts[1], 1, max);
        newRule = '';
        while (start <= end) {
            newRule += `,${start}`;
            start += increment;
        }
        newRule = newRule.substring(1);
    } else {
        newRule = rule;
    }

    const allows: number[] = [];
    newRule.split(',').forEach((s) => {
        if (s.includes('-')) {
            const parts = s.split('-');
            const start = parseIntMinMax(parts[0], min, max);
            const end = parseIntMinMax(parts[1], min, max);
            for (let i = start; i <= end; i += 1) allows.push(i);
        } else {
            allows.push(parseIntMinMax(s, min, max));
        }
    });
    return allows;
};

// ex. s = "1,2"
const replace = (s: string, rules: string[][]) => {
    let rs = s.toUpperCase();
    rules.forEach(([from, to]) => {
        rs = rs.replace(from, to);
    });
    return rs;
};

const monthReplaces = [
    ['JAN', '1'],
    ['FEB', '2'],
    ['MAR', '3'],
    ['APR', '4'],
    ['MAY', '5'],
    ['JUN', '6'],
    ['JUL', '7'],
    ['AUG', '8'],
    ['SEP', '9'],
    ['OCT', '10'],
    ['NOV', '11'],
    ['DEC', '12'],
];

const dayWeekReplaces = [
    ['SUN', '1'],
    ['MON', '2'],
    ['TUE', '3'],
    ['WED', '4'],
    ['THU', '5'],
    ['FRI', '6'],
    ['SAT', '7'],
];

const VALID_CHARS = new Set(['L', 'W', '#'])
export function validateParsedRule(rule: ParsedRule) {
    rule.forEach(val=>{
        if (typeof val === 'number') {
            if (Number.isNaN(val))
                throw new Error('invalid cron (NaN)')
        } else if (typeof val === 'string') {
            if (!VALID_CHARS.has(val))
                throw new Error('invalid cron: ' + val + ' not accepted')
        } else {
            throw new Error(`invalid cron: ${typeof val} not accepted`)
        }
    })
}

export function parse(cron: string, start?: Date | number, end?: Date | number, isRateExpression = false): ParsedCron | ParsedRate {
    if (isRateExpression) return parseRateExpression(cron, start, end)
    return parseCron(cron, start, end)
}

// in seconds
const rateUnits = {
    'minute': 60,
    'minutes': 60, 
    'hour': 3600, 
    'hours': 3600, 
    'day': 3600*24, 
    'days': 3600*24
}

// takes in ex. rate(1 hour, 3600000) OR rate(360 minutes)
export function parseRateExpression(expression: string, start?: Date | number, end?: Date | number): ParsedRate {
    const exp = expression.substring(5, expression.length - 1).split(',')
    // const exp = expression.split(',')
    const rate = exp[0].trim().split(' ')

    if (rate.length !== 2) throw new Error('invalid rate expression')
    const val = parseInt(rate[0].trim())
    if (Number.isNaN(val)) throw new Error('invalid rate expression value')
    const unit = rate[1];
    if (!rateUnits[unit]) throw new Error('invalid rate expression unit')

    // prob better to just store cron as milliseconds or seconds instead

    return {
        rate: rateUnits[unit] * val, // in seconds
        duration: exp.length > 1 ? parseInt(exp[1].trim()) : 0, 
        value: val, unit, start: start ? new Date(start) : new Date(0) , 
        end: end ? new Date(end) : null
    }
}

export function parseCron(cron: string, start?: Date | number, end?: Date | number): ParsedCron {
    const rules = cron.split(' ');

    return {
        minutes: parseOneRule(rules[0], 0, 59),
        hours: parseOneRule(rules[1], 0, 23),
        daysOfMonth: parseOneRule(rules[2], 1, 31),
        months: parseOneRule(replace(rules[3], monthReplaces), 1, 12),
        daysOfWeek: parseOneRule(replace(rules[4], dayWeekReplaces), 1, 7),
        years: parseOneRule(rules[5], 1970, 2199),
        duration: rules.length >= 7 ? parseInt(rules[6]) : 0,
        start: start ? new Date(start) : new Date(0),
        end: end ? new Date(end) : null
    };
}
