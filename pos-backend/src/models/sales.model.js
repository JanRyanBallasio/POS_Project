module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Sales",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      customer_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: "Customer",
          key: "id",
        },
      },
      total_purchase: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "Sales",
      timestamps: false,
      underscored: true,
    }
  );
};