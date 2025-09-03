const sequelize = require("../../config/db");
const { Sequelize, DataTypes } = require("sequelize");

const Category = require("./categories.model")(sequelize, DataTypes);
const Product = require("./products.model")(sequelize, DataTypes);
const StockTransaction = require("./stockTransaction.model")(sequelize, DataTypes);
const StockItems = require("./stockItems.model")(sequelize, DataTypes);
const Sales = require("./sales.model")(sequelize, DataTypes);
const SaleItems = require("./salesItems.model")(sequelize, DataTypes);
const Customer = require("./customer.model")(sequelize, DataTypes);
const Positions = require("./positions.model")(sequelize, DataTypes);
const RefreshToken = require('./token.model.js')(sequelize, DataTypes);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.Category = Category;
db.Product = Product;
db.StockTransaction = StockTransaction;
db.StockItems = StockItems;
db.Sales = Sales;
db.SaleItems = SaleItems;
db.Customer = Customer;
db.Positions = Positions;
db.RefreshToken = RefreshToken;

Category.hasMany(Product, { foreignKey: "category_id" });
Product.belongsTo(Category, { foreignKey: "category_id" });

Product.hasMany(StockItems, { foreignKey: "product_id" });
StockItems.belongsTo(Product, { foreignKey: "product_id" });

StockTransaction.hasMany(StockItems, { foreignKey: "stock_transaction_id" });
StockItems.belongsTo(StockTransaction, { foreignKey: "stock_transaction_id" });

Product.hasMany(SaleItems, { foreignKey: "product_id" });
SaleItems.belongsTo(Product, { foreignKey: "product_id" });

Sales.hasMany(SaleItems, { foreignKey: "sale_id" });
SaleItems.belongsTo(Sales, { foreignKey: "sale_id" });

Customer.hasMany(Sales, { foreignKey: "customer_id" });
Sales.belongsTo(Customer, { foreignKey: "customer_id" });

db.RefreshToken.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });
db.User.hasMany(db.RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens' });

module.exports = db;