import React from 'react';
import { ServiceType, ServiceDetails } from '../../types/calendar';
import { ServiceDetailsPopover } from './ServiceDetailsPopover';

interface ServiceTypeSelectorProps {
  selectedServices: ServiceType[];
  serviceDetails: ServiceDetails;
  onToggleService: (type: ServiceType) => void;
  onUpdateDetails: (type: ServiceType, details: ServiceDetails) => void;
  readOnly?: boolean;
  detailsOptional?: boolean;
}

const SERVICE_TYPES: Record<ServiceType, string> = {
  'couch': 'Couch Cleaning',
  'carpet': 'Carpet Cleaning',
  'car-seats': 'Car Seats Cleaning',
  'mattress': 'Mattress Cleaning'
};

const getServiceSummary = (type: ServiceType, details: ServiceDetails): string => {
  switch (type) {
    case 'couch':
      return details.couch 
        ? `${details.couch.type}, ${details.couch.seats} seats`
        : '';
    case 'carpet':
      return details.carpet
        ? `${details.carpet.size} size${details.carpet.quantity > 1 ? `, ${details.carpet.quantity} items` : ''}`
        : '';
    case 'car-seats':
      return details['car-seats']
        ? `${details['car-seats'].seats} seats`
        : '';
    case 'mattress':
      return details.mattress
        ? `${details.mattress.size} size${details.mattress.quantity > 1 ? `, ${details.mattress.quantity} items` : ''}`
        : '';
    default:
      return '';
  }
};

export function ServiceTypeSelector({ 
  selectedServices, 
  serviceDetails,
  onToggleService, 
  onUpdateDetails,
  readOnly = false,
  detailsOptional = false
}: ServiceTypeSelectorProps) {
  const [activePopover, setActivePopover] = React.useState<ServiceType | null>(null);
  const buttonRefs = React.useRef<Record<ServiceType, HTMLButtonElement | null>>({
    'couch': null,
    'carpet': null,
    'car-seats': null,
    'mattress': null
  });

  const filteredServices = readOnly 
    ? selectedServices 
    : Object.keys(SERVICE_TYPES) as ServiceType[];

  const handleServiceClick = (type: ServiceType) => {
    if (readOnly) return;
    
    if (!selectedServices.includes(type)) {
      onToggleService(type);
      if (!detailsOptional) {
        setActivePopover(type);
      }
    } else {
      setActivePopover(type);
    }
  };

  const handleDetailsSubmit = (type: ServiceType, details: ServiceDetails) => {
    onUpdateDetails(type, details);
    setActivePopover(null);
  };

  const handlePopoverClose = (type: ServiceType) => {
    if (!detailsOptional && !serviceDetails[type]) {
      onToggleService(type); // Deselect if details are required but not provided
    }
    setActivePopover(null);
  };

  const handleClearService = (type: ServiceType) => {
    onToggleService(type);
    setActivePopover(null);
  };

  return (
    <div className="grid grid-cols-2 gap-2 w-full">
      {filteredServices.map((value) => (
        <div key={value} className="relative">
          <button
            ref={el => buttonRefs.current[value] = el}
            type="button"
            onClick={() => handleServiceClick(value)}
            className={`w-full p-2 sm:p-2.5 text-sm rounded-lg border transition-colors ${
              selectedServices.includes(value)
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            disabled={readOnly}
          >
            <span className="block font-medium">{SERVICE_TYPES[value]}</span>
            {selectedServices.includes(value) && serviceDetails[value] && (
              <span className="block text-xs mt-1 text-gray-600">
                {getServiceSummary(value, serviceDetails)}
              </span>
            )}
          </button>

          {!readOnly && activePopover === value && buttonRefs.current[value] && (
            <ServiceDetailsPopover
              serviceType={value}
              details={serviceDetails}
              onSubmit={handleDetailsSubmit}
              onClose={() => handlePopoverClose(value)}
              onClear={() => handleClearService(value)}
              targetElement={buttonRefs.current[value]!}
            />
          )}
        </div>
      ))}
    </div>
  );
}