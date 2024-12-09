const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Tour = require('./../models/tourModel');
dotenv.config({ path: './config.env' });

const dbUri = process.env.DB_URI.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
// connect the Database

mongoose.connect(dbUri).then(() => {
  console.log('Database connected successfully...🤩🤩');
});

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/data/tours-simple.json`, 'utf-8')
);

const deleteData = async function () {
  try {
    await Tour.deleteMany();
    console.log('Data deleted successfully ');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

const importData = async function () {
  try {
    await Tour.create(tours);
    console.log('Data imported successfully ');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv.at(-1) === '--import') {
  importData();
} else if (process.argv.at(-1) === '--delete') {
  deleteData();
}
