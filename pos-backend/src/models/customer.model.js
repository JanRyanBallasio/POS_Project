module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Customer",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      points: {
        type: DataTypes.DECIMAL,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      name: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "Customer",
      timestamps: false,
      underscored: true,
    }
  );
};