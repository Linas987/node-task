export class Country {
  constructor(public countryCode: string, public countryFullname: string) {}
}
export class DayInfo {
  constructor(
    public countryCode: string,
    public date: string,
    public name: string,
    public Type: string,
    public dayOfWeek: number,
  ) {}
}
export class DayType {
  constructor(public Type: string) {}
}
export class ConsecutiveFreeDays {
  constructor(public consecutive_free_days: number) {}
}
