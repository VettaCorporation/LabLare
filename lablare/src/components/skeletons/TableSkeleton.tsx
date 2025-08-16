// Caminho: src/components/skeletons/TableSkeleton.tsx
import React from 'react';

export const TableSkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-center">
      <div className="flex justify-center items-center gap-4">
        <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
    </td>
  </tr>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => {
  return (
    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
      {Array.from({ length: rows }).map((_, index) => (
        <TableSkeletonRow key={index} />
      ))}
    </tbody>
  );
};