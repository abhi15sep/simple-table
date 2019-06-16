import { PeriodsCellInterface } from './reducers';

export interface StateSubjectDataInterface {
  id: number;
  name: string;
  short_name: string;
  teacher_name: string;
}

export type StatePeriodsDataInterface = PeriodsCellInterface[][];

export interface StoreStateInterface {
  subjects: StateSubjectDataInterface[],
  periods: StatePeriodsDataInterface
}