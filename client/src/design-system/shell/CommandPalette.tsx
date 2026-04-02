import { Search, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface CommandItem {
  id: string;
  label: string;
  to: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose, commands }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/45 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="mx-auto mt-20 w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-gray-200 bg-gradient-to-r from-[var(--color-primary-soft)] via-white to-white px-4 py-3 dark:border-gray-700 dark:from-gray-800 dark:via-gray-900 dark:to-gray-900">
          <Search className="h-4 w-4 text-[var(--color-primary-700)] dark:text-gray-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers, bookings, vendors, payments..."
            className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-500 dark:text-gray-100 dark:placeholder:text-gray-400"
          />
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
            aria-label="Close command palette"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-auto p-2">
          {filtered.map((item) => (
            <button
              key={item.id}
              className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary-800)] dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white"
              onClick={() => {
                navigate(item.to);
                onClose();
              }}
            >
              {item.label}
            </button>
          ))}
          {!filtered.length && (
            <p className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">No matching results.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
