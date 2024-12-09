const dotenv = require('dotenv');
const mongoose = require('mongoose');
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
app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});
