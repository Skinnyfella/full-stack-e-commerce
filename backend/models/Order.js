const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      // define associations here
      Order.belongsTo(models.UserProfile, { foreignKey: 'user_id' });
      Order.belongsTo(models.Address, { foreignKey: 'shipping_address_id', as: 'shippingAddress' });
      Order.hasMany(models.OrderItem, { foreignKey: 'order_id' });
    }
  }
  
  Order.init(
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
      status: {
        type: DataTypes.STRING(50),
        defaultValue: 'pending',
      },
      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      shipping_address_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'addresses',
          key: 'id',
        },
      },
      payment_intent_id: {
        type: DataTypes.STRING(255),
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
      modelName: 'Order',
      tableName: 'orders',
      timestamps: false, // We handle timestamps manually
    }
  );

  return Order;
}; 