import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Country, Month, NotHollidays, ConsecutiveFreeDays} from "./holidays.model";
import { Days } from "./day.entity";
import { Repository } from "typeorm";
import { Countries } from "./countries.entity";
import fetch from 'node-fetch';

@Injectable()
export class ProductsService{
    constructor(
        @InjectRepository(Days) private repozitoryDays: Repository<Days>,
        @InjectRepository(Countries) private repozitoryCountry: Repository<Countries>,
        ){}
    async allCountries()
    {
        let sum = await this.repozitoryCountry.count();

        if(sum==0){
        let holidays: Country[]=[];
        let data = await fetch("https://kayaposoft.com/enrico/json/v2.0/?action=getSupportedCountries")
        .then((response) => response.json())
        .then((responseData) => {
            responseData.forEach(data => {
                //console.log(data.countryCode);
                //console.log(data.fullName);
                const newcountry = new Country(data.countryCode,data.fullName);
                console.log(newcountry);
                this.repozitoryCountry.save(newcountry);
                //this.insertToCountries(data.fullName,data.countryCode);
                holidays.push(newcountry);
            });
            return holidays;
          })
        .catch(error => {
            console.error(error);
        });
        return data;
        }
        else{
            console.log("reading from database");
            return this.repozitoryCountry.find();
        }
    }
    
