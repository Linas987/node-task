import { HolidaysController } from './holidays.controller';
import { Test } from '@nestjs/testing';
import { HolidaysService } from './holiday.service';
import { Country, DayType } from './holidays.model';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Countries } from './countries.entity';

describe('holidaysController', () => {
  let Controller: HolidaysController;
  let Service: HolidaysService;

  const mockService = {
    getAllCountries: jest.fn(() => {
      return [];
    }),
    getMonthHolidays: jest.fn().mockImplementation((dto) => dto),
    getDayStatus: jest
      .fn()
      .mockImplementation((DayType) =>
        Promise.resolve({ type: String, ...DayType }),
      ),
  };

  const mockUsersRepo = {};

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HolidaysController],
      providers: [
        HolidaysService,
        {
          provide: getRepositoryToken(Countries),
          useValue: mockUsersRepo,
        },
      ],
    })
      .overrideProvider(HolidaysService)
      .useValue(mockService)
      .compile();

    Service = moduleRef.get<HolidaysService>(HolidaysService);
    Controller = moduleRef.get<HolidaysController>(HolidaysController);
  });
  describe('getAllCountries', () => {
    it('should return an array of countries', async () => {
      const result: Country[] = [];

      expect(Controller.getAllCountries()).toEqual(result);
    });
    it('service should be defined', () => {
      expect(Service).toBeDefined();
    });
  });
});
