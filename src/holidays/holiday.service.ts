import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Country,
  DayInfo,
  DayType,
  ConsecutiveFreeDays,
} from './holidays.model';
import { Days } from './day.entity';
import { Repository } from 'typeorm';
import { Countries } from './countries.entity';
import fetch from 'node-fetch';

@Injectable()
export class HolidaysService {
  constructor(
    @InjectRepository(Days) private repositoryDays: Repository<Days>,
    @InjectRepository(Countries)
    private repositoryCountry: Repository<Countries>,
  ) {}
  async getAllCountries() {
    const sum = await this.repositoryCountry.count();

    if (sum == 0) {
      let holidays: Country[] = [];
      let data = await fetch(
        'https://kayaposoft.com/enrico/json/v2.0/?action=getSupportedCountries',
      )
        .then((response) => response.json())
        .then((responseData) => {
          responseData.forEach((data) => {
            //console.log(data.countryCode);
            //console.log(data.fullName);
            const newcountry = new Country(data.countryCode, data.fullName);
            console.log(newcountry);
            //this.insertToCountries(data.fullName,data.countryCode);
            holidays.push(newcountry);
          });
          return holidays;
        })
        .catch((error) => {
          console.error(error);
          throw new Error('an exception occured');
        });
      await this.repositoryCountry.save(data);
      return data;
    } else {
      console.log('reading from database');
      return this.repositoryCountry.find();
    }
  }

