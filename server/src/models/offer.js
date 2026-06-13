const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Offer = sequelize.define('Offer', {
    id: { type: DataTypes.STRING, primaryKey: true },
    userId: { type: DataTypes.STRING },
    itemName: { type: DataTypes.STRING },
    quantity: { type: DataTypes.INTEGER },
    pickup: { type: DataTypes.STRING },
    lat: { type: DataTypes.FLOAT },
    lon: { type: DataTypes.FLOAT },
    expiry: { type: DataTypes.DATE },
    photo: { type: DataTypes.STRING },
    acceptedBy: { type: DataTypes.STRING },
    acceptedAt: { type: DataTypes.DATE },
    status: { type: DataTypes.STRING, defaultValue: 'open' }
  });

  return Offer;
};
