import React, { useState, useEffect, DragEvent, useCallback  } from 'react';
import Papa from 'papaparse';
import Plate from './components/Plate';
import { SearchData } from './types';
import { randomizeSearches, downloadCSV } from './utils';

const App: React.FC = () => {
  const [searches, setSearches] = useState<SearchData[]>([]);
  const [selectedCovariates, setSelectedCovariates] = useState<string[]>([]);
  const [covariateColors, setCovariateColors] = useState<{ [key: string]: string }>({});
  const [randomizedPlates, setRandomizedPlates] = useState<(SearchData | undefined)[][][]>([]);
  const [draggedSearch, setDraggedSearch] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const parsedSearches: SearchData[] = results.data
            .filter((row: any) => row['search name'])
            .map((row: any) => ({
              name: row['search name'],
              metadata: Object.keys(row)
                .filter((key) => key !== 'search name')
                .reduce((acc, key) => ({ ...acc, [key.trim()]: row[key] }), {}),
            }));
          setSearches(parsedSearches);
        },
      });
    }
  };

  const handleDownloadCSV = () => {
    downloadCSV(searches, randomizedPlates);
  };

  const handleCovariateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(event.target.selectedOptions, (option) => option.value);
    setSelectedCovariates(selectedOptions);
  };

  useEffect(() => {
    setRandomizedPlates(randomizeSearches(searches, selectedCovariates));
  }, [selectedCovariates, searches]);

  const generateCovariateColors = useCallback(() => {
    if (selectedCovariates.length > 0 && searches.length > 0) {
      const covariateValues = new Set(
        selectedCovariates.flatMap((covariate) =>
          searches.map((search) => search.metadata[covariate])
        )
      );
      const colors = ['#FFE4E1', '#E0FFFF', '#F0FFF0', '#FFF0F5', '#F5F5DC', '#F0E68C', '#E6E6FA', '#FFE4B5'];

      const covariateColorsMap: { [key: string]: string } = {};
      let colorIndex = 0;

      covariateValues.forEach((value) => {
        covariateColorsMap[value] = colors[colorIndex % colors.length];
        colorIndex += 1;
      });

      setCovariateColors(covariateColorsMap);
    }
  }, [selectedCovariates, searches]); // Dependencies for useCallback

  useEffect(() => {
    generateCovariateColors();
  }, [generateCovariateColors]); // generateCovariateColors is now a dependency

  const handleDragStart = (event: DragEvent<HTMLDivElement>, searchName: string) => {
    setDraggedSearch(searchName);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, plateIndex: number, rowIndex: number, columnIndex: number) => {
    event.preventDefault();
    if (draggedSearch) {
      const updatedRandomizedPlates = [...randomizedPlates];
      const draggedSearchData = searches.find((search) => search.name === draggedSearch);
      const targetSearchData = updatedRandomizedPlates[plateIndex][rowIndex][columnIndex];

      if (draggedSearchData) {
        // Find the current position of the dragged search
        let draggedSearchPlateIndex = -1;
        let draggedSearchRowIndex = -1;
        let draggedSearchColumnIndex = -1;

        updatedRandomizedPlates.forEach((plate, pIndex) => {
          plate.forEach((row, rIndex) => {
            const index = row.findIndex((s) => s?.name === draggedSearch);
            if (index !== -1) {
              draggedSearchPlateIndex = pIndex;
              draggedSearchRowIndex = rIndex;
              draggedSearchColumnIndex = index;
            }
          });
        });

        // Swap the positions of the dragged search and the target search
        if (targetSearchData) {
          updatedRandomizedPlates[draggedSearchPlateIndex][draggedSearchRowIndex][draggedSearchColumnIndex] = targetSearchData;
        } else {
          updatedRandomizedPlates[draggedSearchPlateIndex][draggedSearchRowIndex][draggedSearchColumnIndex] = undefined;
        }

        updatedRandomizedPlates[plateIndex][rowIndex][columnIndex] = draggedSearchData;
        setRandomizedPlates(updatedRandomizedPlates);
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.heading}>Block Randomization</h1>
        <input type="file" accept=".csv" onChange={handleFileUpload} style={styles.fileInput} />
        <div style={styles.covariateSelection}>
          <label htmlFor="covariates">Select Covariates:</label>
          <select id="covariates" multiple value={selectedCovariates} onChange={handleCovariateChange}>
            {searches.length > 0 &&
              Object.keys(searches[0].metadata).map((covariate) => (
                <option key={covariate} value={covariate}>
                  {covariate}
                </option>
              ))}
          </select>
        </div>
        <div style={styles.platesContainer}>
          {randomizedPlates.map((plate, plateIndex) => (
            <div key={plateIndex} style={styles.plateWrapper}>
              <Plate
                plateIndex={plateIndex}
                rows={plate}
                covariateColors={covariateColors}
                selectedCovariates={selectedCovariates}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={(event, rowIndex, columnIndex) => handleDrop(event, plateIndex, rowIndex, columnIndex)}
              />
            </div>
          ))}
        </div>
        {selectedCovariates.length > 0 && randomizedPlates.length > 0 && (
          <button onClick={handleDownloadCSV} style={styles.downloadButton}>
            Download CSV
          </button>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f0f0',
    padding: '20px',
    boxSizing: 'border-box' as const,
  },
  content: {
    width: '100%',
    maxWidth: '1600px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    padding: '20px',
    boxSizing: 'border-box' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
  },
  fileInput: {
    marginBottom: '20px',
  },
  covariateSelection: {
    marginBottom: '20px',
  },
  platesContainer: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
    gap: '20px',
    width: '100%',
  },
  plateWrapper: {
    margin: '10px',
  },
  downloadButton: {
    marginTop: '20px',
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default App;