    async monthHolidays(Country:string,year:number,month:number){
        let monthHolidays: Month[]=[];
        let query = await this.repozitoryDays.query(`SELECT * FROM "Days" where "countryCode"='${Country}' and date like '%-${month}-${year}'`);
        console.log(query.length);
        if(query.length==0){
        let data = await fetch(`https://kayaposoft.com/enrico/json/v2.0/?action=getHolidaysForMonth&month=${month}&year=${year}&country=${Country}`)
        .then((response) => response.json())
        .then((responseData) => {
            responseData.forEach(data => {
                let name:string =data.name[0].text;
                if(data.name.length == 2){
                    name =data.name[1].text;
                }
                var date:string = (data.date.day+'-'+month+'-'+year)
                const newMonth = new Month(Country,date,name,data.holidayType,data.date.dayOfWeek);
                this.repozitoryDays.save(newMonth);
                monthHolidays.push(newMonth);
            });
            return monthHolidays;
          })
        .catch(error => {
            console.error(error);
        });
        return data;
        }
        else{
            console.log("reading from database");
            return await this.repozitoryDays.query(`SELECT * FROM "Days" where "countryCode"='${Country}' and date like '%-${month}-${year}'`);
        }
    }
    async dayStatus(country:string,date:string){
        let notHolidays: string;
        let dateArr:string[] = date.split('-');
        if((dateArr[0].length==4)&&(dateArr.length==1))
        {
            return await this.freeDaysRepeated(country,dateArr[0]);
        }
        else if((dateArr[0].length!<=2)&&((parseInt(dateArr[0])>=1)&&(parseInt(dateArr[0])<=31))&&((dateArr[1].length!<=2)&&(parseInt(dateArr[1])>=1)&&(parseInt(dateArr[1])<=31)))
        {
            let query = await this.repozitoryDays.query(`select "Type" from "Days" where "countryCode"='${country}' and "date"='${date}'`);
            console.log(query.length);
            if(query.length==0){
                //let dateArr:string[] = date.split('-');
                let data = await fetch(`https://kayaposoft.com/enrico/json/v2.0/?action=isWorkDay&date=${date}&country=${country}`)
                .then((response) => response.json())
                .then(async(responseData) => {
                    if(responseData.isWorkDay==true){
                        notHolidays=("workday");
                    }else if(responseData.isWorkDay==false){
                        notHolidays = await fetch(`https://kayaposoft.com/enrico/json/v2.0/?action=isPublicHoliday&date=${date}&country=${country}`)
                        .then((response) => response.json())
                        .then((responseData) => {
                            let holiday:string;
                            if(responseData.isPublicHoliday==true)
                            holiday=("public_holiday")
                            else if(responseData.isPublicHoliday==false)
                            holiday=("free_day")
                            else
                            throw new NotFoundException();
                            return holiday;
                        }).catch(error => {
                            console.error(error);
                        });
                    }else
                    return new NotFoundException();
                    if(notHolidays){
                        let week= new Date(dateArr[2]+"-"+dateArr[1]+"-"+dateArr[0]).getDay();
                        const day = new Month(country,date,"",notHolidays,week);
                        console.log(day)
                        this.repozitoryDays.save(day);
                        console.log(notHolidays)
                        return notHolidays;
                    }
                })
                .catch(error => {
                    console.error(error);
                });
                return new NotHollidays(data);
            }else{
                console.log("reading from database");
                return await this.repozitoryDays.query(`select "Type" from "Days" where "countryCode"='${country}' and "date"='${date}'`);
            }
        }
        else
        throw new NotFoundException("correct formating for final argument is dd-mm-yyyy or yyyy");
    }
    async freeDaysRepeated(country:string,year:string){
        let biggestCtonsecutive = 0;
        let currenCtonsecutive = 0;

            //let date = new Date(parseInt(year),1,1);
            //let consecutiveFreeDays:ConsecutiveFreeDays;
            let mostFreeDayRepeated = await fetch(`https://kayaposoft.com/enrico/json/v2.0/?action=getHolidaysForYear&year=${year}&country=${country}&holidayType=public_holiday`)
            .then((response) => response.json())
            .then(async(responseData) => {
                for(let index=0;index<responseData.length;index++){
                    
                    let query=await this.repozitoryDays.query(`select * from "Days" where "countryCode"='${country}' and "date"='${responseData[index].date.day}-${responseData[index].date.month}-${year}' and "Type"='public_holiday'`)
                    //console.log(query.length)
                    if(query>0){
                        await this.repozitoryDays.query(`update "Days" set "name"='${responseData[index].name[1].text}' where "countryCode"='${country}' and "date"='${responseData[index].date.day}-${responseData[index].date.month}-${year}' and "Type"='public_holiday'`);
                    }
                    else{
                        let thisDay = `${responseData[index].date.day}-${responseData[index].date.month}-${year}`;
                        let day = new Month(country,thisDay,responseData[index].name[1].text,responseData[index].holidayType,responseData[index].date.dayOfWeek);
                        this.repozitoryDays.save(day);
                    }
                    //update "Days" set "name"='' where "countryCode"='' and "date"='' and Type='public_holiday';
                    //console.log(query)

                    //console.log(responseData[index]);
                    let currentHolidayday = new Date(responseData[index].date.year,responseData[index].date.month,responseData[index].date.day);
                    currenCtonsecutive++;

                    let nextHolidayday:Date;
                    if(typeof responseData[index+1] !=="undefined")
                        nextHolidayday = new Date(responseData[index+1].date.year,responseData[index+1].date.month,responseData[index+1].date.day);

                    //console.log(nextHolidayday.getFullYear(),nextHolidayday.getMonth(),nextHolidayday.getDate())
                    
                    var tomorow=new Date(currentHolidayday);
                    var yesterday=new Date(currentHolidayday.getFullYear(),currentHolidayday.getMonth(),currentHolidayday.getDate());
                    tomorow.setDate(tomorow.getDate()+1);
                    yesterday.setDate(yesterday.getDate()-1);
                    //console.log(tomorow.getFullYear(),tomorow.getMonth(),tomorow.getDate())

                    //console.log("tomorow - "+tomorow.getFullYear(),tomorow.getMonth(),tomorow.getDate())
                    //console.log("yesterday - "+yesterday.getFullYear(),yesterday.getMonth(),yesterday.getDate())
                    if(typeof responseData[index+1] !=="undefined")
                        //console.log("next holiday - "+nextHolidayday.getFullYear(),nextHolidayday.getMonth(),nextHolidayday.getDate())
                    
                    if((yesterday.getMonth()!==0)&&responseData[index].date.dayOfWeek==7&&(index-1!=-1)&&(!(responseData[index-1].date.year==yesterday.getFullYear()&&responseData[index-1].date.month==yesterday.getMonth()&&responseData[index-1].date.day==yesterday.getDate())))
                        {//console.log("++++"+currenCtonsecutive);
                            currenCtonsecutive++}

                    let threeDaysBefore = new Date(currentHolidayday);
                    threeDaysBefore.setDate(threeDaysBefore.getDate()-3);

                    //console.log("----------"+currenCtonsecutive+"------------");
                    if((typeof responseData[index+1] !=="undefined")&&nextHolidayday.getFullYear()==tomorow.getFullYear()&&nextHolidayday.getMonth()==tomorow.getMonth()&&nextHolidayday.getDate()==tomorow.getDate()){
                        //console.log("-------------------------")
                        continue;
                    }
                    else if(responseData[index].date.dayOfWeek==5)//&&(index-1!=-1)&&
                    //(!(responseData[index-1].date.year==yesterday.getFullYear()&&responseData[index-1].date.month==yesterday.getMonth()&&responseData[index-1].date.day==yesterday.getDate())))
                    {   
                        //console.log("<<<<<<<<<<>>>>>>>>>>")
                        //console.log(responseData[index-1].date.year,responseData[index-1].date.month,responseData[index-1].date.day)
                        //console.log(yesterday.getFullYear(),yesterday.getMonth(),yesterday.getDate())
                        //console.log("<<<<<<<<<<>>>>>>>>>>")
                        currenCtonsecutive+=2;
                        //console.log("<<<<<<<<<<"+currenCtonsecutive+">>>>>>>>>>")
                        let threeDaysAhead = new Date(currentHolidayday);
                        threeDaysAhead.setDate(threeDaysAhead.getDate()+3);
                        if((typeof responseData[index+1] !=="undefined")&&!(nextHolidayday.getFullYear()==threeDaysAhead.getFullYear()&&nextHolidayday.getMonth()==threeDaysAhead.getMonth()&&nextHolidayday.getDate()==threeDaysAhead.getDate())){
                            if(biggestCtonsecutive<currenCtonsecutive)
                                biggestCtonsecutive=currenCtonsecutive;
                            currenCtonsecutive=0;
                        }
                    }else if((responseData[index].date.dayOfWeek==1)&&(index-1!=-1)&&
                    (!(responseData[index-1].date.year==yesterday.getFullYear()&&responseData[index-1].date.month==yesterday.getMonth()&&responseData[index-1].date.day==yesterday.getDate()))&&
                    (!(responseData[index-1].date.year==threeDaysBefore.getFullYear()&&responseData[index-1].date.month==threeDaysBefore.getMonth()&&responseData[index-1].date.day==threeDaysBefore.getDate()))){
                        //console.log("<<<<<<<<<<>>>>>>>>>>")
                        //console.log(responseData[index-1].date.year,responseData[index-1].date.month,responseData[index-1].date.day)
                        //console.log(yesterday.getFullYear(),yesterday.getMonth(),yesterday.getDate())
                        //console.log("<<<<<<<<<<>>>>>>>>>>")
                        if(yesterday.getMonth()-responseData[index-1].date.month>-12){
                        currenCtonsecutive+=2;
                        //console.log("<<<<<<<<<<"+currenCtonsecutive+">>>>>>>>>>")
                            if(biggestCtonsecutive<currenCtonsecutive)
                                biggestCtonsecutive=currenCtonsecutive;
                            currenCtonsecutive=0;
                        }
                    }
                    else if(responseData[index].date.dayOfWeek==6){
                        currenCtonsecutive++;
                        //console.log("its 6 day and no holiday after that: "+currenCtonsecutive)
                        if(biggestCtonsecutive<currenCtonsecutive)
                            biggestCtonsecutive=currenCtonsecutive;
                        currenCtonsecutive=0;
                    }
                    else{
                        if(biggestCtonsecutive<currenCtonsecutive)
                            biggestCtonsecutive=currenCtonsecutive;
                        currenCtonsecutive=0;
                    }
                }
                if(biggestCtonsecutive<=2)
                return 2;
                else
                return biggestCtonsecutive;
            }).catch(error => {
                console.error(error);
            });

        return new ConsecutiveFreeDays(mostFreeDayRepeated);
        
        /*while(date.getFullYear()==parseInt(year)){
            console.log(date.getFullYear()+"-"+date.getMonth()+"-"+date.getDate());
            //console.log(date.getFullYear());
            //console.log(parseInt(year));
            //fetch(`https://kayaposoft.com/enrico/json/v2.0/?action=getHolidaysForYear&year=${year}&country=${country}`)
            
            let isFree = await fetch(`https://kayaposoft.com/enrico/json/v2.0/?action=isWorkDay&date=${date.getDate()}-${date.getMonth()}-${year}&country=${country}`)
                .then((response) => response.json())
                .then((responseData) => responseData.isWorkDay)
                .then((workDay) =>{
                    //console.log(workDay)
                    console.log(workDay+" "+date.getFullYear()+"-"+date.getMonth()+"-"+date.getDate());
                    if(!workDay)
                    {
                        currenCtonsecutive++;
                    }else
                    {
                        if(biggestCtonsecutive<currenCtonsecutive)
                        {biggestCtonsecutive=currenCtonsecutive;}
                        currenCtonsecutive=0;
                    }
                    date.setDate(date.getDate()+1);
                    return date;
                    })
                .catch(error => {
                        console.error(error);
                });
                //alert(workDay);
            (async function () {   
                console.log(await isFree);
            })()
            
            //return isFree;
            //date=isFree;
        }
        //data
        return biggestCtonsecutive;*/
    }
}