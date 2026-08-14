require('dotenv').config();

if (!process.env.APP_URL) {
  throw new Error("APP_URL is not set in .env. It is required for building asset URLs.");
}

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(require('path').join(__dirname, '../public'))); // Serve static files

// Import Routes
const authRoutes = require('./routes/auth');
const globalRoutes = require('./routes/global');
const productsRoutes = require('./routes/products');
const blogsRoutes = require('./routes/blogs');
const contactsRoutes = require('./routes/contacts');

// Proxy route to hide Supabase URL
app.get('/api/media/:folder/:filename', async (req, res) => {
  const { folder, filename } = req.params;
  const targetUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/tas_media/${folder}/${filename}`;
  try {
    const response = await fetch(targetUrl);
    if (!response.ok) return res.status(response.status).send('Image not found');
    const contentType = response.headers.get('content-type');
    if (contentType) res.set('Content-Type', contentType);
    const stream = require('stream');
    stream.Readable.fromWeb(response.body).pipe(res);
  } catch (error) {
    console.error('Proxy image error:', error);
    res.status(500).send('Error proxying image');
  }
});

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', require('./routes/admin')); // Protected Admin CRUD
app.use('/api', globalRoutes);
app.use('/api', productsRoutes); // the routes have /products in them already or /category
app.use('/api', blogsRoutes);
app.use('/api', contactsRoutes);

// Root Endpoint
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TAS API</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #111724;
          color: #eee;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
        .container {
          text-align: center;
          background-color: #16161b;
          padding: 3rem;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
          border-top: 4px solid #dd3333;
        }
        h1 {
          color: #dd3333;
          margin-bottom: 1rem;
          font-size: 2.5rem;
        }
        p {
          font-size: 1.2rem;
          color: #aaa;
        }
        .status {
          display: inline-block;
          margin-top: 1.5rem;
          padding: 0.5rem 1rem;
          background-color: rgba(221, 51, 51, 0.1);
          color: #dd3333;
          border-radius: 20px;
          font-weight: bold;
          font-size: 0.9rem;
          letter-spacing: 1px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAAAyCAYAAAAUYybjAAAACXBIWXMAAA7EAAAOxAGVKw4bAAALTElEQVRoge1aeViU1Rr/nTMrAwINMwiopEQ8SooLiYq5kVukdrV8UjH35arpvV4N89HEvHn1uqRmuVWaPZpLmuaea7hRaamJS4gLw7ANwzgzwDDrd+4fCAbMzDcMWNwnfzz8Mee857zv9zvnfc973u8DnuLJw3bzN2FB8vz+anaP/tm2NFhYM7OE6sHDx2U/3/5udos2hX+2PQ0WBTNmxWdHd7yikoUwlSyU/dXI8siFHmbcEeb0GbTAvH1PKnugbgeQJ21Xg4SQT0B/4Ehg8bCxW7nbdwf9NSl6DLdkFX76ubx4zoKjXJY6jvxFd9Pv4dINdUeO+1nWbDrMHjwlqgJOdxa7lk5zJk3fyt1TdQZ5SlQFnO6svJQPkh3Xbw/5o41p6KhBVv6cBe3sF356n4DVu7JcQ9EfnsBaDaZ601nFx1jWXap+NSmV3ct6yaPRYhFH/P3vuZo5YN2yHv6vJuYCQO6wcX9z/Hp9LkBvEmXQNUF8xx8kQxMvyzt0stf1IZxBe+a4zLLys1FclmooV6QPZ1z54hNKKJGKpYS53gw0KiK9yXff9qveXiVmFcxaOMRjogDAaqNMWxTptI8QgHHiSgNKS/zt99VxIIjjHmTBcekX2HbsNaradjkk7NBuV8jsmUfoC1F1Js5gMlLTlFl9yyYkb+Ry88MJKT+eqkdel1QxBhLXca6zrsot6ridTq3pN/9dV2M9AXn0B02RPzIejLDt2vetetDQO+pBb0w1pl0R88/gHDlmIzW9PibZeuD4UZZXEE68OJxIWGNV4ILk3c76KsnS/OejRKhyWnprqNcg5eQhT9PccfL8J4ax46/nzXinZ22n0ZQySl4btdh27oclxGL1yhQGDoLoVmtlL7Q0O+uvJMt+LX2KVxrqEQQETJUXZdv29amcxNffZflqj4KzyVBG7cOGjbGlXXoXnJcHE2OgQUE66eRRm1yJUAB4+MnnCuRr+jeYO5/ZQh2paUvUwyeuKdXpeQkr+/LLENvPV9YQO+e1SkYIBM823SAfkGh0JUMBwHzs+CCuuKRh1aU4Bnbp6tuGpHEpfKJlu/fNIXqjX13UkUa+ZsmokWvdyQhL9Aaq79bv5QZ3pSEAOMCednl+/ri300I2f3zMmZj55zRp4eAJI/m8gjGAEAY0VloJFWRCLNJS/0YcALCyMlBF0NmgSaPy3c0h9AsM4LIj2nb29pmeOKw2ak09u95w4tgLAX36m6p3P/xiTzynLZK7W2wGgDYNuUkH9J2jHD/6uLh1tFcngBAA6OQRY5m5rIobCuxcS9vKT9e7HR0UYBX1T3jTaR8VUIFIrKn4Sfr0OCKOjeniuHUnDA9ULzvUuSOgMwR6dPfM0zQvWbFhEoDV1bu4H3/hP8Ephc/kMYMVs/+RgVX/5dfnAkIAaDJnztka9iWNkfHaIPW5F/rpuv0uBTY+DgGNZ0zTAtA++vmNZuNn71m27ljLfr01gu8EYwC4LPVMlqv9iIQpqkRx4itrzBdCCMfBev++AkCGW0EeuAzqXGZ2IO9oqUTlreLgyRN0zS6eShJ06bCUT5aAgMvOCS9IWRhfvc9RXFLImywwBsehE1/nvjV2UJm+mLfg6QouB5JGMgXvaLPVbUD0BCFfbZmX12/Ii9ytzN7uNgjhGGzptwYCOP/7dmHb6HTbjd/g1p0JAVeoC2N7j32rvdRTld2xx3k08s2kAnEh85WqSdTzKnnH9iqfoUO0ridxQxZnKuVNJTjCSvhk+CBQKrmChR9Ms6jUN2Ayu151QkCMxhoHUdCYSRcLTp3P5TSFYe7csaKHqXLDAYwAAEdF5/HvoZFKkB3VPhdBiv2ihK5rQhYvrOGyLglhnmTC9VTF8ZkxN5OEKY8xvgmLTTWCubhbeyuNilhSNwsIiNkKps4P465dn2rd8MUNdY9XVpbu2FPlnuqSLIEvf45HOVanRLAC/nIBRxXKw3yBmjnsweyn6zUOHsWKxRsELSNP1sfqERCgzCJ0XLryr4eLl5/RbPq8Mna7djWTxa3/AgB8fcLrbN0jiGJj0vkeljMUoyxfXWOBJDGt7ZJZfx9Ko1p8z7s7PQQBAXc3K97yyWd7S3+8Xp5iuZSOCOMlixUXR9SLZQCEocEmviycAHAIhU7jmjJppF65dnk/QefYpfCReld2qKGQgN25n6BfMH8G4IYsny6d1HxrxOmN4fqNm0Pqwy5LwUMZ3FQvAQBiEWQCictDRdLtJWvT04fniqeNaUOiIzdBHlguywDeuV2CwHErc57p7Fl/12RFRmRQeYDbyiWx2FB24NAAL62oAu7HSy35snkS6G9msa1rXHmqI2RRSkazy+cmB235OFSUmDCQRD+3GhHhF0mwwgwwMLBahTem1cn1q9YOcJ06xHe2Qya7CZ0hxt1EjgeqsXklhs2hfgFe10eKjWZq6N5rIBjceyIHkyXjlhCAR+Vn3z4vlwA49Ogf9qtXxNqd+2LsaZcSmPbhK9AWdWfGYsp/5WLgMrO7udxZMv8ADn6+5131V9qfnReP6e8meGK8K5StWRXOqQsS+QofTFMo1y9aPsNbPcJ27a0hSxddbpp6dFmzGz/0ki6YGSqM7/ghRO6TegICUEG028RT2Oq5o7yni80B69kL67Vbd/Jfj5ygqMxErfuPrmEmkwfXEAL71RvvF8ye73a3ewrltKmasFMHZ9GI8AN8z8kMBj+3ZD0zcexJqpDr3M5CCEieJrJs5eq9hu3bap13WYaPS+FuZw7ytJ5GDCVS276Dews2bAqurS6XcwqF6YRnTzAHJ3ZLlrRnDzMNa/wVfzQk4DKzEowLV6blJb9X47LrDEUHTwSqu/XdaDt9bkGtTioCOPIKIq2rNp3RLF/l/DVcLcEs5hjGd7iIRSbe5dQsWxlhXrHuN5R44iYAJCKONmt6BK1b7giY/8/djaJj7ABQtONwoDXnXhjuZDTlrtzoxeXnT2CFOkVdvqUgAX5GGtlitWBg7x0hycm3K9pz129sySwm/p1XUgqcOP+q49rNZFhtruUYQFo0O+CRpTldEtY4rt2qXWD180HTU/uVtE2MFgDyB745ynIydSsBA0j9lfsZGGjUc6ubXb0ws6Itu3n0FqYpGsM/FiCMuK9YPJIUtmm11COrxRNHpxDFM7WsXRGQKjkvKz9V6pGoCi01GylXnm+7/yegHhBVDmF0VKpHlivHjdYL+3Z/CzKpvb7uXv9PIEqFVpo0/LTHyxy8bPl5QXzcRCIWPUm7HkMiBvujdPGAhio2+ffuafWYLIG8EdfkwK4vRN27joeP5Il8+VIJCtAusfOEHdqs+NP3sTxQK5owbtUjs2qH0AM7N4teS+xHguS5YE/AKUVC0K6dUoJ3fLhUuXzxHEFs6y9rW6eivrI6B0YGBiYSQPRS5ynBE0ZpAS/IAoDQzetOS5OntBG82HYz8ZFy9UMZA1EGaYW9uw+W7N76gTigOSeObccpt60fL+gRvwhSscd6GJj37/HLxwNCCnGn2HmhO7fsqWj3egWU09/WNTn33Xjp7KltBW2jN5OKcog3hgUH6YSdOiyVrFjUKmzv9v3KgMeXcsmzkfYmR79JESW90U0Q2eIiBE/4zTkD6DMBRmHPrtMsR3dVefPk9WuhCgTPfScdwPii705Mt2zf1d9x/XYvYrbEMZEggqO08qFZQICdhTbmCGCn4HRMLM6Ej+SyKC421XfsyGP+nePMOHPEpZ7QtSsvFhUbutmXrOhsP31hqMNojIfNHgk7k1GFskoMJQqlFRaH08+GXIFwnBkiwWUa3uygz+ih2+RJSToIvq4tHd7B+rC4xq61qNRiS6GuzgtUHaX6qt+NGktq6uaD3tTAPox5iqd4Cmf4HyyUYtHjaYADAAAAAElFTkSuQmCC" alt="TAS Logo" style="height: 60px; margin-bottom: 1rem;" />
        <p>The backend services are up and running smoothly.</p>
        <div class="status">● System Online</div>
      </div>
    </body>
    </html>
  `);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
