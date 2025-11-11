import React from 'react';

const AddPatientPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Add New Patient
        </h1>
        <p className="text-gray-600">
          Profile completion verified - Access granted!
        </p>
        <div className="mt-6">
          <p className="text-sm text-gray-500">
            This page is protected by ProfileRouteGuard. Users with incomplete
            profiles will be redirected to profile page with a modal message.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddPatientPage;
