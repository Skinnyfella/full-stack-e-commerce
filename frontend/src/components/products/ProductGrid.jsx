import ProductCard from './ProductCard'
import EmptyState from '../common/EmptyState'
import { FiPackage } from 'react-icons/fi'
import { FixedSizeGrid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

function ProductGrid({ products = [], loading = false }) {
  const COLUMN_WIDTH = 300;
  const ROW_HEIGHT = 400;

  // Filter out any null or undefined products
  const validProducts = Array.isArray(products) 
    ? products.filter(product => product != null)
    : [];
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 h-48 w-full rounded-lg mb-4"></div>
            <div className="bg-gray-200 h-5 w-3/4 rounded mb-2"></div>
            <div className="bg-gray-200 h-4 w-1/2 rounded mb-2"></div>
            <div className="bg-gray-200 h-4 w-full rounded mb-4"></div>
            <div className="bg-gray-200 h-10 w-full rounded"></div>
          </div>
        ))}
      </div>
    )
  }
  
  if (validProducts.length === 0) {
    return (
      <EmptyState
        title="No products found"
        description="There are no products available with the current filters."
        icon={FiPackage}
      />
    )
  }

  const Cell = ({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * Math.floor(window.innerWidth / COLUMN_WIDTH) + columnIndex;
    const product = validProducts[index];
    
    if (!product) return null;
    
    return (
      <div style={style}>
        <ProductCard product={product} />
      </div>
    );
  };

  return (
    <div style={{ height: '80vh' }}>
      <AutoSizer>
        {({ height, width }) => {
          const columnCount = Math.floor(width / COLUMN_WIDTH);
          const rowCount = Math.ceil(validProducts.length / columnCount);
          
          return (
            <FixedSizeGrid
              columnCount={columnCount}
              columnWidth={COLUMN_WIDTH}
              height={height}
              rowCount={rowCount}
              rowHeight={ROW_HEIGHT}
              width={width}
            >
              {Cell}
            </FixedSizeGrid>
          );
        }}
      </AutoSizer>
    </div>
  );
}

export default ProductGrid