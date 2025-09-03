
module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        "StockItems",
        {
            id: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true,
            },
            product_id: {
                type: DataTypes.BIGINT,
                allowNull: true,
                references: {
                    model: "Products",
                    key: "id",
                },
            },
            purchased_pri: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            quantity: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            stock_transaction_id: {
                type: DataTypes.BIGINT,
                allowNull: true,
                references: {
                    model: "StockTransaction",
                    key: "id",
                },
            },
        },
        {
            tableName: "StockItems",
            timestamps: false,
            underscored: true,
        }
    );
};