  async getMonthHolidays(Country: string, year: number, month: number) {
    let monthHolidays: DayInfo[] = [];
    let query = await this.repositoryDays.query(
      `SELECT * FROM "Days" where "countryCode"='${Country}' and date like '%-${month}-${year}'`,
    );
    console.log(query.length);
    if (query.length == 0) {
      let data = await fetch(
        `https://kayaposoft.com/enrico/json/v2.0/?action=getHolidaysForMonth&month=${month}&year=${year}&country=${Country}`,
      )
        .then((response) => response.json())
        .then((responseData) => {
          responseData.forEach((data) => {
            let name: string = data.name[0].text;
            if (data.name.length == 2) {
              name = data.name[1].text;
            }
            var date: string = data.date.day + '-' + month + '-' + year;
            const newMonth = new DayInfo(
              Country,
              date,
              name,
              data.holidayType,
              data.date.dayOfWeek,
            );

            monthHolidays.push(newMonth);
          });
          return monthHolidays;
        })
        .catch((error) => {
          console.error(error);
          throw new Error('an exception occured');
        });
      await this.repositoryDays.save(data);
      return data;
    } else {
      console.log('reading from database');
      return await this.repositoryDays.query(
        `SELECT * FROM "Days" where "countryCode"='${Country}' and date like '%-${month}-${year}'`,
      );
    }
  }
  async getDayStatus(country: string, date: string) {
    let isItHoliday: string;
    let dateArr: string[] = date.split('-');
    if (dateArr[0].length == 4 && dateArr.length == 1)
      return await this.GetFreeDaysRepeated(country, dateArr[0]);
    else if (
      dateArr[0].length! <= 2 &&
      parseInt(dateArr[0]) >= 1 &&
      parseInt(dateArr[0]) <= 31 &&
      dateArr[1].length! <= 2 &&
      parseInt(dateArr[1]) >= 1 &&
      parseInt(dateArr[1]) <= 31
    ) {
      let query = await this.repositoryDays.query(
        `select "Type" from "Days" where "countryCode"='${country}' and "date"='${date}'`,
      );
      console.log(query.length);
      if (query.length == 0) {
        //let dateArr:string[] = date.split('-');
        let data = await fetch(
          `https://kayaposoft.com/enrico/json/v2.0/?action=isWorkDay&date=${date}&country=${country}`,
        )
          .then((response) => response.json())
          .then(async (responseData) => {
            if (responseData.isWorkDay == true) {
              isItHoliday = 'workday';
            } else if (responseData.isWorkDay == false) {
              isItHoliday = await fetch(
                `https://kayaposoft.com/enrico/json/v2.0/?action=isPublicHoliday&date=${date}&country=${country}`,
              )
                .then((response) => response.json())
                .then((responseData) => {
                  let holiday: string;
                  if (responseData.isPublicHoliday == true)
                    holiday = 'public_holiday';
                  else if (responseData.isPublicHoliday == false)
                    holiday = 'free_day';
                  else throw new NotFoundException('not found on this date');
                  return holiday;
                })
                .catch((error) => {
                  console.error(error);
                });
            } else return new NotFoundException('not found on this date');
            if (isItHoliday) {
              let week = new Date(
                dateArr[2] + '-' + dateArr[1] + '-' + dateArr[0],
              ).getDay();
              const day = new DayInfo(country, date, '', isItHoliday, week);
              console.log(day);
              this.repositoryDays.save(day);
              console.log(isItHoliday);
              return isItHoliday;
            }
          })
          .catch((error) => {
            console.error(error);
            throw new Error('error cached : date might not exsist');
          });
        return new DayType(data);
      } else {
        console.log('reading from database');
        return await this.repositoryDays.query(
          `select "Type" from "Days" where "countryCode"='${country}' and "date"='${date}'`,
        );
      }
    } else
      throw new NotFoundException(
        'correct formating for final argument is dd-mm-yyyy or yyyy',
      );
  }
  async GetFreeDaysRepeated(country: string, year: string) {
    let biggestCtonsecutive = 0;
    let currenCtonsecutive = 0;

    let mostFreeDayRepeated = await fetch(
      `https://kayaposoft.com/enrico/json/v2.0/?action=getHolidaysForYear&year=${year}&country=${country}&holidayType=public_holiday`,
    )
      .then((response) => response.json())
      .then(async (responseData) => {
        for (let index = 0; index < responseData.length; index++) {
          let query = await this.repositoryDays.query(
            `select * from "Days" where "countryCode"='${country}' and "date"='${responseData[index].date.day}-${responseData[index].date.month}-${year}' and "Type"='public_holiday'`,
          );

          if (query > 0) {
            await this.repositoryDays.query(
              `update "Days" set "name"='${responseData[index].name[1].text}' where "countryCode"='${country}' and "date"='${responseData[index].date.day}-${responseData[index].date.month}-${year}' and "Type"='public_holiday'`,
            );
          } else {
            let thisDay = `${responseData[index].date.day}-${responseData[index].date.month}-${year}`;
            let day = new DayInfo(
              country,
              thisDay,
              responseData[index].name[1].text,
              responseData[index].holidayType,
              responseData[index].date.dayOfWeek,
            );
            this.repositoryDays.save(day);
          }

          console.log(responseData[index]);
          let currentHolidayday = new Date(
            responseData[index].date.year,
            responseData[index].date.month,
            responseData[index].date.day,
          );
          currenCtonsecutive++;

          let nextHolidayday: Date;
          if (typeof responseData[index + 1] !== 'undefined')
            nextHolidayday = new Date(
              responseData[index + 1].date.year,
              responseData[index + 1].date.month,
              responseData[index + 1].date.day,
            );

          var tomorow = new Date(currentHolidayday);
          var yesterday = new Date(
            currentHolidayday.getFullYear(),
            currentHolidayday.getMonth(),
            currentHolidayday.getDate(),
          );
          tomorow.setDate(tomorow.getDate() + 1);
          yesterday.setDate(yesterday.getDate() - 1);

          console.log(
            'tomorow - ' + tomorow.getFullYear(),
            tomorow.getMonth(),
            tomorow.getDate(),
          );
          console.log(
            'yesterday - ' + yesterday.getFullYear(),
            yesterday.getMonth(),
            yesterday.getDate(),
          );
          if (typeof responseData[index + 1] !== 'undefined')
            console.log(
              'next holiday - ' + nextHolidayday.getFullYear(),
              nextHolidayday.getMonth(),
              nextHolidayday.getDate(),
            );

          if (
            yesterday.getMonth() !== 0 &&
            responseData[index].date.dayOfWeek == 7 &&
            index - 1 != -1 &&
            !(
              responseData[index - 1].date.year == yesterday.getFullYear() &&
              responseData[index - 1].date.month == yesterday.getMonth() &&
              responseData[index - 1].date.day == yesterday.getDate()
            )
          ) {
            console.log('++++' + currenCtonsecutive);
            currenCtonsecutive++;
          }

          let threeDaysBefore = new Date(currentHolidayday);
          threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);

          console.log('----------' + currenCtonsecutive + '------------');
          if (
            typeof responseData[index + 1] !== 'undefined' &&
            nextHolidayday.getFullYear() == tomorow.getFullYear() &&
            nextHolidayday.getMonth() == tomorow.getMonth() &&
            nextHolidayday.getDate() == tomorow.getDate()
          ) {
            console.log('-------------------------');
            continue;
          } else if (responseData[index].date.dayOfWeek == 5) {
            currenCtonsecutive += 2;
            console.log('<<<<<<<<<<' + currenCtonsecutive + '>>>>>>>>>>');
            let threeDaysAhead = new Date(currentHolidayday);
            threeDaysAhead.setDate(threeDaysAhead.getDate() + 3);
            if (
              typeof responseData[index + 1] !== 'undefined' &&
              !(
                nextHolidayday.getFullYear() == threeDaysAhead.getFullYear() &&
                nextHolidayday.getMonth() == threeDaysAhead.getMonth() &&
                nextHolidayday.getDate() == threeDaysAhead.getDate()
              )
            ) {
              if (biggestCtonsecutive < currenCtonsecutive)
                biggestCtonsecutive = currenCtonsecutive;
              currenCtonsecutive = 0;
            }
          } else if (
            responseData[index].date.dayOfWeek == 1 &&
            index - 1 != -1 &&
            !(
              responseData[index - 1].date.year == yesterday.getFullYear() &&
              responseData[index - 1].date.month == yesterday.getMonth() &&
              responseData[index - 1].date.day == yesterday.getDate()
            ) &&
            !(
              responseData[index - 1].date.year ==
                threeDaysBefore.getFullYear() &&
              responseData[index - 1].date.month ==
                threeDaysBefore.getMonth() &&
              responseData[index - 1].date.day == threeDaysBefore.getDate()
            )
          ) {
            console.log('<<<<<<<<<<>>>>>>>>>>');
            console.log(
              responseData[index - 1].date.year,
              responseData[index - 1].date.month,
              responseData[index - 1].date.day,
            );
            console.log(
              yesterday.getFullYear(),
              yesterday.getMonth(),
              yesterday.getDate(),
            );
            console.log('<<<<<<<<<<>>>>>>>>>>');
            if (
              yesterday.getMonth() - responseData[index - 1].date.month >
              -12
            ) {
              currenCtonsecutive += 2;
              console.log('<<<<<<<<<<' + currenCtonsecutive + '>>>>>>>>>>');
              if (biggestCtonsecutive < currenCtonsecutive)
                biggestCtonsecutive = currenCtonsecutive;
              currenCtonsecutive = 0;
            }
          } else if (responseData[index].date.dayOfWeek == 6) {
            currenCtonsecutive++;
            console.log(
              'its 6 day and no holiday after that: ' + currenCtonsecutive,
            );
            if (biggestCtonsecutive < currenCtonsecutive)
              biggestCtonsecutive = currenCtonsecutive;
            currenCtonsecutive = 0;
          } else {
            if (biggestCtonsecutive < currenCtonsecutive)
              biggestCtonsecutive = currenCtonsecutive;
            currenCtonsecutive = 0;
          }
        }
        if (biggestCtonsecutive <= 2) return 2;
        else return biggestCtonsecutive;
      })
      .catch((error) => {
        console.error(error);
        throw new Error('an exception occured');
      });

    return new ConsecutiveFreeDays(mostFreeDayRepeated);
  }
}
