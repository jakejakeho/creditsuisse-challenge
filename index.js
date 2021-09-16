const Moment = require('moment');
const MomentRange = require('moment-range');

const moment = MomentRange.extendMoment(Moment);
// Read json from testcase.json
const json = require('./testcase.json');

// Load settings
let rateType = 'Standard';
const standardRates = [{
    rateName: 'Day',
    rateType,
    rate: json.roboRate.dayRate,
}, {
    rateName: 'Night',
    rateType,
    rate: json.roboRate.standardNight,
}];

rateType = 'Extra';
const extraRates = [{
    rateName: 'Day',
    rateType,
    rate: json.roboRate.extraDay,
}, {
    rateName: 'Night',
    rateType,
    rate: json.roboRate.extraNight,
}];

// init
const shiftStart = moment(json.shift.start);
const shiftEnd = moment(json.shift.end);
let currentWorkTime = shiftStart;
let totalSalary = 0;
let nextRestTime = moment(currentWorkTime).add(8, 'hour');
// loop untill shift end
while (currentWorkTime.diff(shiftEnd) < 0) {
    let currentWeekday = currentWorkTime.weekday();
    // use different rates based on weekdays / weekends
    (currentWeekday >= 1 && currentWeekday <= 5 ? standardRates : extraRates).map((robotRate) => {
        let periodStart = moment(`${currentWorkTime.format('YYYY-MM-DD')} ${robotRate.rate.start}`);
        let periodEnd = moment(`${currentWorkTime.format('YYYY-MM-DD')} ${robotRate.rate.end}`);
        if (isOvernightPeriod(periodStart, periodEnd)) {
            let startOfDate = moment(currentWorkTime).startOf('day');
            // if overnight and near start date calculate early part first
            if (moment.range(minimumDate(periodStart, startOfDate), periodEnd).contains(currentWorkTime)) {
                console.log(`${robotRate.rateType} ${robotRate.rateName} calculate day part`);
                periodStart = startOfDate;
            }
            // if overnight and near end date calculate night part
            else {
                console.log(`${robotRate.rateType} ${robotRate.rateName} calculate night part`);
                periodEnd.add(1, 'day');
            }
        }

        let nextDate = moment(currentWorkTime).add(1, 'day').startOf('day');
        // only calculate to the end of day or shift end
        periodEnd = minimumDate(periodEnd, minimumDate(nextDate, shiftEnd));
        let dayRange = moment.range(periodStart, periodEnd);
        // check if current time fit to the rate time range
        if (dayRange.contains(currentWorkTime)) {
            // need rest
            let needRest = periodEnd.diff(nextRestTime) >= 0;
            if (needRest) {
                periodEnd = minimumDate(periodEnd, moment(nextRestTime));
                nextRestTime.add(9, 'hours'); // update nextRest time 
            }
            let salary = robotRate.rate.value;
            let minutes = periodEnd.diff(currentWorkTime, 'minutes');
            console.log(`${robotRate.rateType} ${robotRate.rateName} salary = ${salary}`)
            console.log(`${robotRate.rateType} ${robotRate.rateName} minutes = ${minutes}`)
            totalSalary += salary * minutes;
            currentWorkTime = periodEnd;
            // make start working time 1 hour later
            if (needRest) currentWorkTime = moment(periodEnd).add(1, 'hour');
        }
    });
}
console.log('totalSalary = ', totalSalary);

function minimumDate(day1, day2) {
    return day1.diff(day2) <= 0 ? day1 : day2;
}

function isOvernightPeriod(start, end) {
    return end.diff(start) < 0;
}