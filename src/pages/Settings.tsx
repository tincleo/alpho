import React, { useState, useEffect, Fragment } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';
import { LocationRow } from '../lib/api';
import { Dialog, Transition, Popover } from '@headlessui/react';

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
}

// Location Modal Component
function LocationModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = { name: '', commune: communes[0], standing: standings[0] } 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (data: LocationFormData) => void;
  initialData?: LocationFormData;
}) {
  const [formData, setFormData] = useState<LocationFormData>(initialData);

  // Reset form data when modal opens with new initial data
  useEffect(() => {
    if (isOpen) {
      setFormData(initialData);
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
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
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
                  {initialData.name ? 'Edit Location' : 'New Location'}
                </Dialog.Title>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="commune" className="block text-sm font-medium text-gray-700">
                        Commune
                      </label>
                      <select
                        id="commune"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={formData.commune}
                        onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                      >
                        {communes.map((commune) => (
                          <option key={commune} value={commune}>
                            {commune}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="standing" className="block text-sm font-medium text-gray-700">
                        Standing
                      </label>
                      <select
                        id="standing"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={formData.standing}
                        onChange={(e) => setFormData({ ...formData, standing: e.target.value })}
                      >
                        {standings.map((standing) => (
                          <option key={standing} value={standing}>
                            {standing}
                          </option>
                        ))}
                      </select>
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

function DeleteConfirmationPopover({ onConfirm, locationName }: { onConfirm: () => void, locationName: string }) {
  return (
    <Popover className="relative">
      <Popover.Button className="text-red-600 hover:text-red-900">
        Delete
      </Popover.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel className="absolute z-10 right-0 mt-2 w-72">
          <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="relative bg-white p-4">
              <div className="text-sm text-gray-900 mb-3">
                Are you sure you want to delete <span className="font-semibold">{locationName}</span>?
              </div>
              <div className="flex justify-end space-x-2">
                <Popover.Button className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancel
                </Popover.Button>
                <Popover.Button
                  className="rounded-md border border-transparent bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                  onClick={onConfirm}
                >
                  Delete
                </Popover.Button>
              </div>
            </div>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
}

// Locations Settings Component
function LocationsSettings() {
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // Only fetch locations once when component mounts
  useEffect(() => {
    fetchLocations();
  }, []);

  const handleCreateLocation = async (formData: LocationFormData) => {
    try {
      const { error } = await supabase.from('locations').insert([formData]);
      if (error) throw error;
      await fetchLocations();
      setIsModalOpen(false);
      setEditingLocation(null);
    } catch (error) {
      console.error('Error creating location:', error);
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
              <p className="mt-1 text-sm text-gray-500">Manage your business locations and addresses.</p>
            </div>
            <button
              onClick={() => {
                setEditingLocation(null);
                setIsModalOpen(true);
              }}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              New Location
            </button>
          </div>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-4">Loading locations...</div>
          ) : locations.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No locations found. Create one to get started.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commune
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Standing
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {locations.map((location) => (
                    <tr key={location.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{location.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{location.commune || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{location.standing || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(location)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <DeleteConfirmationPopover
                          locationName={location.name}
                          onConfirm={() => handleDeleteLocation(location.name)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <LocationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLocation(null);
        }}
        onSubmit={editingLocation ? handleUpdateLocation : handleCreateLocation}
        initialData={editingLocation || undefined}
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
    <div className="flex flex-col h-full">
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
