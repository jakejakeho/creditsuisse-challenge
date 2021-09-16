const Moment = require('moment');
const MomentRange = require('moment-range');

const moment = MomentRange.extendMoment(Moment);
const json = {
    "shift": {
        "start": "2038-01-01T20:15:00",
        "end": "2038-01-02T04:15:00"
    },
    "roboRate": {
        "dayRate": {
            "start": "07:00:00",
            "end": "23:00:00",
            "value": 20
        },
        "standardNight": {
            "start": "23:00:00",
            "end": "07:00:00",
            "value": 25
        },
        "extraDay": {
            "start": "07:00:00",
            "end": "23:00:00",
            "value": 30
        },
        "extraNight": {
            "start": "23:00:00",
            "end": "07:00:00",
            "value": 35
        }
    }
}
const startDate = moment(json.shift.start);
const endDate = moment(json.shift.end);
console.log('startDate = ', startDate);
console.log('endDate = ', endDate);
let i = startDate;
let totalSalary = 0;
while (i.diff(endDate) < 0) {
    console.log('--------');
    console.log('i = ', i);
    let thisDateStr = i.format('YYYY-MM-DD');
    let startOfDate = moment(i).startOf('day');
    let nextDate = moment(i).add(1, 'day').startOf('day');
    let currentWeekday = i.weekday();
    let dayRate;
    let nightRate;
    let rate;
    // find weekday / weekend first
    if (currentWeekday >= 1 && currentWeekday <= 5) {
        rate = 'Standard';
        dayRate = json.roboRate.dayRate;
        nightRate = json.roboRate.standardNight;
    } else {
        rate = 'Extra';
        dayRate = json.roboRate.extraDay;
        nightRate = json.roboRate.extraNight;
    }
    // find Day or night
    let standardDayStart = moment(`${thisDateStr} ${dayRate.start}`);
    let standardDayEnd = moment(`${thisDateStr} ${dayRate.end}`);
    let standardDaySalary = dayRate.value;
    if (isOvernightPeriod(standardDayStart, standardDayEnd)) {
        if (moment.range(minimumDate(standardDayStart, startOfDate), standardDayEnd).contains(i)) {
            console.log(rate + 'Day is overnight minus');
            standardDayStart = startOfDate;
        } else {
            console.log(rate + 'Day is overnight add');
            standardDayEnd.add(1, 'day');
        }
    }
    standardDayEnd = minimumDate(minimumDate(nextDate, standardDayEnd), endDate)
    let standardDayRange = moment.range(standardDayStart, standardDayEnd);
    console.log('DayRange = ', standardDayRange);
    if (standardDayRange.contains(i)) {
        console.log(rate + 'Day minutes', standardDayEnd.diff(i, 'minutes'));
        console.log(rate + 'Day salary', standardDaySalary);
        totalSalary += standardDaySalary * standardDayEnd.diff(i, 'minutes');
        i = standardDayEnd;
    }

    let standardNightStart = moment(`${thisDateStr} ${nightRate.start}`);
    let standardNightEnd = moment(`${thisDateStr} ${nightRate.end}`);
    if (isOvernightPeriod(standardNightStart, standardNightEnd)) {
        if (moment.range(minimumDate(standardNightStart, startOfDate), standardNightEnd).contains(i)) {
            console.log(rate + 'Night is overnight minus');
            standardNightStart = startOfDate;
        } else {
            console.log(rate + 'Night is add');
            standardNightEnd.add(1, 'day');
        }
    }
    let standardNightSalary = nightRate.value;
    let standardNightRange = moment.range(standardNightStart, standardNightEnd);
    standardNightEnd = minimumDate(minimumDate(nextDate, standardNightEnd), endDate);
    console.log(rate + 'NightRange = ', standardNightRange);
    if (standardNightRange.contains(i, { excludeEnd: true })) {
        let minutes = standardNightEnd.diff(i, 'minutes')
        totalSalary += standardNightSalary * minutes;
        console.log(rate + 'Night minutes:', minutes);
        console.log(rate + 'Night salary', standardNightSalary);
        i = standardNightEnd;
    }
}

console.log('totalSalary = ', totalSalary);

function minimumDate(day1, day2) {
    return day1.diff(day2) <= 0 ? day1 : day2;
}

function isOvernightPeriod(start, end) {
    return end.diff(start) < 0;
}