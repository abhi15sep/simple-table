import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Link } from "react-router-dom";
import { toast } from 'react-toastify';

import {
  addPeriod,
  removePeriod,
  clearPeriods,
  flipTimeTable,
  setEditingSubject
} from '../redux/actions';
import { getSubjectById, getSubjectNamesAndIds, sortSubjectsByName } from '../utils/redux';
import {
  StateSubjectDataInterface,
  StatePeriodsDataInterface,
  StoreStateInterface,
  StateSettingsType
} from '../types/store';
import { PeriodsCellInterface, ClearPeriodsType, FlipTimetableType } from '../types/reducers';
import { Table, Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import '../css/timeTable.css';
import PLUS_GREEN from "../images/plus_green.svg";
import { addTableCell, wrapRowsInTr, createTable } from '../utils/timeTable';
import { EditingSubActionType } from '../types/actions';

interface TimeTableProps {
  periods: StatePeriodsDataInterface,
  subjects: StateSubjectDataInterface[],
  settings: StateSettingsType,
  addPeriod: typeof addPeriod,
  removePeriod: typeof removePeriod,
  clearPeriods: ClearPeriodsType,
  flipTimeTable: FlipTimetableType,
  setEditingSubject: (sub_id: string) => EditingSubActionType,
}

interface TimeTableCellProps {
  day_index: number,
  period_no: number,
  period_info: PeriodsCellInterface,
  subjects: StateSubjectDataInterface[],
  handleTableCellClick: any
}

interface SubPromptStateInterface {
  isOpen: boolean,
  is_filled: boolean,
  currentCell: Array<number>,
  sub_id: string
}

interface TableCellClickPromptProps {
  addSubPromptState: SubPromptStateInterface,
  toggleAddSubjectPrompt:any,
  subjects: StateSubjectDataInterface[],
  addPeriod: typeof addPeriod,
  removePeriod: typeof removePeriod,
  setEditingSubject: (sub_id: string) => EditingSubActionType,
  handleOptionChange: (event: React.ChangeEvent<HTMLSelectElement>) => void,
}

const week_days = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat"
];

const max_periods = 9;

const NoSubjectsFound = ({ addSubPromptState, toggleAddSubjectPrompt }: any) => {
  return (
    <Modal
      isOpen={addSubPromptState.isOpen}
      toggle={toggleAddSubjectPrompt}
    >
      <ModalHeader toggle={toggleAddSubjectPrompt}>
        No Subjects found
      </ModalHeader>
      <ModalBody>
        You need to add some subjects before entering them into the table.
      </ModalBody>
      <ModalFooter>
        <Button color="primary" tag={Link} to="/manageSubjects">
          Add Subjects
        </Button>
        <Button color="secondary" onClick={toggleAddSubjectPrompt}>Later</Button>
      </ModalFooter>
    </Modal>
  );
};

