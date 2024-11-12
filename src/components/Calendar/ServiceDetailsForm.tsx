import React from 'react';
import { ServiceType, ServiceDetails, Size } from '../../types/calendar';

interface ServiceDetailsFormProps {
  serviceType: ServiceType;
  details: ServiceDetails;
  onChange: (type: ServiceType, details: ServiceDetails) => void;
}

export function ServiceDetailsForm({ serviceType, details, onChange }: ServiceDetailsFormProps) {
  const handleChange = (newDetails: ServiceDetails) => {
    onChange(serviceType, newDetails);
  };

  const renderSizeSelector = (
    currentSize: Size | undefined,
    onSizeChange: (size: Size) => void
  ) => (
    <div className="flex gap-2">
      {['small', 'medium', 'large'].map((size) => (
        <button
          key={size}
          type="button"
          onClick={() => onSizeChange(size as Size)}
          className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
            currentSize === size
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {size.charAt(0).toUpperCase() + size.slice(1)}
        </button>
      ))}
    </div>
  );

  switch (serviceType) {
    case 'couch':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Couch Type
            </label>
            <div className="flex gap-2">
              {['leather', 'tissue'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    handleChange({
                      ...details,
                      couch: { ...details.couch, type: type as 'leather' | 'tissue' },
                    })
                  }
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    details.couch?.type === type
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Seats
            </label>
            <input
              type="number"
              min="1"
              value={details.couch?.seats || 1}
              onChange={(e) =>
                handleChange({
                  ...details,
                  couch: { ...details.couch, seats: parseInt(e.target.value) },
                })
              }
              className="w-24 px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      );

    case 'carpet':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Carpet Size
          </label>
          {renderSizeSelector(details.carpet?.size, (size) =>
            handleChange({ ...details, carpet: { size } })
          )}
        </div>
      );

    case 'auto-detailing':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cleaning Mode
          </label>
          <div className="flex gap-2">
            {['seats-only', 'full-interior', 'gold-cleaning'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() =>
                  handleChange({
                    ...details,
                    'auto-detailing': { cleaningMode: mode as ServiceDetails['auto-detailing']['cleaningMode'] },
                  })
                }
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  details['auto-detailing']?.cleaningMode === mode
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {mode.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </button>
            ))}
          </div>
        </div>
      );

    case 'mattress':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mattress Size
          </label>
          {renderSizeSelector(details.mattress?.size, (size) =>
            handleChange({ ...details, mattress: { size } })
          )}
        </div>
      );

    default:
      return null;
  }
}