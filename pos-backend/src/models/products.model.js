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
      unit: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: 'pcs', // Change to lowercase
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
      is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      deleted_at: {
        type: DataTypes.DATE,
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