const TableCellClickPrompt = ({
  addSubPromptState,
  toggleAddSubjectPrompt,
  subjects,
  addPeriod,
  removePeriod,
  setEditingSubject,
  handleOptionChange,
  }: TableCellClickPromptProps) => {
  /* Set initial state as the id or -1 if no subjects available
     useState must come before all conditional returns */
  let selectedSubjectID = addSubPromptState.sub_id || (subjects[0] ? subjects[0]["id"] : '');

  /* Prompt to add subjects if none available */
  if (!selectedSubjectID) {
    return (
      <NoSubjectsFound
      addSubPromptState={addSubPromptState}
      toggleAddSubjectPrompt={toggleAddSubjectPrompt}
      />
    );
  }

  /* Callbacks */
  const handleSubmit = () => {
    addPeriod(selectedSubjectID, {
      day: addSubPromptState.currentCell[0],
      periodNo: addSubPromptState.currentCell[1]
    });
    toggleAddSubjectPrompt();
  }

  /* Make subject options list */
  const subject_options: Array<JSX.Element> = [];
  const id_and_sub_name = getSubjectNamesAndIds(subjects);

  for (let [id, sub_name] of id_and_sub_name) {
    const ele = <option value={id} key={id}>{sub_name}</option>;
    /* Put the already selected subject on top of the list */
    subject_options.push(ele);
  }

  /* Show clear and edit buttons too if cell already filled */
  let clearButton: any;
  let editCurrentSubButton: any;
  const clearCell = () => {
    removePeriod({
      day: addSubPromptState.currentCell[0],
      periodNo: addSubPromptState.currentCell[1]
    });
    toggleAddSubjectPrompt();
  };
  const handleEditCurrentSubClick = (event: React.MouseEvent<HTMLElement>) => {
    setEditingSubject(selectedSubjectID);
  }
  if (addSubPromptState.is_filled === true) {
    clearButton = <Button color="danger" onClick={clearCell}>Clear</Button>;
    editCurrentSubButton = <Button
      color="info"
      tag={Link}
      to="/manageSubjects"
      onClick={handleEditCurrentSubClick}
      >
        Edit
      </Button>;
  }

  return (
    <Modal
      isOpen={addSubPromptState.isOpen}
      toggle={toggleAddSubjectPrompt}
    >
      <ModalHeader
        toggle={toggleAddSubjectPrompt}
      >Manage period</ModalHeader>
      <ModalBody>
        <label>
          Select subject:
          <select
            value={selectedSubjectID}
            onChange={handleOptionChange}
          >
            {subject_options}
          </select>
        </label>
      </ModalBody>
      <ModalFooter>
        {clearButton}
        {editCurrentSubButton}
        <Button color="primary" onClick={handleSubmit}>Set subject</Button>
        <Button color="secondary" onClick={toggleAddSubjectPrompt}>Cancel</Button>
      </ModalFooter>
    </Modal>
  );
}

const TimeTableCell = ({ day_index, period_no, period_info, subjects, handleTableCellClick }: TimeTableCellProps) => {
  let subject_name = '';
  let is_filled = false;
  const placeholder = <img alt="Add subject" src={PLUS_GREEN} width="18" />;
  let sub_id = '';

  if (period_info && period_info.sub_id) {
    sub_id = period_info.sub_id;
    const subject_info = getSubjectById(subjects, sub_id);
    if (subject_info) {
      subject_name = subject_info['short_name'];
      is_filled = true;
    }
  }

  return (
    <td
      className="periodCell"
      onClick={() => handleTableCellClick(day_index, period_no, sub_id, is_filled)}
    >{subject_name ? subject_name : placeholder}</td>
  );
}

