const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserProfile extends Model {
    static associate(models) {
      // define associations here
      UserProfile.hasMany(models.Order, { foreignKey: 'user_id' });
      UserProfile.hasMany(models.CartItem, { foreignKey: 'user_id' });
      UserProfile.hasMany(models.ProductReview, { foreignKey: 'user_id' });
      UserProfile.hasMany(models.WishlistItem, { foreignKey: 'user_id' });
      UserProfile.hasMany(models.Address, { foreignKey: 'user_id' });
    }
  }
  
  UserProfile.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      first_name: {
        type: DataTypes.STRING(100),
      },
      last_name: {
        type: DataTypes.STRING(100),
      },
      role: {
        type: DataTypes.STRING(20),
        defaultValue: 'customer',
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
      modelName: 'UserProfile',
      tableName: 'user_profiles',
      timestamps: false, // We handle timestamps manually
    }
  );

  return UserProfile;
}; 