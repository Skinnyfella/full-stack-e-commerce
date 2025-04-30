const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: DataTypes.TEXT,
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });

  // Define standard categories
  Category.STANDARD_CATEGORIES = [
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Clothing', slug: 'clothing' },
    { name: 'Home & Kitchen', slug: 'home-kitchen' },
    { name: 'Books', slug: 'books' },
    { name: 'Toys & Games', slug: 'toys-games' },
    { name: 'Sports & Outdoors', slug: 'sports-outdoors' },
    { name: 'Beauty & Personal Care', slug: 'beauty-personal-care' },
    { name: 'Health & Wellness', slug: 'health-wellness' },
    { name: 'Automotive', slug: 'automotive' },
    { name: 'Pet Supplies', slug: 'pet-supplies' }
  ];
  
  Category.associate = (models) => {
    Category.hasMany(models.Product);
  };

  // Add method to ensure standard categories exist
  Category.ensureStandardCategories = async () => {
    try {
      for (const category of Category.STANDARD_CATEGORIES) {
        await Category.findOrCreate({
          where: { slug: category.slug },
          defaults: category
        });
      }
    } catch (error) {
      console.error('Error ensuring standard categories:', error);
    }
  };
  
  return Category;
};