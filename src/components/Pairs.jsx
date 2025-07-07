// Re-export the Pairs component from PairContainer.jsx
export { default } from './PairContainer';

// Placeholder component to apply the marginTop change
function PairContainer() {
  return (
    <div className="container">
      <div className="flex items-center justify-center" style={{ height: '200px', marginTop: '-15px' }}>
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 text-white text-lg font-bold">
          +
        </div>
      </div>
    </div>
  );
}

export default PairContainer;