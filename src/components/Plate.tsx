import React, { DragEvent } from 'react';
import Search from './Search';
import { SearchData } from '../types';

interface PlateProps {
  plateIndex: number;
  rows: (SearchData | undefined)[][];
  covariateColors: { [key: string]: string };
  selectedCovariates: string[];
  onDragStart: (event: DragEvent<HTMLDivElement>, searchName: string) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>, rowIndex: number, columnIndex: number) => void;
}

const Plate: React.FC<PlateProps> = ({ plateIndex, rows, covariateColors, selectedCovariates, onDragStart, onDragOver, onDrop }) => {
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    onDragOver(event);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, rowIndex: number, columnIndex: number) => {
    event.preventDefault();
    onDrop(event, rowIndex, columnIndex);
  };

  const columns = Array.from({ length: 12 }, (_, index) => (index + 1).toString().padStart(2, '0'));

  return (
    <div style={styles.plate}>
      <h2 style={styles.plateHeading}>Plate {plateIndex + 1}</h2>
      <div style={styles.grid}>
        <div style={styles.columnLabels}>
          <div style={styles.emptyCell} />
          {columns.map((column) => (
            <div key={column} style={styles.columnLabel}>
              {column}
            </div>
          ))}
        </div>
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} style={styles.row}>
            <div style={styles.rowLabel}>{String.fromCharCode(65 + rowIndex)}</div>
            {columns.map((_, columnIndex) => {
              const search = row[columnIndex];
              return (
                <div
                  key={columnIndex}
                  style={search ? styles.searchWell : styles.emptyWell}
                  onDragOver={handleDragOver}
                  onDrop={(event) => handleDrop(event, rowIndex, columnIndex)}
                >
                  {search ? (
                    <Search
                      name={search.name}
                      metadata={search.metadata}
                      backgroundColor={
                        selectedCovariates
                          .map(covariate => covariateColors[search.metadata[covariate]])
                          .find(color => color !== undefined) || 'defaultColor'
                      }
                      onDragStart={onDragStart}
                      selectedCovariates={selectedCovariates}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

const cellWidth = 150;
const rowLabelWidth = 30;

const styles = {
  plate: {
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: '#f5f5f5',
  },
  plateHeading: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  columnLabels: {
    display: 'flex',
    gap: '10px',
  },
  columnLabel: {
    fontWeight: 'bold',
    textAlign: 'center' as const,
    width: `${cellWidth}px`,
    padding: '5px',
  },
  row: {
    display: 'flex',
    gap: '10px',
  },
  rowLabel: {
    fontWeight: 'bold',
    textAlign: 'center' as const,
    width: `${rowLabelWidth}px`,
    padding: '5px',
  },
  searchWell: {
    width: `${cellWidth}px`,
    minHeight: '40px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '5px',
  },
  emptyWell: {
    width: `${cellWidth}px`,
    minHeight: '40px',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '5px',
  },
  emptyCell: {
    width: `${rowLabelWidth}px`,
    padding: '5px',
  },
};

export default Plate;