import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  CalendarDays,
} from 'lucide-react';

export interface DualDateInputProps {
  value: string; // Stored canonical date (YYYY-MM-DD or DD-MM-YYYY)
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  helperText?: string;
  className?: string;
  id?: string;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * Intelligent date parser supporting:
 * - DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY
 * - YYYY-MM-DD, YYYY/MM/DD
 * - D-M-YYYY, D/M/YYYY
 */
export function parseDateString(str?: string | null): {
  year: number;
  month: number; // 1-12
  day: number;
  iso: string; // YYYY-MM-DD
  display: string; // DD-MM-YYYY
  readable: string; // 15 Jan 2024
} | null {
  if (!str) return null;
  const trimmed = str.trim();
  if (!trimmed) return null;

  let y = 0;
  let m = 0;
  let d = 0;

  // Format 1: YYYY-MM-DD or YYYY/MM/DD
  const ymd = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymd) {
    y = parseInt(ymd[1], 10);
    m = parseInt(ymd[2], 10);
    d = parseInt(ymd[3], 10);
  } else {
    // Format 2: DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY
    const dmy = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (dmy) {
      d = parseInt(dmy[1], 10);
      m = parseInt(dmy[2], 10);
      y = parseInt(dmy[3], 10);
    }
  }

  if (!y || !m || !d) return null;
  if (y < 1920 || y > 2100) return null;
  if (m < 1 || m > 12) return null;

  const daysInMonth = new Date(y, m, 0).getDate();
  if (d < 1 || d > daysInMonth) return null;

  const pad = (n: number) => String(n).padStart(2, '0');
  const iso = `${y}-${pad(m)}-${pad(d)}`;
  const display = `${pad(d)}-${pad(m)}-${y}`;
  const monthAbbr = MONTH_NAMES[m - 1].substring(0, 3);
  const readable = `${pad(d)} ${monthAbbr} ${y}`;

  return { year: y, month: m, day: d, iso, display, readable };
}

