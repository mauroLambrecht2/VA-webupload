import React, { useState, useEffect } from 'react';
import './SearchFilter.css';

export interface FilterOptions {
  search: string;
  sortBy: 'date' | 'name' | 'size' | 'views';
  sortOrder: 'asc' | 'desc';
  fileType: string;
  dateRange: string;
  sizeRange: string;
}

interface SearchFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  totalCount: number;
  filteredCount: number;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  onFilterChange,
  totalCount,
  filteredCount
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    sortBy: 'date',
    sortOrder: 'desc',
    fileType: 'all',
    dateRange: 'all',
    sizeRange: 'all'
  });

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      sortBy: 'date',
      sortOrder: 'desc',
      fileType: 'all',
      dateRange: 'all',
      sizeRange: 'all'
    });
  };

  const hasActiveFilters = filters.search || 
    filters.fileType !== 'all' || 
    filters.dateRange !== 'all' || 
    filters.sizeRange !== 'all';

  return (
    <div className="search-filter">
      <div className="search-bar">
        <div className="search-input-container">
          <input
            type="text"
            placeholder="Search clips by name or uploader..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <div className="sort-controls">
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="sort-select"
          >
            <option value="date">Upload Date</option>
            <option value="name">Name</option>
            <option value="size">File Size</option>
            <option value="views">Views</option>
          </select>
          
          <button
            className={`sort-order-btn ${filters.sortOrder}`}
            onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
            title={filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {filters.sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
        
        <button
          className={`filter-toggle ${isExpanded ? 'active' : ''}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="filter-icon">⚙️</span>
          Filters
          {hasActiveFilters && <span className="filter-indicator">•</span>}
        </button>
      </div>

      {isExpanded && (
        <div className="filter-panel">
          <div className="filter-row">
            <div className="filter-group">
              <label>File Type</label>
              <select
                value={filters.fileType}
                onChange={(e) => handleFilterChange('fileType', e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="mp4">MP4</option>
                <option value="webm">WebM</option>
                <option value="mov">MOV</option>
                <option value="avi">AVI</option>
                <option value="mkv">MKV</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Upload Date</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>File Size</label>
              <select
                value={filters.sizeRange}
                onChange={(e) => handleFilterChange('sizeRange', e.target.value)}
              >
                <option value="all">All Sizes</option>
                <option value="small">Under 10MB</option>
                <option value="medium">10MB - 100MB</option>
                <option value="large">100MB - 500MB</option>
                <option value="huge">Over 500MB</option>
              </select>
            </div>
          </div>
          
          <div className="filter-actions">
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear All Filters
            </button>
          </div>
        </div>
      )}
      
      <div className="results-summary">
        {filteredCount !== totalCount ? (
          <>Showing {filteredCount} of {totalCount} clips</>
        ) : (
          <>Showing all {totalCount} clips</>
        )}
      </div>
    </div>
  );
};

export default SearchFilter;
