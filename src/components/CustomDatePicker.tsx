import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface CustomDatePickerProps {
  onSelect: (dateTime: string) => void;
  initialDate?: string;
}

export default function CustomDatePicker({ onSelect, initialDate }: CustomDatePickerProps) {
  const { t, isRTL } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date(initialDate || Date.now()));
  const [selectedDate, setSelectedDate] = useState(new Date(initialDate || Date.now()));
  const [selectedHour, setSelectedHour] = useState(new Date(initialDate || Date.now()).getHours());
  const [selectedMinute, setSelectedMinute] = useState(Math.floor(new Date(initialDate || Date.now()).getMinutes() / 5) * 5);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
  };

  const formatDateTime = (date: Date, hour: number, minute: number) => {
    const d = new Date(date);
    d.setHours(hour);
    d.setMinutes(minute);
    return `${d.toISOString().split('T')[0]} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-xl text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-[#3a4a2c]" />
          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(day => (
          <div key={day} className="h-10 flex items-center justify-center text-[12px] font-black uppercase tracking-widest text-zinc-400">
            {day}
          </div>
        ))}
        {Array.from({ length: firstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, i) => (
          <div key={`empty-${i}`} className="h-12" />
        ))}
        {Array.from({ length: daysInMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, i) => {
          const day = i + 1;
          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              className={`h-12 w-full rounded-2xl flex items-center justify-center text-sm font-bold transition-all ${
                isSelected(day)
                  ? 'bg-[#4d623b] text-white shadow-lg shadow-[#3a4a2c]/30 ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-zinc-900'
                  : isToday(day)
                    ? 'bg-[#3a4a2c]/5 text-[#3a4a2c] dark:bg-[#3a4a2c]/10'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
        <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Select Time</h4>
        <div className="flex gap-4">
          <div className="flex-1 space-y-2">
            <p className="text-[12px] font-bold text-zinc-500 uppercase text-center">Hour</p>
            <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800 p-1 rounded-2xl">
              <select 
                value={selectedHour}
                onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                className="w-full bg-transparent text-center font-bold text-zinc-900 dark:text-zinc-100 outline-none h-10 appearance-none cursor-pointer"
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={i} value={i} className="bg-white dark:bg-zinc-900">{i.toString().padStart(2, '0')}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="text-2xl font-black text-zinc-300 dark:text-zinc-700 flex items-center pt-5">:</div>
          <div className="flex-1 space-y-2">
            <p className="text-[12px] font-bold text-zinc-500 uppercase text-center">Minute</p>
            <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800 p-1 rounded-2xl">
              <select 
                value={selectedMinute}
                onChange={(e) => setSelectedMinute(parseInt(e.target.value))}
                className="w-full bg-transparent text-center font-bold text-zinc-900 dark:text-zinc-100 outline-none h-10 appearance-none cursor-pointer"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i * 5} value={i * 5} className="bg-white dark:bg-zinc-900">{(i * 5).toString().padStart(2, '0')}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <button
          onClick={() => onSelect(formatDateTime(selectedDate, selectedHour, selectedMinute))}
          className="w-full h-14 bg-[#4d623b] hover:bg-[#3a4a2c] text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-xl shadow-[#3a4a2c]/20"
        >
          <Check className="w-5 h-5" />
          {t('select_date') || 'Confirm Date & Time'}
        </button>
      </div>
    </div>
  );
}
