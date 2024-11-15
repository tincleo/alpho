import React, { useState } from 'react';
import { Plus, X, Settings } from 'lucide-react';
import { ServiceType, ServiceDetails } from '../../types/calendar';
import { toast } from 'react-toastify';

interface ServiceInstance {
  id: string;
  type: ServiceType;
  details: ServiceDetails[string];
}

interface ServiceTypeSelectorProps {
  selectedServices: ServiceInstance[];
  serviceDetails: Record<string, ServiceDetails[string]>;
  onToggleService: (service: ServiceInstance) => void;
  onUpdateDetails: (serviceId: string, details: ServiceDetails[string]) => void;
  readOnly?: boolean;
  isAddProspectModal?: boolean;
}

interface ServiceCardProps {
  type: ServiceType;
  details: ServiceDetails[string];
  onEdit: () => void;
  readOnly?: boolean;
}

const SERVICE_OPTIONS: { type: ServiceType; label: string }[] = [
  { type: 'couch', label: 'Couch' },
  { type: 'carpet', label: 'Carpet' },
  { type: 'auto-detailing', label: 'Auto' },
  { type: 'mattress', label: 'Mattress' }
];

function ServiceCard({
  type,
  details,
  onEdit,
  readOnly
}: ServiceCardProps) {
  const getLabel = () => {
    switch (type) {
      case 'couch': return 'Couch';
      case 'carpet': return 'Carpet';
      case 'auto-detailing': return 'Auto';
      case 'mattress': return 'Mattress';
      default: return type;
    }
  };

  const getDetails = () => {
    if (!details) return '';

    switch (type) {
      case 'couch': {
        const material = details.material?.charAt(0).toUpperCase() + details.material?.slice(1);
        return `${material}, ${details.seats} Seats`;
      }
      case 'carpet': {
        const size = details.size?.charAt(0).toUpperCase() + details.size?.slice(1);
        return `${size}, Qty: ${details.quantity}`;
      }
      case 'auto-detailing':
        const mode = details.cleaningMode ? 
          details.cleaningMode.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ') 
          : '';
        return `${mode}, ${details.seats} Seats`;
      case 'mattress': {
        const size = details.size?.charAt(0).toUpperCase() + details.size?.slice(1);
        return `${size}, Qty: ${details.quantity}`;
      }
      default:
        return '';
    }
  };

  const detailsText = getDetails();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!readOnly) {
          onEdit();
        }
      }}
      className={`w-full p-3 rounded-lg border text-left transition-colors ${
        readOnly 
          ? 'border-gray-200 bg-gray-50'
          : 'border-blue-100 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-200'
      }`}
    >
      <div className="font-medium text-sm text-gray-900">{getLabel()}</div>
      {detailsText && (
        <div className="mt-0.5 text-xs text-gray-600">
          {detailsText}
        </div>
      )}
    </button>
  );
}

interface ServiceOptionsModalProps {
  type: ServiceType;
  onClose: () => void;
  onSave: (type: ServiceType, details: ServiceDetails[string]) => void;
  onDelete?: () => void;
  isEditing?: boolean;
  loadingType?: string | null;
}

// Add this helper component for number inputs
interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  label: string;
}

function NumberInput({ value, onChange, min = 1, label }: NumberInputProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || min;
    if (newValue >= min) {
      onChange(newValue);
    }
  };

  const handleBlur = () => {
    if (value < min) {
      onChange(min);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => value > min && onChange(value - 1)}
          className="w-10 px-3 py-1 border rounded-l-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
        >
          -
        </button>
        <input
          type="number"
          min={min}
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className="w-16 px-2 py-1 border-t border-b text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-10 px-3 py-1 border rounded-r-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
        >
          +
        </button>
      </div>
    </div>
  );
}

