export class Country {
    constructor(
        public countryCode: string,
        public countryFullname: string,
        )
        {};
}
export class Month {//hold everything in one table
    constructor(
        public countryCode: string,
        public date: string,
        public name: string,
        public Type: string,//will be public holiday,workday or free_day if it's dayOfWeek value is 6 or 7
        public dayOfWeek: number,
        )
        {};
}
export class NotHollidays{
    constructor(
        public type: string
    )
    {};
}
export class ConsecutiveFreeDays{
    constructor(
        public consecutive_free_days: number
    )
    {};
}