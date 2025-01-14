// utils/documentHelpers.js
const fs = require('fs');
const path = require('path');

function getDate() {
  const date = new Date();
  const day = date.getDate();
  const monthNames = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return [day, month, year];
}

module.exports = {
  getDate
};
