const calculateStatus = (inventory) => {
  if (!inventory || inventory === 0) return 'Out of Stock';
  if (inventory <= 20) return 'Low Stock';
  return 'In Stock';
};

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: DataTypes.TEXT,
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    stock_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.VIRTUAL,
      get() {
        return calculateStatus(this.stock_quantity);
      }
    },
    category_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    image_url: DataTypes.STRING,
    sku: {
      type: DataTypes.STRING,
      unique: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });
  
  Product.associate = (models) => {
    Product.belongsTo(models.Category);
    Product.hasMany(models.CartItem);
    Product.hasMany(models.OrderItem);
    Product.hasMany(models.WishlistItem);
    Product.hasMany(models.ProductReview);
  };
  
  return Product;
};