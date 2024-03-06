import React, { useState, useEffect, DragEvent } from 'react';
import Papa from 'papaparse';
import Block from './components/Block';
import { SearchData } from './types';

const App: React.FC = () => {
  const [searches, setSearches] = useState<SearchData[]>([]);
  const [numBlocks, setNumBlocks] = useState<number>(1);
  const [primaryCovariate, setPrimaryCovariate] = useState<string>('');
  const [covariateColors, setCovariateColors] = useState<{ [key: string]: string }>({});
  const [randomizedBlocks, setRandomizedBlocks] = useState<SearchData[][]>([]);
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

  const handleNumBlocksChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setNumBlocks(Number(event.target.value));
  };

  const handlePrimaryCovariateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setPrimaryCovariate(event.target.value);
  };

  useEffect(() => {
    setRandomizedBlocks(randomizeSearches());
  }, [primaryCovariate, searches, numBlocks]);

  useEffect(() => {
    generateCovariateColors();
  }, [primaryCovariate, searches]);

  const generateCovariateColors = () => {
    if (primaryCovariate && searches.length > 0) {
      const covariateValues = new Set(searches.map((search) => search.metadata[primaryCovariate]));
      const colors = ['#FFE4E1', '#E0FFFF', '#F0FFF0', '#FFF0F5', '#F5F5DC', '#F0E68C', '#E6E6FA', '#FFE4B5'];

      const covariateColorsMap: { [key: string]: string } = {};
      let colorIndex = 0;

      covariateValues.forEach((value) => {
        covariateColorsMap[value] = colors[colorIndex];
        colorIndex = (colorIndex + 1) % colors.length;
      });

      setCovariateColors(covariateColorsMap);
    }
  };

  const randomizeSearches = () => {
    if (primaryCovariate) {
      const covariateValues = new Set(searches.map((search) => search.metadata[primaryCovariate]));
      const numCovariateValues = covariateValues.size;
      const numSearchesPerBlock = Math.floor(searches.length / numBlocks);
      const remainingSearches = searches.length % numBlocks;

      const randomized: SearchData[][] = Array.from({ length: numBlocks }, () => []);
      const remainingSearchesByCovariate: { [key: string]: SearchData[] } = {};

      covariateValues.forEach((value) => {
        remainingSearchesByCovariate[value] = searches.filter(
          (search) => search.metadata[primaryCovariate] === value
        );
      });

      // Distribute the searches evenly among the blocks based on covariate values
      for (let i = 0; i < numSearchesPerBlock; i++) {
        covariateValues.forEach((value) => {
          for (let j = 0; j < numBlocks; j++) {
            if (remainingSearchesByCovariate[value].length > 0) {
              const randomIndex = Math.floor(Math.random() * remainingSearchesByCovariate[value].length);
              const search = remainingSearchesByCovariate[value].splice(randomIndex, 1)[0];
              randomized[j].push(search);
            }
          }
        });
      }

      // Distribute the remaining searches randomly
      for (let i = 0; i < remainingSearches; i++) {
        const randomBlockIndex = Math.floor(Math.random() * numBlocks);
        const randomCovariateValue = Array.from(covariateValues)[Math.floor(Math.random() * numCovariateValues)];
        if (remainingSearchesByCovariate[randomCovariateValue].length > 0) {
          const randomIndex = Math.floor(Math.random() * remainingSearchesByCovariate[randomCovariateValue].length);
          const search = remainingSearchesByCovariate[randomCovariateValue].splice(randomIndex, 1)[0];
          randomized[randomBlockIndex].push(search);
        }
      }

      return randomized;
    }
    return [];
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>, searchName: string) => {
    setDraggedSearch(searchName);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, blockIndex: number) => {
    event.preventDefault();
    if (draggedSearch) {
      const updatedRandomizedBlocks = [...randomizedBlocks];

      // Find the search in the randomized blocks
      let movedSearch: SearchData | null = null;
      updatedRandomizedBlocks.forEach((block) => {
        const searchIndex = block.findIndex((search) => search.name === draggedSearch);
        if (searchIndex !== -1) {
          movedSearch = block.splice(searchIndex, 1)[0];
        }
      });

      if (movedSearch) {
        // Add the search to the new block
        updatedRandomizedBlocks[blockIndex].push(movedSearch);
        setRandomizedBlocks(updatedRandomizedBlocks);
      }
    }
  };

  const downloadCSV = () => {
    const csv = Papa.unparse(
      searches.map((search, index) => ({
        'search name': search.name,
        age: search.metadata.age,
        sex: search.metadata.sex,
        treatment: search.metadata.treatment,
        batch: search.metadata.batch,
        Block: `Block ${getBlockNumber(search.name) + 1}`,
      })),
      { header: true }
    );

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'randomized_searches.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBlockNumber = (searchName: string) => {
    for (let i = 0; i < randomizedBlocks.length; i++) {
      const block = randomizedBlocks[i];
      if (block.find((search) => search.name === searchName)) {
        return i;
      }
    }
    return -1;
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Batch Randomization</h1>
      <input type="file" accept=".csv" onChange={handleFileUpload} style={styles.fileInput} />
      <div style={styles.blockSelection}>
        <label htmlFor="numBlocks">Number of Blocks:</label>
        <select id="numBlocks" value={numBlocks} onChange={handleNumBlocksChange}>
          {[...Array(10)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
      </div>
      <div style={styles.covariateSelection}>
        <label htmlFor="primaryCovariate">Primary Covariate:</label>
        <select id="primaryCovariate" value={primaryCovariate} onChange={handlePrimaryCovariateChange}>
          <option value="">Select a covariate</option>
          {searches.length > 0 &&
            Object.keys(searches[0].metadata).map((covariate) => (
              <option key={covariate} value={covariate}>
                {covariate}
              </option>
            ))}
        </select>
      </div>
      <div style={styles.blocksContainer}>
        {randomizedBlocks.map((block, blockIndex) => (
          <Block
            key={blockIndex}
            blockIndex={blockIndex}
            searches={block}
            covariateColors={covariateColors}
            primaryCovariate={primaryCovariate}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        ))}
      </div>
      {primaryCovariate && numBlocks > 1 && (
        <button onClick={downloadCSV} style={styles.downloadButton}>
          Download CSV
        </button>
      )}
    </div>
  );
};

const styles = {
  container: {
    width: '80%',
    maxWidth: '1600px',
    margin: '0 auto',
    padding: '20px',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
  },
  fileInput: {
    marginBottom: '20px',
  },
  blockSelection: {
    marginBottom: '20px',
  },
  covariateSelection: {
    marginBottom: '20px',
  },
  blocksContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
    gap: '20px',
  },
  downloadButton: {
    marginTop: '20px',
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default App;