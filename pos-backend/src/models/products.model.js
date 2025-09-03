module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Products",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Categories",
          key: "id",
        },
      },
      price: {
        type: DataTypes.DECIMAL,
        allowNull: true,
      },
      quantity: {
        type: DataTypes.DECIMAL,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      barcode: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "Products",
      timestamps: false,
      underscored: true,
    }
  );
};