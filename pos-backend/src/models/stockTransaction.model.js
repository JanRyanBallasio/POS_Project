module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "StockTransaction",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      company_name: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      total: {
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
      tableName: "StockTransaction",
      timestamps: false,
      underscored: true,
    }
  );
};