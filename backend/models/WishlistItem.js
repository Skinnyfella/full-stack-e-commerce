const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class WishlistItem extends Model {
    static associate(models) {
      // define associations here
      WishlistItem.belongsTo(models.UserProfile, { foreignKey: 'user_id' });
      WishlistItem.belongsTo(models.Product, { foreignKey: 'product_id' });
    }
  }
  
  WishlistItem.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'user_profiles',
          key: 'id',
        },
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'WishlistItem',
      tableName: 'wishlist_items',
      timestamps: false, // We handle timestamps manually
      indexes: [
        {
          unique: true,
          fields: ['user_id', 'product_id']
        }
      ]
    }
  );

  return WishlistItem;
}; 