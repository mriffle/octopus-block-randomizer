import React, { DragEvent } from 'react';
import Search from './Search';
import { SearchData } from '../types';

interface BlockProps {
  blockIndex: number;
  searches: SearchData[];
  covariateColors: { [key: string]: string };
  primaryCovariate: string;
  onDragStart: (event: DragEvent<HTMLDivElement>, searchName: string) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>, blockIndex: number) => void;
}

const Block: React.FC<BlockProps> = ({ blockIndex, searches, covariateColors, primaryCovariate, onDragStart, onDragOver, onDrop }) => {
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    onDragOver(event);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    onDrop(event, blockIndex);
  };

  return (
    <div style={styles.block} onDragOver={handleDragOver} onDrop={handleDrop}>
      <h2 style={styles.blockHeading}>Block {blockIndex + 1}</h2>
      <div style={styles.grid}>
        {searches.map((search, searchIndex) => (
          <Search
            key={`${blockIndex}-${searchIndex}`}
            name={search.name}
            metadata={search.metadata}
            backgroundColor={covariateColors[search.metadata[primaryCovariate]]}
            onDragStart={onDragStart}
          />
        ))}
      </div>
    </div>
  );
};

const styles = {
  block: {
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: '#f5f5f5',
  },
  blockHeading: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '10px',
  },
};

export default Block;