import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Bell, Users, User } from 'lucide-react';
import { format } from 'date-fns';
import { ViewMode } from '../../types/calendar';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: ViewMode;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onToggleProspects: () => void;
  onOpenReminders: () => void;
  remindersCount: number;
  prospectsCount: number;
}

export function CalendarHeader({
  currentDate,
  viewMode,
  onPrevious,
  onNext,
  onToday,
  onViewModeChange,
  onToggleProspects,
  onOpenReminders,
  remindersCount,
  prospectsCount,
}: CalendarHeaderProps) {
  const [showViewSelector, setShowViewSelector] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4 bg-white border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={onPrevious}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={onToday}
            className="px-2 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <span className="hidden md:inline">Today</span>
            <span className="md:hidden">T</span>
          </button>
          <button
            onClick={onNext}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <h1 className="text-base md:text-lg font-bold text-gray-900 ml-2">
            <span className="md:hidden">{format(currentDate, 'MMMM')}</span>
            <span className="hidden md:inline">{format(currentDate, 'MMMM yyyy')}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile View Selector */}
          <div className="relative md:hidden">
            <button
              onClick={() => setShowViewSelector(!showViewSelector)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Change view"
            >
              <CalendarIcon className="w-5 h-5" />
            </button>
            {showViewSelector && (
              <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                {['week', 'month', 'agenda'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      onViewModeChange(mode as ViewMode);
                      setShowViewSelector(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm ${
                      viewMode === mode
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)} view
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop View Selector */}
          <div className="hidden md:inline-flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => onViewModeChange('week')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white hover:bg-gray-50 text-gray-700'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => onViewModeChange('month')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors border-l border-r border-gray-300 ${
                viewMode === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white hover:bg-gray-50 text-gray-700'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => onViewModeChange('agenda')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'agenda'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white hover:bg-gray-50 text-gray-700'
              }`}
            >
              Agenda
            </button>
          </div>

          <button
            onClick={onToggleProspects}
            className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="View Prospects"
          >
            <Users className="w-5 h-5" />
            {prospectsCount > 0 && (
              <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {prospectsCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenReminders}
            className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {remindersCount > 0 && (
              <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {remindersCount}
              </span>
            )}
          </button>

          {/* User Avatar and Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  Profile
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  Help
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}