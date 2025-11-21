import React from 'react';

interface SortDropdownProps {
  onChange: (value: string) => void;
  value: string;
}

const SortDropdown: React.FC<SortDropdownProps> = ({ onChange, value }) => {
  return (
    <div className="relative inline-block text-left">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        <option value="date_desc">Date (Newest)</option>
        <option value="date_asc">Date (Oldest)</option>
        <option value="name_asc">Name (A-Z)</option>
        <option value="name_desc">Name (Z-A)</option>
        <option value="size_desc">Size (Largest)</option>
        <option value="size_asc">Size (Smallest)</option>
      </select>
    </div>
  );
};

export default SortDropdown;
