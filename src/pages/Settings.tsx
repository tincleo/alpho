import React, { useState, useEffect, Fragment } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import Select from 'react-select';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';
import { LocationRow } from '../lib/api';
import { Dialog, Transition, Menu, Popover } from '@headlessui/react';

const tabs = [
  { name: 'Locations', path: 'locations' },
  { name: 'Services', path: 'services' },
  { name: 'Prospects', path: 'prospects' },
  { name: 'Team', path: 'team' },
  { name: 'Security', path: 'security' },
];

const communes = [
  'Yaoundé 1',
  'Yaoundé 2',
  'Yaoundé 3',
  'Yaoundé 4',
  'Yaoundé 5',
  'Yaoundé 6',
];

const standings = ['Moyen standing', 'Haut standing'];

interface LocationFormData {
  name: string;
  commune: string;
  standing: string;
  neighboring: string[];
}

interface LocationRow {
  id: number;
  name: string;
  commune: string;
  standing: string;
  neighboring: string[];
}

// Location Modal Component
function LocationModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = { name: '', commune: communes[0], standing: standings[0], neighboring: [] },
  existingLocations = []
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (data: LocationFormData) => void;
  initialData?: LocationFormData;
  existingLocations?: LocationRow[];
}) {
  const [formData, setFormData] = useState<LocationFormData>(initialData);
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    setFormData(initialData);
    setNameError('');
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate name
    if (!formData.name.trim()) {
      setNameError('Location name is required');
      return;
    }
    
    onSubmit(formData);
  };

  const locationOptions = existingLocations
    .filter(loc => loc.name !== formData.name) // Exclude current location
    .map(loc => ({
      value: loc.name,
      label: loc.name
    }));

  const selectedNeighboring = (formData.neighboring || [])
    .map(name => ({
      value: name,
      label: name
    }));

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
                  {initialData.name ? 'Edit Location' : 'New Location'}
                </Dialog.Title>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div className="mt-2">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Name<span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="name"
                          id="name"
                          required
                          value={formData.name}
                          onChange={(e) => {
                            setFormData({ ...formData, name: e.target.value });
                            setNameError('');
                          }}
                          className={clsx(
                            "block w-full rounded-md shadow-sm sm:text-sm",
                            nameError
                              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          )}
                        />
                        {nameError && (
                          <p className="mt-1 text-sm text-red-600">
                            {nameError}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="commune" className="block text-sm font-medium text-gray-700">
                          Commune
                        </label>
                        <div className="mt-1">
                          <select
                            id="commune"
                            name="commune"
                            value={formData.commune}
                            onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          >
                            {communes.map((commune) => (
                              <option key={commune} value={commune}>
                                {commune}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="standing" className="block text-sm font-medium text-gray-700">
                          Standing
                        </label>
                        <div className="mt-1">
                          <select
                            id="standing"
                            name="standing"
                            value={formData.standing}
                            onChange={(e) => setFormData({ ...formData, standing: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          >
                            {standings.map((standing) => (
                              <option key={standing} value={standing}>
                                {standing}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label htmlFor="neighboring" className="block text-sm font-medium text-gray-700">
                        Neighboring
                      </label>
                      <div className="mt-1">
                        <Select
                          isMulti
                          closeMenuOnSelect={false}
                          name="neighboring"
                          options={locationOptions}
                          className="basic-multi-select"
                          classNamePrefix="select"
                          value={selectedNeighboring}
                          onChange={(selected) => {
                            const selectedValues = selected ? selected.map(option => option.value) : [];
                            setFormData({ ...formData, neighboring: selectedValues });
                          }}
                          styles={{
                            control: (base) => ({
                              ...base,
                              borderColor: '#D1D5DB',
                              '&:hover': {
                                borderColor: '#9CA3AF'
                              }
                            }),
                            multiValue: (base) => ({
                              ...base,
                              backgroundColor: '#E5E7EB',
                              borderRadius: '0.375rem'
                            }),
                            multiValueLabel: (base) => ({
                              ...base,
                              color: '#374151'
                            }),
                            multiValueRemove: (base) => ({
                              ...base,
                              color: '#6B7280',
                              ':hover': {
                                backgroundColor: '#D1D5DB',
                                color: '#1F2937'
                              }
                            }),
                            menu: (base) => ({
                              ...base,
                              zIndex: 100,
                              position: 'relative',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                            }),
                            menuPortal: (base) => ({
                              ...base,
                              zIndex: 100
                            })
                          }}
                          menuPortalTarget={document.body}
                          menuPosition="fixed"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      {initialData.name ? 'Save Changes' : 'Create Location'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// Delete Confirmation Modal Component
function DeleteConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  locationName 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void;
  locationName: string;
}) {
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleDelete = () => {
    if (pinCode === '2014') {
      onConfirm();
      onClose();
      setPinCode('');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      Delete Location
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete {locationName}? This action cannot be undone.
                      </p>
                      <div className="mt-4">
                        <label htmlFor="pin-code" className="block text-sm font-medium text-gray-700">
                          Enter PIN code to confirm
                        </label>
                        <div className="mt-1">
                          <input
                            type="password"
                            id="pin-code"
                            maxLength={4}
                            value={pinCode}
                            onChange={(e) => {
                              setPinCode(e.target.value.replace(/[^0-9]/g, ''));
                              setPinError(false);
                            }}
                            className={clsx(
                              'block w-full rounded-md sm:text-sm',
                              pinError
                                ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
                                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                            )}
                          />
                        </div>
                        {pinError && (
                          <p className="mt-2 text-sm text-red-600">
                            Incorrect PIN code
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-6 flex space-x-4">
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          setPinCode('');
                          setPinError(false);
                        }}
                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function ActionMenu({ location, onEdit, onDelete }: { 
  location: LocationRow; 
  onEdit: () => void; 
  onDelete: () => void;
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="flex items-center text-gray-400 hover:text-gray-600">
        <span className="sr-only">Open options</span>
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-36 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onEdit}
                  className={clsx(
                    active ? 'bg-gray-100' : '',
                    'flex w-full px-4 py-2 text-sm text-gray-700'
                  )}
                >
                  <svg className="mr-3 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                  Edit
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className={clsx(
                    active ? 'bg-gray-100' : '',
                    'flex w-full px-4 py-2 text-sm text-red-700'
                  )}
                >
                  <svg className="mr-3 h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" />
                  </svg>
                  Delete
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={onDelete}
        locationName={location.name}
      />
    </Menu>
  );
}

// Locations Settings Component
function LocationsSettings() {
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase.from('locations').select('*').order('name');
      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLocations = locations.filter(location => {
    const searchLower = searchQuery.toLowerCase();
    return location.name.toLowerCase().includes(searchLower);
  });

  const handleCreateLocation = async (formData: LocationFormData) => {
    try {
      // Check if we have a valid session
      const { data: session } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session found');
      }

      const { data, error } = await supabase
        .from('locations')
        .insert([{
          name: formData.name,
          commune: formData.commune,
          standing: formData.standing,
          neighboring: formData.neighboring
        }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchLocations();
      setIsModalOpen(false);
      setEditingLocation(null);
    } catch (error: any) {
      console.error('Error creating location:', error);
      // Show error message to user
      alert(`Error creating location: ${error.message || 'Unknown error occurred'}`);
    }
  };

  const handleUpdateLocation = async (formData: LocationFormData) => {
    try {
      const { error } = await supabase
        .from('locations')
        .update(formData)
        .eq('name', editingLocation?.name);
      if (error) throw error;
      await fetchLocations();
      setIsModalOpen(false);
      setEditingLocation(null);
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const handleDeleteLocation = async (name: string) => {
    try {
      const { error } = await supabase.from('locations').delete().eq('name', name);
      if (error) throw error;
      await fetchLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
    }
  };

  const openEditModal = (location: LocationRow) => {
    setEditingLocation({
      name: location.name,
      commune: location.commune || communes[0],
      standing: location.standing || standings[0],
      neighboring: location.neighboring || [], // Ensure neighboring is always an array
    });
    setIsModalOpen(true);
  };

  return (
    <div className="p-8">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Locations</h2>
              <p className="mt-1 text-sm text-gray-500">This page is for managing locations.</p>
            </div>
            <button
              onClick={() => {
                setEditingLocation(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              New Location
            </button>
          </div>
          <div className="mt-4">
            <div className="relative rounded-md shadow-sm max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" />
                </svg>
              </div>
              <input
                type="text"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="px-6 py-4 text-center text-sm text-gray-500">Loading locations...</div>
        ) : filteredLocations.length === 0 ? (
          <div className="px-6 py-4 text-center text-sm text-gray-500">
            {searchQuery ? 'No locations found matching your search.' : 'No locations found. Create one to get started.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="w-12 py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">#</th>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Commune</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Standing</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Neighboring</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredLocations.map((location, index) => (
                  <tr key={location.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">{index + 1}</td>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{location.name}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{location.commune || '-'}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{location.standing || '-'}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {location.neighboring?.length > 0 
                        ? location.neighboring.join(', ')
                        : '-'
                      }
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <ActionMenu
                        location={location}
                        onEdit={() => openEditModal(location)}
                        onDelete={() => handleDeleteLocation(location.name)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <LocationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLocation(null);
        }}
        onSubmit={editingLocation ? handleUpdateLocation : handleCreateLocation}
        initialData={editingLocation || { name: '', commune: communes[0], standing: standings[0], neighboring: [] }}
        existingLocations={locations}
      />
    </div>
  );
}

function ServicesSettings() {
  return (
    <div className="p-8">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Services</h2>
          <p className="mt-1 text-sm text-gray-500">Manage your service offerings and pricing.</p>
        </div>
        <div className="p-6">
          <p className="text-gray-600">Configure and manage your services here.</p>
        </div>
      </div>
    </div>
  );
}

function ProspectsSettings() {
  return (
    <div className="p-8">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Prospects</h2>
          <p className="mt-1 text-sm text-gray-500">Configure prospect management settings.</p>
        </div>
        <div className="p-6">
          <p className="text-gray-600">Customize how prospects are managed in your system.</p>
        </div>
      </div>
    </div>
  );
}

function TeamSettings() {
  return (
    <div className="p-8">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Team</h2>
          <p className="mt-1 text-sm text-gray-500">Manage team members and their permissions.</p>
        </div>
        <div className="p-6">
          <p className="text-gray-600">Add, remove, or modify team member access and roles.</p>
        </div>
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="p-8">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Security</h2>
          <p className="mt-1 text-sm text-gray-500">Configure security and authentication settings.</p>
        </div>
        <div className="p-6">
          <p className="text-gray-600">Manage security preferences and authentication methods.</p>
        </div>
      </div>
    </div>
  );
}

// Settings layout component with tabs navigation
function SettingsLayout() {
  const location = useLocation();
  const currentPath = location.pathname.split('/').pop();

  return (
    <div className="h-screen flex flex-col">
      {/* Settings Header - Fixed at top */}
      <div className="flex-none bg-white shadow z-10">
        <div className="px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        </div>
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-8" aria-label="Settings tabs">
            {tabs.map((tab) => (
              <Link
                key={tab.path}
                to={`/settings/${tab.path}`}
                className={clsx(
                  currentPath === tab.path
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                  'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium'
                )}
              >
                {tab.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Settings Content - Scrollable */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <Routes>
          <Route index element={<Navigate to="locations" replace />} />
          <Route path="locations" element={<LocationsSettings />} />
          <Route path="services" element={<ServicesSettings />} />
          <Route path="prospects" element={<ProspectsSettings />} />
          <Route path="team" element={<TeamSettings />} />
          <Route path="security" element={<SecuritySettings />} />
        </Routes>
      </div>
    </div>
  );
}

// Main Settings component
export default function Settings() {
  return <SettingsLayout />;
}
