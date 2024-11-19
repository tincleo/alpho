import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import clsx from 'clsx';

const tabs = [
  { name: 'Locations', path: 'locations' },
  { name: 'Services', path: 'services' },
  { name: 'Prospects', path: 'prospects' },
  { name: 'Team', path: 'team' },
  { name: 'Security', path: 'security' },
];

// Inner pages components
function LocationsSettings() {
  return (
    <div className="p-8">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Locations</h2>
          <p className="mt-1 text-sm text-gray-500">Manage your business locations and addresses.</p>
        </div>
        <div className="p-6">
          <p className="text-gray-600">Configure and manage your business locations here.</p>
        </div>
      </div>
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
