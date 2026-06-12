const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const NGO = sequelize.define('NGO', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
    verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    address: { type: DataTypes.STRING },
    lat: { type: DataTypes.FLOAT },
    lng: { type: DataTypes.FLOAT },
    contact_email: { type: DataTypes.STRING },
    contact_phone: { type: DataTypes.STRING },
    image_url: { type: DataTypes.STRING }
  });

  return NGO;
};
