import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, X, Plus, ChevronDown, ChevronUp, Users, Settings as SettingsIcon, Home, FileText } from 'lucide-react';
import { ServiceType, Location, Prospect } from '../../types/calendar';
import { fetchLocations, LocationRow } from '../../lib/api';

interface SidebarProps {
  selectedServices: ServiceType[];
  onServiceChange: (services: ServiceType[]) => void;
  selectedStatuses: string[];
  onStatusChange: (statuses: string[]) => void;
  onLocationChange?: (locations: Location[]) => void;
  prospects?: Prospect[];
  onAddProspect?: () => void;
}

const SERVICE_TYPES: Record<ServiceType, string> = {
  'couch': 'Couch Cleaning',
  'carpet': 'Carpet Cleaning',
  'auto-detailing': 'Auto Detailing',
  'mattress': 'Mattress Cleaning'
};

const STATUS_TYPES = {
  'pending': 'Pending',
  'confirmed': 'Confirmed',
  'completed': 'Completed',
  'cancelled': 'Cancelled'
};

const STATUS_COLORS = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-green-500',
  completed: 'bg-blue-500',
  cancelled: 'bg-red-500',
};

export function Sidebar({ selectedServices, onServiceChange, selectedStatuses, onStatusChange, onLocationChange, prospects, onAddProspect }: SidebarProps) {
  const [selectedLocations, setSelectedLocations] = React.useState<Location[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLocationsOpen, setIsLocationsOpen] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(window.innerWidth >= 768);
  const [isServicesOpen, setIsServicesOpen] = React.useState(true);
  const [isStatusOpen, setIsStatusOpen] = React.useState(true);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [locations, setLocations] = React.useState<Location[]>([]);
  const location = useLocation();

  const serviceCounts = React.useMemo(() => {
    const counts: Record<ServiceType, number> = {
      'couch': 0,
      'carpet': 0,
      'auto-detailing': 0,
      'mattress': 0
    };

    if (!Array.isArray(prospects)) return counts;

    prospects.forEach(prospect => {
      if (!prospect?.services) return;
      
      prospect.services.forEach(service => {
        if (service?.type && service.type in counts) {
          counts[service.type]++;
        }
      });
    });

    return counts;
  }, [prospects]);

  React.useEffect(() => {
    onLocationChange?.(selectedLocations);
  }, [selectedLocations, onLocationChange]);

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsExpanded(true);
      }
    };

    fetchLocations().then((data: any) => {
      const locations = data.map((location: LocationRow) => location.name);
      setLocations(locations);
      setSelectedLocations(locations);
    });

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getServiceCount = (service: ServiceType) => {
    if (!prospects) return 0;
    return prospects.filter(prospect => {
      if (!prospect || !prospect.services || !Array.isArray(prospect.services)) return false;
      return prospect.services.some(s => s && s.type === service);
    }).length;
  };

  const getStatusCount = (status: string) => {
    if (!prospects) return 0;
    return prospects.filter(prospect => prospect && prospect.status === status).length;
  };

  const getLocationCount = (location: Location) => {
    if (!prospects) return 0;
    return prospects.filter(prospect => 
      prospect && prospect.location && prospect.location === location
    ).length;
  };

  const toggleService = (service: ServiceType) => {
    if (selectedServices.includes(service)) {
      onServiceChange(selectedServices.filter(s => s !== service));
    } else {
      onServiceChange([...selectedServices, service]);
    }
  };

  const toggleStatus = (status: string) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter(s => s !== status));
    } else {
      onStatusChange([...selectedStatuses, status]);
    }
  };

  const toggleLocation = (location: Location) => {
    setSelectedLocations(prev => 
      prev.includes(location)
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  const toggleAllLocations = () => {
    if (selectedLocations.length === locations.length) {
      setSelectedLocations([]);
    } else {
      setSelectedLocations([...locations]);
    }
  };

  const filteredLocations = locations.filter(location =>
    location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !searchInputRef.current?.contains(event.target as Node)
      ) {
        setIsLocationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Mobile Toggle Button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="md:hidden fixed bottom-4 left-4 z-30 p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors ring-1 ring-gray-200"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>
      )}

      {/* Mobile Backdrop */}
      {isExpanded && window.innerWidth < 768 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex-shrink-0 transform transition-transform duration-300 ease-in-out ${
          isExpanded ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isExpanded ? 'md:w-64' : 'md:w-16'}`}
      >
        <div className="h-full flex flex-col">
          {isExpanded ? (
            <>
              <div className="sticky top-0 z-20 p-4 border-b border-gray-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Link to="/" className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
                    Alpha Cleaning
                  </Link>
                </div>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {/* New Prospect Button */}
                <button
                  onClick={onAddProspect}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-6"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Prospect</span>
                </button>

                {/* Services Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-gray-900">Services</h2>
                    <button
                      onClick={() => setIsServicesOpen(!isServicesOpen)}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {isServicesOpen ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                  {isServicesOpen && (
                    <div className="space-y-2">
                      {Object.entries(SERVICE_TYPES).map(([value, label]) => (
                        <label key={value} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={selectedServices.includes(value as ServiceType)}
                            onChange={() => toggleService(value as ServiceType)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1">
                            {label}
                          </span>
                          <span className="text-xs text-gray-500 tabular-nums">
                            [{getServiceCount(value as ServiceType)}]
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-gray-900">Status</h2>
                    <button
                      onClick={() => setIsStatusOpen(!isStatusOpen)}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {isStatusOpen ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                  {isStatusOpen && (
                    <div className="space-y-2">
                      {Object.entries(STATUS_TYPES).map(([value, label]) => (
                        <label key={value} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={selectedStatuses.includes(value)}
                            onChange={() => toggleStatus(value)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex items-center gap-2 flex-1">
                            <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[value as keyof typeof STATUS_COLORS]}`} />
                            <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
                          </div>
                          <span className="text-xs text-gray-500 tabular-nums">
                            [{getStatusCount(value)}]
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Locations Section */}
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 mb-3">Locations</h2>
                  <div className="relative">
                    <div className="relative">
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search locations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsLocationsOpen(true)}
                        className="w-full px-3 py-2 pl-9 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      <div className="absolute right-3 top-2.5 text-xs text-gray-500">
                        {selectedLocations.length}/{locations.length}
                      </div>
                    </div>

                    {isLocationsOpen && (
                      <div
                        ref={dropdownRef}
                        className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto"
                      >
                        <div className="sticky top-0 bg-white border-b border-gray-100 p-2">
                          <button
                            onClick={toggleAllLocations}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            {selectedLocations.length === locations.length ? 'Unselect all' : 'Select all'}
                          </button>
                        </div>
                        {filteredLocations.length === 0 ? (
                          <div className="p-2 text-sm text-gray-500 text-center">
                            No locations found
                          </div>
                        ) : (
                          filteredLocations.map(location => (
                            <label
                              key={location}
                              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedLocations.includes(location)}
                                onChange={() => toggleLocation(location)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700 flex-1">{location}</span>
                              <span className="text-xs text-gray-500 tabular-nums">
                                [{getLocationCount(location)}]
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Navigation Links */}
                  <div className="mt-6 space-y-2">
                    <Link
                      to="/prospects"
                      className="flex items-center gap-2 p-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">Prospects</span>
                    </Link>
                    <Link
                      to="/team"
                      className="flex items-center gap-2 p-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Team</span>
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-2 p-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <SettingsIcon className="w-4 h-4" />
                      <span className="text-sm">Settings</span>
                    </Link>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Collapsed Sidebar Content */
            <div className="flex flex-col items-center py-4 space-y-6">
              {/* Collapsed Header/Toggle Button */}
              <button
                onClick={() => setIsExpanded(true)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* New Prospect Button */}
              <button
                onClick={onAddProspect}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="New Prospect"
              >
                <Plus className="w-5 h-5" />
              </button>

              {/* Navigation Icons */}
              <div className="flex flex-col items-center space-y-4">
                <Link
                  to="/"
                  className={`p-2 rounded-lg transition-colors ${
                    location.pathname === '/' 
                      ? 'bg-gray-100 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                  title="Home"
                >
                  <Home className="w-5 h-5" />
                </Link>

                <Link
                  to="/prospects"
                  className={`p-2 rounded-lg transition-colors ${
                    location.pathname === '/prospects' 
                      ? 'bg-gray-100 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                  title="Prospects"
                >
                  <FileText className="w-5 h-5" />
                </Link>
                
                <Link
                  to="/team"
                  className={`p-2 rounded-lg transition-colors ${
                    location.pathname === '/team' 
                      ? 'bg-gray-100 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                  title="Team"
                >
                  <Users className="w-5 h-5" />
                </Link>
                
                <Link
                  to="/settings"
                  className={`p-2 rounded-lg transition-colors ${
                    location.pathname === '/settings' 
                      ? 'bg-gray-100 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                  title="Settings"
                >
                  <SettingsIcon className="w-5 h-5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}