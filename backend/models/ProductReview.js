const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProductReview extends Model {
    static associate(models) {
      // define associations here
      ProductReview.belongsTo(models.Product, { foreignKey: 'product_id' });
      ProductReview.belongsTo(models.UserProfile, { foreignKey: 'user_id' });
    }
  }
  
  ProductReview.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'user_profiles',
          key: 'id',
        },
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      comment: {
        type: DataTypes.TEXT,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'ProductReview',
      tableName: 'product_reviews',
      timestamps: false, // We handle timestamps manually
    }
  );

  return ProductReview;
}; 