import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ServiceType, ServiceDetails, Size } from '../../types/calendar';

interface ServiceDetailsPopoverProps {
  serviceType: ServiceType;
  details: ServiceDetails;
  onSubmit: (type: ServiceType, details: ServiceDetails) => void;
  onClose: () => void;
  onClear: () => void;
  targetElement: HTMLElement;
  detailsOptional?: boolean;
}

const DEFAULT_VALUES: Record<ServiceType, ServiceDetails> = {
  'couch': { couch: { type: undefined, seats: 7 } },
  'carpet': { carpet: { size: undefined, quantity: 1 } },
  'car-seats': { 'car-seats': { seats: 5 } },
  'mattress': { mattress: { size: undefined, quantity: 1 } }
};

export function ServiceDetailsPopover({ 
  serviceType, 
  details: initialDetails,
  onSubmit,
  onClose,
  onClear,
  targetElement,
  detailsOptional = false
}: ServiceDetailsPopoverProps) {
  const [details, setDetails] = React.useState<ServiceDetails>(() => ({
    ...DEFAULT_VALUES[serviceType],
    ...initialDetails
  }));
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const popoverRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        !targetElement.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [targetElement, onClose]);

  React.useEffect(() => {
    const updatePosition = () => {
      const targetRect = targetElement.getBoundingClientRect();
      if (popoverRef.current) {
        const popoverRect = popoverRef.current.getBoundingClientRect();
        
        let top = targetRect.bottom + window.scrollY + 8;
        let left = targetRect.left + window.scrollX - (popoverRect.width - targetRect.width) / 2;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (left + popoverRect.width > viewportWidth) {
          left = viewportWidth - popoverRect.width - 16;
        }
        if (left < 16) {
          left = 16;
        }

        if (top + popoverRect.height > viewportHeight + window.scrollY) {
          top = targetRect.top + window.scrollY - popoverRect.height - 8;
        }

        popoverRef.current.style.top = `${top}px`;
        popoverRef.current.style.left = `${left}px`;
      }
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [targetElement]);

  const validateForm = (): boolean => {
    if (detailsOptional) return true;

    const newErrors: Record<string, string> = {};

    switch (serviceType) {
      case 'couch':
        if (!details.couch?.type) {
          newErrors.type = 'Please select a couch type';
        }
        break;
      case 'carpet':
        if (!details.carpet?.size) {
          newErrors.size = 'Please select a carpet size';
        }
        break;
      case 'mattress':
        if (!details.mattress?.size) {
          newErrors.size = 'Please select a mattress size';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (validateForm()) {
      onSubmit(serviceType, details);
    }
  };

  const renderSizeSelector = (
    currentSize: Size | undefined,
    onSizeChange: (size: Size) => void,
    error?: string
  ) => (
    <div className="space-y-2">
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
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );

  const renderQuantitySelector = (
    currentQuantity: number | undefined,
    onChange: (quantity: number) => void
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Quantity
      </label>
      <select
        value={currentQuantity}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-24 px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {[1, 2, 3, 4, 5].map((num) => (
          <option key={num} value={num}>
            {num}
          </option>
        ))}
      </select>
    </div>
  );

  const renderContent = () => {
    switch (serviceType) {
      case 'couch':
        return (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Couch Type
              </label>
              <div className="flex gap-2">
                {['leather', 'tissue'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      setDetails({
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
              {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Seats
              </label>
              <input
                type="number"
                min="1"
                value={details.couch?.seats}
                onChange={(e) =>
                  setDetails({
                    ...details,
                    couch: { 
                      type: details.couch?.type,
                      seats: parseInt(e.target.value) 
                    },
                  })
                }
                className="w-24 px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </>
        );

      case 'carpet':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Carpet Size
              </label>
              {renderSizeSelector(
                details.carpet?.size,
                (size) => setDetails({ 
                  ...details, 
                  carpet: { 
                    ...details.carpet,
                    size,
                  } 
                }),
                errors.size
              )}
            </div>
            {renderQuantitySelector(
              details.carpet?.quantity,
              (quantity) => setDetails({
                ...details,
                carpet: {
                  ...details.carpet,
                  size: details.carpet?.size,
                  quantity
                }
              })
            )}
          </>
        );

      case 'car-seats':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Seats
            </label>
            <input
              type="number"
              min="1"
              value={details['car-seats']?.seats}
              onChange={(e) =>
                setDetails({
                  ...details,
                  'car-seats': { seats: parseInt(e.target.value) },
                })
              }
              className="w-24 px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        );

      case 'mattress':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mattress Size
              </label>
              {renderSizeSelector(
                details.mattress?.size,
                (size) => setDetails({ 
                  ...details, 
                  mattress: { 
                    ...details.mattress,
                    size,
                  } 
                }),
                errors.size
              )}
            </div>
            {renderQuantitySelector(
              details.mattress?.quantity,
              (quantity) => setDetails({
                ...details,
                mattress: {
                  ...details.mattress,
                  size: details.mattress?.size,
                  quantity
                }
              })
            )}
          </>
        );

      default:
        return null;
    }
  };

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed z-50 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-4"
    >
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">
            Service Details {!detailsOptional && <span className="text-red-500">*</span>}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {renderContent()}
          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={onClear}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Clear
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}