export const DualDateInput: React.FC<DualDateInputProps> = ({
  value,
  onChange,
  label,
  placeholder = 'DD-MM-YYYY or pick calendar',
  required = false,
  disabled = false,
  helperText,
  className = '',
  id,
}) => {
  // Parse initial incoming value
  const initialParsed = parseDateString(value);

  // Manual text entry state
  const [inputText, setInputText] = useState<string>(
    initialParsed ? initialParsed.display : value || ''
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [inputError, setInputError] = useState<string | null>(null);

  // Calendar navigation state (year & month)
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentDay = today.getDate();

  const [calYear, setCalYear] = useState<number>(
    initialParsed ? initialParsed.year : currentYear
  );
  const [calMonth, setCalMonth] = useState<number>(
    initialParsed ? initialParsed.month : currentMonth
  );

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state if external value changes
  useEffect(() => {
    const parsed = parseDateString(value);
    if (parsed) {
      setInputText(parsed.display);
      setCalYear(parsed.year);
      setCalMonth(parsed.month);
      setInputError(null);
    } else if (!value) {
      setInputText('');
      setInputError(null);
    }
  }, [value]);

  // Close calendar popup on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    };

    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isCalendarOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCalendarOpen) {
        setIsCalendarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCalendarOpen]);

  // Handle direct manual text change
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputText(raw);

    if (!raw.trim()) {
      setInputError(null);
      onChange('');
      return;
    }

    const parsed = parseDateString(raw);
    if (parsed) {
      setInputError(null);
      setCalYear(parsed.year);
      setCalMonth(parsed.month);
      // Canonical format YYYY-MM-DD
      onChange(parsed.iso);
    } else {
      // Partial typing is permitted, but flag error if standard length exceeded
      if (raw.length >= 8) {
        setInputError('Format: DD-MM-YYYY (e.g. 15-08-2024)');
      } else {
        setInputError(null);
      }
    }
  };

  // On blur, normalize text display if valid
  const handleBlur = () => {
    if (!inputText.trim()) {
      setInputError(null);
      return;
    }
    const parsed = parseDateString(inputText);
    if (parsed) {
      setInputText(parsed.display);
      setInputError(null);
      onChange(parsed.iso);
    } else {
      setInputError('Invalid date. Use DD-MM-YYYY (e.g. 15-08-2024)');
    }
  };

  // Select date from calendar grid
  const handleSelectDay = (year: number, month: number, day: number) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const iso = `${year}-${pad(month)}-${pad(day)}`;
    const display = `${pad(day)}-${pad(month)}-${year}`;

    setInputText(display);
    setInputError(null);
    setCalYear(year);
    setCalMonth(month);
    onChange(iso);
    setIsCalendarOpen(false);
  };

  // Shortcut: Pick Today
  const handleSetToday = () => {
    handleSelectDay(currentYear, currentMonth, currentDay);
  };

  // Month navigation
  const handlePrevMonth = () => {
    if (calMonth === 1) {
      setCalMonth(12);
      setCalYear(prev => prev - 1);
    } else {
      setCalMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 12) {
      setCalMonth(1);
      setCalYear(prev => prev + 1);
    } else {
      setCalMonth(prev => prev + 1);
    }
  };

  // Current parsed representation
  const parsedCurrent = parseDateString(value || inputText);

  // Generate calendar grid
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const firstDayIndex = new Date(calYear, calMonth - 1, 1).getDay(); // 0 = Sunday

  const prevMonthDaysCount = new Date(
    calMonth === 1 ? calYear - 1 : calYear,
    calMonth === 1 ? 12 : calMonth - 1,
    0
  ).getDate();

  // Year options for dropdown: from 1980 to currentYear + 10
  const yearOptions: number[] = [];
  for (let y = currentYear + 10; y >= 1980; y--) {
    yearOptions.push(y);
  }

  return (
    <div ref={containerRef} className={`relative space-y-1 ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label
            htmlFor={id}
            className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
          >
            <span>{label}</span>
            {required && <span className="text-red-500">*</span>}
          </label>
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <span className="hidden sm:inline">Type or Pick</span>
          </div>
        </div>
      )}

      {/* Main Input Bar */}
      <div className="relative flex items-center">
        {/* Left Calendar Toggle Icon Button */}
        <button
          type="button"
          onClick={() => setIsCalendarOpen(prev => !prev)}
          disabled={disabled}
          title="Toggle Calendar Picker"
          className={`absolute left-2.5 p-1 rounded-md transition-colors ${
            isCalendarOpen
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
        </button>

        {/* Text Input for Manual Date Entry */}
        <input
          id={id}
          type="text"
          value={inputText}
          onChange={handleTextChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full pl-9 pr-24 py-2 bg-slate-50 dark:bg-[#090d16] border ${
            inputError
              ? 'border-red-400 dark:border-red-500/50 focus:border-red-500'
              : 'border-slate-200 dark:border-[#1e293b] focus:border-blue-500'
          } text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-blue-500/20 transition-colors disabled:opacity-50`}
        />

        {/* Right Action Icons Toolbar */}
        <div className="absolute right-1.5 flex items-center gap-1">
          {/* Quick "Today" Button */}
          <button
            type="button"
            onClick={handleSetToday}
            disabled={disabled}
            title="Set to Today"
            className="px-1.5 py-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors"
          >
            Today
          </button>

          {/* Calendar Picker Trigger */}
          <button
            type="button"
            onClick={() => setIsCalendarOpen(prev => !prev)}
            disabled={disabled}
            title="Open Interactive Calendar"
            className={`p-1 rounded-md transition-colors ${
              isCalendarOpen
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Helper text & parsed confirmation badge */}
      <div className="flex items-center justify-between px-0.5 text-[10px]">
        {inputError ? (
          <span className="text-red-500 dark:text-red-400 font-medium">
            {inputError}
          </span>
        ) : parsedCurrent ? (
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <Check className="w-3 h-3" />
            <span>Selected: {parsedCurrent.readable} ({parsedCurrent.display})</span>
          </span>
        ) : (
          <span className="text-slate-400">
            {helperText || 'Manual entry: DD-MM-YYYY (or click calendar)'}
          </span>
        )}
      </div>

      {/* Interactive Calendar Dropdown Popup */}
      {isCalendarOpen && (
        <div className="absolute z-60 left-0 top-full mt-1.5 w-72 sm:w-76 p-3 rounded-xl bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 shadow-2xl animate-fade-in text-xs">
          {/* Header with Month / Year Navigation */}
          <div className="flex items-center justify-between gap-1 pb-2.5 border-b border-slate-100 dark:border-slate-800">
            {/* Prev Month */}
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Month & Year Selectors */}
            <div className="flex items-center gap-1">
              {/* Month Select */}
              <select
                value={calMonth}
                onChange={e => setCalMonth(parseInt(e.target.value, 10))}
                className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>

              {/* Year Select */}
              <select
                value={calYear}
                onChange={e => setCalYear(parseInt(e.target.value, 10))}
                className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden"
              >
                {yearOptions.map(y => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Next Month */}
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center py-2 border-b border-slate-100 dark:border-slate-800/60">
            {WEEKDAY_NAMES.map(w => (
              <span
                key={w}
                className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
              >
                {w}
              </span>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1 pt-2">
            {/* Previous month trailing days */}
            {Array.from({ length: firstDayIndex }).map((_, i) => {
              const d = prevMonthDaysCount - firstDayIndex + i + 1;
              const pm = calMonth === 1 ? 12 : calMonth - 1;
              const py = calMonth === 1 ? calYear - 1 : calYear;
              return (
                <button
                  key={`prev-${i}`}
                  type="button"
                  onClick={() => handleSelectDay(py, pm, d)}
                  className="h-7 w-full flex items-center justify-center rounded text-[11px] text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                >
                  {d}
                </button>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const isSelected =
                parsedCurrent &&
                parsedCurrent.year === calYear &&
                parsedCurrent.month === calMonth &&
                parsedCurrent.day === d;
              const isToday =
                calYear === currentYear &&
                calMonth === currentMonth &&
                d === currentDay;

              return (
                <button
                  key={`cur-${d}`}
                  type="button"
                  onClick={() => handleSelectDay(calYear, calMonth, d)}
                  className={`h-7 w-full flex items-center justify-center rounded text-[11px] font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : isToday
                      ? 'text-blue-600 dark:text-blue-400 font-bold ring-1 ring-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {d}
                </button>
              );
            })}

            {/* Next month leading days */}
            {Array.from({
              length: (7 - ((firstDayIndex + daysInMonth) % 7)) % 7,
            }).map((_, i) => {
              const d = i + 1;
              const nm = calMonth === 12 ? 1 : calMonth + 1;
              const ny = calMonth === 12 ? calYear + 1 : calYear;
              return (
                <button
                  key={`next-${i}`}
                  type="button"
                  onClick={() => handleSelectDay(ny, nm, d)}
                  className="h-7 w-full flex items-center justify-center rounded text-[11px] text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Calendar Footer Bar */}
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={handleSetToday}
              className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Sparkles className="w-3 h-3" />
              <span>Today ({currentDay} {MONTH_NAMES[currentMonth - 1].substring(0, 3)})</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCalendarOpen(false)}
              className="px-2 py-0.5 rounded text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
