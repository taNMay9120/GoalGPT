import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';

interface SearchDropdownProps {
  label: string;
  color: 'gold' | 'green';
  value: string;
  teams: string[];
  onChange: (value: string) => void;
  exclude?: string;
}

export const SearchDropdown: React.FC<SearchDropdownProps> = ({ label, color, value, teams, onChange, exclude }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [portalRect, setPortalRect] = useState<{ left: number; top: number; width: number } | null>(null);

  const filtered = teams
    .filter((team) => team !== exclude)
    .filter((team) => team.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (ref.current && ref.current.contains(target)) return;
      if (panelRef.current && panelRef.current.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const rect = ref.current?.getBoundingClientRect();
      if (rect) {
        setPortalRect({ left: rect.left, top: rect.bottom + 8, width: rect.width });
      }
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  const accent = color === 'gold' ? 'border-brand-gold text-brand-goldLight' : 'border-brand-accent text-brand-accentLight';

  const panel = open && portalRect ? createPortal(
    <div
      ref={panelRef}
      style={{ position: 'absolute', left: portalRect.left, top: portalRect.top, width: portalRect.width, zIndex: 9999 }}
      className="bg-dark-card border border-dark-border rounded-2xl shadow-2xl overflow-hidden"
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-dark-border/60">
        <Search className="h-3.5 w-3.5 text-dark-muted" />
        <input
          autoFocus
          className="w-full bg-transparent text-sm text-dark-text placeholder-dark-muted/50 outline-none border-0 focus:ring-0"
          placeholder="Search or scroll to choose"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <ul className="max-h-64 overflow-y-auto py-1">
        {filtered.length === 0 ? (
          <li className="px-4 py-3 text-xs text-dark-muted text-center">No teams found</li>
        ) : (
          filtered.map((team) => (
            <li key={team}>
              <button
                type="button"
                onClick={() => {
                  onChange(team);
                  setOpen(false);
                  setQuery('');
                }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${team === value ? 'bg-dark-border/40 font-semibold ' + accent : 'text-dark-text hover:bg-dark-border/30'}`}
              >
                {team}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>,
    document.body,
  ) : null;

  return (
    <div ref={ref} className="w-full flex flex-col gap-1.5 relative">
      <span className={`text-xs font-semibold uppercase tracking-wider ${color === 'gold' ? 'text-brand-goldLight' : 'text-brand-accentLight'}`}>
        {label}
      </span>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center justify-between gap-3 bg-dark-bg border rounded-xl px-4 py-3 text-left text-sm text-dark-text transition-all ${open ? accent : 'border-dark-border'}`}
      >
        <span className="truncate">{value || 'Select team…'}</span>
        <span className="text-dark-muted">▾</span>
      </button>
      {panel}
    </div>
  );
};