function ServiceOptionsModal({ 
  type, 
  onClose, 
  onSave,
  onDelete,
  isEditing = false,
  loadingType
}: ServiceOptionsModalProps) {
  const [details, setDetails] = React.useState<ServiceDetails[string]>(() => {
    const defaultValues = {
      'couch': { material: 'fabric', seats: 7 },
      'carpet': { size: 'medium', quantity: 1 },
      'auto-detailing': { cleaningMode: 'seats-only', seats: 5 },
      'mattress': { size: 'medium', quantity: 1 }
    };

    return defaultValues[type];
  });

  const handleSave = () => {
    switch (type) {
      case 'couch':
        if (!details.material || !details.seats) {
          // console.log('Current details:', details);
          alert(`Please fill in all fields. Missing: ${!details.material ? 'Material' : ''} ${!details.seats ? 'Seats' : ''}`);
          return;
        }
        break;
      case 'carpet':
      case 'mattress':
        if (!details.size || !details.quantity) {
          // console.log('Current details:', details);
          alert(`Please fill in all fields. Missing: ${!details.size ? 'Size' : ''} ${!details.quantity ? 'Quantity' : ''}`);
          return;
        }
        break;
      case 'auto-detailing':
        if (!details.cleaningMode || !details.seats) {
          // console.log('Current details:', details);
          alert(`Please fill in all fields. Missing: ${!details.cleaningMode ? 'Cleaning Mode' : ''} ${!details.seats ? 'Seats' : ''}`);
          return;
        }
        break;
    }

    onSave(type, details);
    // onClose();
  };

  const getLabel = () => {
    switch (type) {
      case 'couch': return 'Couch';
      case 'carpet': return 'Carpet';
      case 'auto-detailing': return 'Auto';
      case 'mattress': return 'Mattress';
      default: return type;
    }
  };

  const renderFields = () => {
    switch (type) {
      case 'couch':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Material
              </label>
              <div className="flex gap-2">
                {['fabric', 'leather'].map((material) => (
                  <button
                    key={material}
                    type="button"
                    onClick={() => setDetails(prev => ({ ...prev, material }))}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      details.material === material
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {material.charAt(0).toUpperCase() + material.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <NumberInput
              value={details.seats || 7}
              onChange={(value) => setDetails(prev => ({ ...prev, seats: value }))}
              min={1}
              label="Number of Seats"
            />
          </div>
        );

      case 'carpet':
      case 'mattress':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size
              </label>
              <div className="flex gap-2">
                {['small', 'medium', 'large'].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setDetails(prev => ({ ...prev, size }))}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      details.size === size
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <NumberInput
              value={details.quantity || 1}
              onChange={(value) => setDetails(prev => ({ ...prev, quantity: value }))}
              min={1}
              label="Quantity"
            />
          </div>
        );

      case 'auto-detailing':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cleaning Mode
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'seats-only', label: 'Seats Only' },
                  { value: 'full-interior', label: 'Full Interior' },
                  { value: 'gold-cleaning', label: 'Gold Cleaning' }
                ].map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => setDetails(prev => ({ 
                      ...prev, 
                      cleaningMode: mode.value as ServiceDetails[string]['cleaningMode']
                    }))}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      details.cleaningMode === mode.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
            <NumberInput
              value={details.seats || 5}
              onChange={(value) => setDetails(prev => ({ ...prev, seats: value }))}
              min={1}
              label="Number of Seats"
            />
          </div>
        );

      default:
        return null;
    }
  };

  const isDeleting = loadingType === "delete"
  const isSaving = loadingType === "saving";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            {isEditing ? "Edit" : "Add"} {getLabel()}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4">{renderFields()}</div>

        <div className="flex justify-between items-center p-4 border-t">
          {isEditing && onDelete ? (
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="text-sm text-red-600 hover:text-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Add Service"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ServiceTypeSelector({
  selectedServices,
  serviceDetails,
  onToggleService,
  onUpdateDetails,
  isAddProspectModal,
  readOnly
}: ServiceTypeSelectorProps) {
  const [showServiceMenu, setShowServiceMenu] = React.useState(false);
  const [selectedType, setSelectedType] = React.useState<ServiceType | null>(null);
  const [editingServiceId, setEditingServiceId] = React.useState<string | null>(null);
  const [localServices, setLocalServices] = React.useState(selectedServices);
  const [loadingType, setLoadingType] = useState<string | null>(null)
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Keep local services in sync with prop updates
  React.useEffect(() => {
    setLocalServices(selectedServices);
  }, [selectedServices]);

  const handleServiceSelect = (type: ServiceType) => {
    setSelectedType(type);
    setShowServiceMenu(false);
  };

  const handleSaveService = async (
    type: ServiceType,
    details: ServiceDetails[string]
  ) => {
    setLoadingType("saving");

    // Check if there's already a service with identical properties
    const isDuplicate = selectedServices.some((service) => {
      if (service.type !== type) return false;

      // Compare all properties of the details object
      const existingDetails = serviceDetails[service.id];
      return JSON.stringify(existingDetails) === JSON.stringify(details);
    });

    if (isDuplicate) {
      // Just close the modal if it's a duplicate
      setSelectedType(null);
      setEditingServiceId(null);
      setLoadingType(null);

      return;
    }

    if (editingServiceId) {
      if (!isAddProspectModal) {
        // Use toast.promise to track the prospect creation
        toast.promise(onUpdateDetails(editingServiceId, details), {
          pending: "Updating service...",
          success: "Service updated 👌",
          error: {
            render({ data }) {
              // When the promise rejects, data will contain the error
              return `Failed to create prospect: ${data.message}`;
            },
          },
        });
      } else {
        // Update existing service
        await onUpdateDetails(editingServiceId, details);
      }
    } else {
      // Add new service instance
      const newService: ServiceInstance = {
        id: `${type}_${Date.now()}`,
        type,
        details,
      };

      if (!isAddProspectModal) {
        // Use toast.promise to track the prospect creation
        toast.promise(onToggleService(newService), {
          pending: "Creating service...",
          success: "Service created 👌",
          error: {
            render({ data }) {
              // When the promise rejects, data will contain the error
              return `Failed to create prospect: ${data.message}`;
            },
          },
        });
      } else {
        await onToggleService(newService);
      }
    }
    setLoadingType(null);

    setSelectedType(null);
    setEditingServiceId(null);
  };
  

  const handleDeleteService = async () => {
   try {
     setLoadingType("delete");
     if (editingServiceId) {
       // Optimistically update local state
       setLocalServices((prev) =>
         prev.filter((s) => s.id !== editingServiceId)
       );

       // Find the service to delete
       const serviceToDelete = selectedServices.find(
         (s) => s.id === editingServiceId
       );
       if (serviceToDelete) {
       

       if(!isAddProspectModal){
         // Use toast.promise to track the prospect creation
         toast.promise(onToggleService(serviceToDelete), {
           pending: "Deleting service...",
           success: "Service deleted 👌",
           error: {
             render({ data }) {
               // When the promise rejects, data will contain the error
               return `Failed to create prospect: ${data.message}`;
             },
           },
         });
       } else {
         // Trigger the actual deletion in the background
          await onToggleService(serviceToDelete);
       }

         // Close the modal immediately
         setEditingServiceId(null);
         setSelectedType(null);
       }
     }
     setLoadingType(null);
   } catch (error) {
    
   }

  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Services <span className="text-red-500">*</span>
        </label>
        {!readOnly && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowServiceMenu(!showServiceMenu)}
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add service
            </button>

            {showServiceMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                {SERVICE_OPTIONS.map(option => (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => handleServiceSelect(option.type)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Services Grid - Using localServices for immediate feedback */}
      <div className="grid grid-cols-3 gap-2">
        {localServices.map((service) => (
          <ServiceCard
            key={service.id}
            type={service.type}
            details={serviceDetails[service.id]}
            onEdit={() => {
              setEditingServiceId(service.id);
              setSelectedType(service.type);
            }}
            readOnly={readOnly}
          />
        ))}
      </div>

      {/* Service Options Modal */}
      {selectedType && (
        <ServiceOptionsModal
          type={selectedType}
          onClose={() => {
            setSelectedType(null);
            setEditingServiceId(null);
          }}
          loadingType={loadingType}
          onSave={handleSaveService}
          onDelete={editingServiceId ? handleDeleteService : undefined}
          isEditing={!!editingServiceId}
        />
      )}
    </div>
  );
}