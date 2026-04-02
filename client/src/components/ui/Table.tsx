import React from "react";

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

const Table: React.FC<TableProps> = ({ children, className = "" }) => {
  return (
    <div className="overflow-x-auto">
      <table
        className={`min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700 ${className}`}
      >
        {children}
      </table>
    </div>
  );
};

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  children,
  className = "",
}) => {
  return (
    <thead
      className={`sticky top-0 z-[1] bg-gray-50/95 backdrop-blur dark:bg-gray-900/95 ${className}`}
    >
      {children}
    </thead>
  );
};

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const TableBody: React.FC<TableBodyProps> = ({
  children,
  className = "",
}) => {
  return (
    <tbody
      className={`divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800 ${className}`}
    >
      {children}
    </tbody>
  );
};

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const TableRow: React.FC<TableRowProps> = ({
  children,
  className = "",
  onClick,
}) => {
  return (
    <tr
      className={`transition-colors duration-150 even:bg-gray-50/40 hover:bg-[var(--color-primary-soft)] dark:even:bg-gray-900/40 dark:hover:bg-gray-700/70 ${onClick ? "cursor-pointer" : ""} ${className}`}
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

export const TableCell: React.FC<TableCellProps> = ({
  children,
  className = "",
  header = false,
  colSpan,
}) => {
  const baseClasses = "px-3 sm:px-5 py-3 sm:py-3.5 align-middle";
  const cellClasses = header
    ? `${baseClasses} text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400`
    : `${baseClasses} text-gray-900 dark:text-gray-100`;

  const Component = header ? "th" : "td";

  return (
    <Component className={`${cellClasses} ${className}`} colSpan={colSpan}>
      {children}
    </Component>
  );
};

export default Table;
