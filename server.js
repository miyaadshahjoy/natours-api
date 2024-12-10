const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION. Shutting down....💥');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const PORT = process.env.PORT || 3000;

const dbUri = process.env.DB_URI.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// connect the Database

mongoose.connect(dbUri).then((conn) => {
  console.log('Database connected successfully...🤩🤩');
});

// createing a Document
/*
const testTour = new Tour({
  name: 'The Park Camper',
  price: 497,
});

testTour
  .save()
  .then((doc) => console.log(doc))
  .catch((err) => console.log('Error... 💥💥', err));
  */

// connect the server
const server = app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION. Shutting down....💥');
  server.close(() => {
    process.exit(1);
  });
});
