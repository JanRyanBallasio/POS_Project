module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Positions",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "Admin",
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "Positions",
      timestamps: false,
      underscored: true,
    }
  );
};