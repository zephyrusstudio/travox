import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

const Table: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y divide-gray-200 dark:divide-gray-700 ${className}`}>
        {children}
      </table>
    </div>
  );
};

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const TableHeader: React.FC<TableHeaderProps> = ({ children, className = '' }) => {
  return (
    <thead className={`bg-gray-50 dark:bg-gray-900 ${className}`}>
      {children}
    </thead>
  );
};

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const TableBody: React.FC<TableBodyProps> = ({ children, className = '' }) => {
  return (
    <tbody className={`bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 ${className}`}>
      {children}
    </tbody>
  );
};

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const TableRow: React.FC<TableRowProps> = ({ children, className = '', onClick }) => {
  return (
    <tr 
      className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  header?: boolean;
  colSpan?: number;
}

export const TableCell: React.FC<TableCellProps> = ({ children, className = '', header = false, colSpan }) => {
  const baseClasses = 'px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm';
  const cellClasses = header 
    ? `${baseClasses} font-medium text-gray-900 dark:text-gray-100 text-left tracking-wider uppercase`
    : `${baseClasses} text-gray-900 dark:text-gray-100`;
    
  const Component = header ? 'th' : 'td';
  
  return (
    <Component className={`${cellClasses} ${className}`} colSpan={colSpan}>
      {children}
    </Component>
  );
};

export default Table;