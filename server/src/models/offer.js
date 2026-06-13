const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Offer = sequelize.define('Offer', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    ngoId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    itemName: DataTypes.STRING,
    quantity: DataTypes.INTEGER,

    pickup: DataTypes.STRING,

    lat: DataTypes.FLOAT,
    lon: DataTypes.FLOAT,

    expiry: DataTypes.DATE,
    photo: DataTypes.STRING,

    acceptedBy: DataTypes.STRING,
    acceptedAt: DataTypes.DATE,

    status: {
      type: DataTypes.STRING,
      defaultValue: 'open'
    }
  });

  return Offer;
};