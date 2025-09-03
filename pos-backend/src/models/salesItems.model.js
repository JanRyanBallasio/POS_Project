module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "SaleItems",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      sale_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: "Sales",
          key: "id",
        },
      },
      product_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: "Products",
          key: "id",
        },
      },
      quantity: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
    },
    {
      tableName: "SaleItems",
      timestamps: false,
      underscored: true,
    }
  );
};