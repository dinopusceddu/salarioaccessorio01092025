// components/shared/YearSelector.tsx - Selector per anni disponibili
import React, { useEffect, useState } from 'react';
import { DatabaseService } from '../../services/database';
import { useAuth } from '../../contexts/AuthContext';
import { Select } from './Select';
import { Button } from './Button';

interface YearSelectorProps {
  currentYear: number;
  onYearChange: (year: number) => void;
  onLoadYear: (year: number) => void;
  className?: string;
}

export const YearSelector: React.FC<YearSelectorProps> = ({ 
  currentYear, 
  onYearChange, 
  onLoadYear,
  className = ''
}) => {
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadAvailableYears();
    }
  }, [user]);

  const loadAvailableYears = async () => {
    try {
      setLoading(true);
      const years = await DatabaseService.getAvailableYears();
      setAvailableYears(years);
    } catch (error) {
      console.error('Error loading available years:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadYear = async () => {
    if (selectedYear && selectedYear !== currentYear) {
      onLoadYear(selectedYear);
    }
  };

  if (!user || availableYears.length === 0) {
    return null;
  }

  const yearOptions = availableYears.map(year => ({
    value: year,
    label: year.toString()
  }));

  return (
    <div className={`bg-white rounded-lg border border-[#f3e7e8] p-4 ${className}`}>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Select
            label="Carica dati da anno precedente"
            options={yearOptions}
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            placeholder="Seleziona anno..."
            disabled={loading}
          />
        </div>
        <div className="flex items-end">
          <Button
            onClick={handleLoadYear}
            disabled={loading || !selectedYear || selectedYear === currentYear}
            size="md"
          >
            {loading ? 'Caricando...' : 'Carica Dati'}
          </Button>
        </div>
      </div>
      {availableYears.length > 0 && (
        <p className="text-sm text-[#994d51] mt-2">
          Anni disponibili: {availableYears.join(', ')}
        </p>
      )}
    </div>
  );
};