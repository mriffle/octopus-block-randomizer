import React, { DragEvent } from 'react';

interface SearchProps {
  name: string;
  metadata: { [key: string]: string };
  backgroundColor?: string;
  onDragStart: (event: DragEvent<HTMLDivElement>, searchName: string) => void;
}

const Search: React.FC<SearchProps> = ({ name, metadata, backgroundColor, onDragStart }) => {
  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    onDragStart(event, name);
  };

  return (
    <div style={{ ...styles.card, backgroundColor }} draggable onDragStart={handleDragStart}>
      <h3 style={styles.title}>{name}</h3>
      <hr style={styles.divider} />
      <ul style={styles.metadata}>
        {Object.entries(metadata).map(([key, value]) => (
          <li key={key}>
            {key}: {value}
          </li>
        ))}
      </ul>
    </div>
  );
};

const styles = {
  card: {
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    padding: '16px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#333',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #eee',
    margin: '12px 0',
  },
  metadata: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '0',
  },
};

export default Search;