const ClearTableButton = ({clearPeriods}: {clearPeriods: ClearPeriodsType}) => {
  const [isPromptOpen, setPromptOpen] = useState(false);
  const togglePrompt = () => { setPromptOpen(!isPromptOpen); };
  const confirmClearPeriods = (event: React.MouseEvent<HTMLElement>) => {
    clearPeriods();
    togglePrompt();
    toast.success("Cleared table data");
  }

  return (
    <div>
      <Button onClick={togglePrompt} color="danger" className="float-right">
        Clear Table
      </Button>
      <Modal
        isOpen={isPromptOpen}
        toggle={togglePrompt}
      >
        <ModalHeader toggle={togglePrompt}>
          Confirm action
        </ModalHeader>
        <ModalBody>
          Proceed with clearing table? This action <b>CANNOT</b> be reversed.
        </ModalBody>
        <ModalFooter>
          <Button type="submit" color="danger" onClick={confirmClearPeriods}>
            Yes, clear
          </Button>
          <Button onClick={togglePrompt} color="secondary">
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

const FlipTablebutton = ({flipTimeTable}: {flipTimeTable: FlipTimetableType}) => {
  return (
    <Button
      className="mr-2"
      onClick={flipTimeTable}
    >
      Flip Table
    </Button>
  );
}

const TimeTable = ({
  periods,
  subjects,
  settings,
  addPeriod,
  removePeriod,
  clearPeriods,
  flipTimeTable,
  setEditingSubject,
  }: TimeTableProps) => {
  let schedule: Array<Array<any>>;
  let [addSubPromptState, setAddSubPromptState] = useState({
    isOpen: false,
    is_filled: false,
    currentCell: [1, 1],
    sub_id: ''
  });
  const handleTableCellClick = (day_index: number, period_no: number, sub_id: string, is_filled: boolean) => {
    setAddSubPromptState({
      isOpen: true,
      is_filled,
      currentCell: [day_index, period_no],
      sub_id
    });
  }
  const toggleAddSubjectPrompt = () => {
    setAddSubPromptState({
      ...addSubPromptState,
      isOpen: (!addSubPromptState.isOpen),
    });
  }
  const handleAddSubOptionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setAddSubPromptState({
      ...addSubPromptState,
      sub_id: event.target.value
    });
  }

  /* Table orientation. Horizontal table by default */
  let flipped = settings.timetable_flipped;
  /* Flip table by default on smaller screens */
  if (window.innerWidth < 580) {
    flipped = !flipped;
  }
  /* Create 2D matrix to store data based on orientation */
  if (flipped) {
    /* 1 extra row for headers */
    schedule = createTable(max_periods + 1, 7);
  } else {
    /* 6 rows for weekdays + 1 row for headers */
    schedule = createTable(7, max_periods + 1);
  }

  /* Create table headers */
  const table_header = [<th key="th0">#</th>];
  addTableCell({
    table: schedule,
    x: 0,
    y: 0,
    data: table_header,
    flipped
  });
  for (let i = 1; i <= max_periods; i++) {
    addTableCell({
      table: schedule,
      x: 0,
      y: i,
      data: <td
        key={"th"+i}
        className={flipped ? "rowHeader" : ''}>
          {i}
      </td>,
      flipped
    });
  }

  for (let day_index_str in week_days) {
    let day_index = parseInt(day_index_str);
    const day = week_days[day_index];
    /* Add row header */
    let day_header = day;
    /* Use only first letter if screen size is smaller than 550px */
    if (window.innerWidth < 550) {
      day_header = day[0];
    }
    const day_header_th = <th
        scope="row"
        className={flipped? '' : "rowHeader"}
        key={day + day_index_str}
      >
        {day_header}
      </th>;
    addTableCell({
      table: schedule,
      x: day_index + 1,
      y: 0,
      data: day_header_th,
      flipped
    });
    /* Fill table with data */
    for (let i = 0; i < max_periods; i++) {
      /* Check if period info filled by user */
      const period_info = periods[day_index][i];

      const subject_cell = (
        <TimeTableCell
          day_index={day_index}
          period_no={i}
          period_info={period_info}
          subjects={subjects}
          key={i.toString() + day_index_str + day}
          handleTableCellClick={handleTableCellClick}
        />
      );
      addTableCell({
        table: schedule,
        x: day_index + 1,
        y: i + 1,
        data: subject_cell,
        flipped
      });
    }
  }

  /* Wrap table rows inside tr */
  wrapRowsInTr(schedule);

  /* Show easy navigation button for mobile users */
  let editSubjectsButton: any;
  if (window.innerWidth < 770) {
    editSubjectsButton = <Button tag={Link} to="/manageSubjects" className="mr-2 mr-sm-auto">
      Edit Subjects
    </Button>
  }

  return (
    <div>
    <TableCellClickPrompt
      addSubPromptState={addSubPromptState}
      toggleAddSubjectPrompt={toggleAddSubjectPrompt}
      subjects={subjects}
      addPeriod={addPeriod}
      removePeriod={removePeriod}
      setEditingSubject={setEditingSubject}
      handleOptionChange={handleAddSubOptionChange}
    />

    <div className="d-flex justify-content-end mb-3">
      {editSubjectsButton}
      <FlipTablebutton flipTimeTable={flipTimeTable} />
      <ClearTableButton clearPeriods={clearPeriods} />
    </div>

    <Table bordered striped responsive className="text-center">
      <thead>{schedule[0]}</thead>
      <tbody>
        {schedule.slice(1)}
      </tbody>
    </Table>
    </div>
  );
};

const mapStateToProps = (state: StoreStateInterface) => {
  const { periods, subjects, settings } = state;
  return {
    periods,
    subjects: sortSubjectsByName(subjects),
    settings
  };
}

const mapDispatchToProps = {
  addPeriod,
  removePeriod,
  clearPeriods,
  flipTimeTable,
  setEditingSubject,
};

export default connect(mapStateToProps, mapDispatchToProps)(TimeTable);