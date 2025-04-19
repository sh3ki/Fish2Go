import React, { useState, useRef, useEffect } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";

// Update CustomCalendarContainer to conditionally render the Today button
const CustomCalendarContainer = ({ className, children, setToday, showTodayButton = true }) => {
  return (
    <div className={className}>
      {children}
      {showTodayButton && (
        <div className="text-center py-2 border-t border-gray-600 mt-1">
          <button
            type="button"
            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            onClick={setToday}
          >
            Today
          </button>
        </div>
      )}
    </div>
  );
};

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onChange: (startDate: Date, endDate: Date) => void;
  className?: string;
  buttonClassName?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  className = "",
  buttonClassName = "bg-gray-500 rounded-lg flex items-center justify-center h-8"
}) => {
  const [showDateModal, setShowDateModal] = useState(false);
  const [localStartDate, setLocalStartDate] = useState<Date>(startDate);
  const [localEndDate, setLocalEndDate] = useState<Date>(endDate);
  const dateButtonRef = useRef<HTMLButtonElement>(null);
  const dateModalRef = useRef<HTMLDivElement>(null);
  
  // Add states to track if calendars are open
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Add refs for the DatePicker components
  const startDatePickerRef = useRef<any>(null);
  const endDatePickerRef = useRef<any>(null);

  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Reset local dates when props change
  useEffect(() => {
    setLocalStartDate(startDate);
    setLocalEndDate(endDate);
  }, [startDate, endDate]);

  // Reset local dates when modal is closed without applying
  useEffect(() => {
    if (!showDateModal) {
      setLocalStartDate(startDate);
      setLocalEndDate(endDate);
      // Reset calendar open state when modal closes
      setIsCalendarOpen(false);
    }
  }, [showDateModal, startDate, endDate]);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dateModalRef.current && 
        !dateModalRef.current.contains(event.target as Node) &&
        dateButtonRef.current && 
        !dateButtonRef.current.contains(event.target as Node)
      ) {
        setShowDateModal(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDateModal = () => {
    setShowDateModal(prev => !prev);
    // If closing the modal, reset local dates to match props
    if (showDateModal) {
      setLocalStartDate(startDate);
      setLocalEndDate(endDate);
      // Reset calendar open state when manually closing modal
      setIsCalendarOpen(false);
    }
  };

  const handleStartDateChange = (date: Date) => {
    setLocalStartDate(date);
    // If end date is before new start date, update end date to match start date
    if (localEndDate < date) {
      setLocalEndDate(date);
    }
  };

  const handleEndDateChange = (date: Date) => {
    // Ensure end date is not before start date
    if (date >= localStartDate) {
      setLocalEndDate(date);
    }
  };

  const applyDateRange = () => {
    onChange(localStartDate, localEndDate);
    setShowDateModal(false);
  };

  const formatDateRange = () => {
    if (format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd')) {
      return format(startDate, 'MMM dd, yyyy');
    }
    return `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`;
  };

  // Simplified function to properly close the calendar and set dates
  const setToToday = (isStartDate = true) => {
    const today = new Date();
    
    if (isStartDate) {
      // Update the start date
      setLocalStartDate(today);
      
      // If end date is before today, update end date to today
      if (localEndDate < today) {
        setLocalEndDate(today);
      }
      
      // Close the calendar
      if (startDatePickerRef.current) {
        startDatePickerRef.current.setOpen(false);
      }
    } else {
      // For end date: simply set to today
      setLocalEndDate(today);
      
      // Close the calendar
      if (endDatePickerRef.current) {
        endDatePickerRef.current.setOpen(false);
      }
    }
    
    // Update the calendar open state in our component
    setIsCalendarOpen(false);
  };

  // Add a function to check if today is less than start date
  const isTodayLessThanStartDate = () => {
    const todayForComparison = new Date();
    todayForComparison.setHours(0, 0, 0, 0);
    
    const start = new Date(localStartDate);
    start.setHours(0, 0, 0, 0);
    
    return todayForComparison < start;
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        ref={dateButtonRef}
        className={`${buttonClassName} px-3`}
        style={{ padding: '0 0.75rem', minWidth: '120px' }}
        onClick={toggleDateModal}
      >
        <Calendar size={18}/>
        <span className="text-sm">{formatDateRange()}</span>
      </Button>
      
      {showDateModal && (
        <div 
          ref={dateModalRef}
          className="absolute right-0 p-3 w-48 rounded-md shadow-lg bg-gray-700 ring-1 ring-black ring-opacity-5 z-10"
        >
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-white mb-1">Start Date</label>
              <div className="relative">
                <Calendar 
                  className={`absolute z-10 left-2 top-1/2 transform -translate-y-1/2 text-gray-400`} 
                  size={16} 
                />
                <div 
                  className="relative cursor-pointer"
                  onClick={() => {
                    const input = document.getElementById('start-date-input');
                    if (input) input.click();
                  }}
                >
                  <DatePicker
                    id="start-date-picker"
                    ref={startDatePickerRef}  // Add ref here
                    selected={localStartDate}
                    onChange={handleStartDateChange}
                    className="w-full bg-gray-600 border border-gray-600 text-white pl-8 pr-3 py-2 rounded-md focus:outline-none focus:ring-0 focus:border-gray-600 text-sm"
                    dateFormat="MM - dd - yyyy"
                    calendarClassName="bg-gray-800 z-20 text-white"
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode="select"
                    yearDropdownItemNumber={10}
                    onChangeRaw={(event) => event.preventDefault()}
                    onFocus={(e) => e.target.blur()} 
                    onCalendarOpen={() => setIsCalendarOpen(true)}
                    onCalendarClose={() => setIsCalendarOpen(false)}
                    maxDate={today}
                    calendarContainer={({ className, children }) => (
                      <CustomCalendarContainer 
                        className={className} 
                        children={children} 
                        setToday={() => setToToday(true)}
                        showTodayButton={true} 
                      />
                    )}
                    customInput={
                      <input
                        id="start-date-input"
                        className="w-full bg-gray-600 border border-gray-600 text-white pl-8 pr-3 py-2 rounded-md focus:outline-none focus:ring-0 focus:border-gray-600 text-sm cursor-pointer caret-transparent"
                        autoComplete="off"
                        inputMode="none"
                        readOnly={true}
                        style={{ 
                          caretColor: 'transparent',
                          pointerEvents: 'none' 
                        }}
                      />
                    }
                  />
                  {/* Clickable overlay to prevent direct input interaction */}
                  <div 
                    className="absolute inset-0 cursor-pointer" 
                    onClick={() => {
                      const picker = document.getElementById('start-date-picker');
                      if (picker) {
                        const clickEvent = new MouseEvent('click', {
                          view: window,
                          bubbles: true,
                          cancelable: true,
                        });
                        picker.dispatchEvent(clickEvent);
                      }
                    }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-1">End Date</label>
              <div className="relative">
                <Calendar 
                  className={`absolute ${isCalendarOpen ? 'z-0' : 'z-10'} left-2 top-1/2 transform -translate-y-1/2 text-gray-400`} 
                  size={16} 
                />
                <div 
                  className="relative cursor-pointer"
                  onClick={() => {
                    const input = document.getElementById('end-date-input');
                    if (input) input.click();
                  }}
                >
                  <DatePicker
                    id="end-date-picker"
                    ref={endDatePickerRef}  // Add ref here
                    selected={localEndDate}
                    onChange={handleEndDateChange}
                    className="w-full bg-gray-600 border border-gray-600 text-white pl-8 pr-3 py-2 rounded-md focus:outline-none focus:ring-0 focus:border-gray-600 text-sm"
                    dateFormat="MM - dd - yyyy"
                    calendarClassName="bg-gray-800 z-20 text-white"
                    minDate={localStartDate}
                    maxDate={today}
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode="select"
                    yearDropdownItemNumber={10}
                    onChangeRaw={(event) => event.preventDefault()}
                    onFocus={(e) => e.target.blur()}
                    calendarContainer={({ className, children }) => (
                      <CustomCalendarContainer 
                        className={className} 
                        children={children} 
                        setToday={() => setToToday(false)}
                        showTodayButton={!isTodayLessThanStartDate()} 
                      />
                    )}
                    customInput={
                      <input
                        id="end-date-input"
                        className="w-full bg-gray-600 border border-gray-600 text-white pl-8 pr-3 py-2 rounded-md focus:outline-none focus:ring-0 focus:border-gray-600 text-sm cursor-pointer caret-transparent"
                        autoComplete="off"
                        inputMode="none"
                        readOnly={true}
                        style={{ 
                          caretColor: 'transparent',
                          pointerEvents: 'none' 
                        }}
                      />
                    }
                  />
                  {/* Clickable overlay to prevent direct input interaction */}
                  <div 
                    className="absolute inset-0 cursor-pointer" 
                    onClick={() => {
                      const picker = document.getElementById('end-date-picker');
                      if (picker) {
                        const clickEvent = new MouseEvent('click', {
                          view: window,
                          bubbles: true,
                          cancelable: true,
                        });
                        picker.dispatchEvent(clickEvent);
                      }
                    }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <Button 
                onClick={applyDateRange} 
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
