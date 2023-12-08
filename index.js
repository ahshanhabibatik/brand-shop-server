const express = require('express')
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tqyfr7x.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const productCollection = client.db('productDB').collection('product');
        const addToCartCollection = client.db('productDB').collection('AddToCart');


        app.get('/product', async (req, res) => {
            const { category } = req.query;

            // If the 'category' query parameter is provided, filter by category
            if (category) {
                const cursor = productCollection.find({ category: category });
                const result = await cursor.toArray();
                res.send(result);
            } else {
                // If 'category' is not provided, return all products
                const cursor = productCollection.find();
                const result = await cursor.toArray();
                res.send(result);
            }
        });

        // update product

        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await productCollection.findOne(query);
            res.send(result)

        })





        app.post('/cart', async (req, res) => {
            const newItem = req.body;
            console.log(newItem);


            const existingItem = await addToCartCollection.findOne({ _id: newItem._id });
            if (existingItem) {

                res.status(400).json({ error: 'Duplicate Item', message: 'This item is already in your cart.' });
            } else {

                const result = await addToCartCollection.insertOne(newItem);
                res.json({ success: true, message: 'Item added to cart successfully.' });
            }
        });


        // Add this route to your Express server
        app.get('/cart', async (req, res) => {
            // Retrieve the cart items from the addToCartCollection in MongoDB
            const cursor = addToCartCollection.find();
            const cart = await cursor.toArray();
            res.send(cart);
        });


        app.delete('/deleteCart/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)

            const query = { _id: new ObjectId(id) };

            const result = await addToCartCollection.deleteOne(query);
            res.send(result);
            console.log(result);


        });


        app.post('/product', async (req, res) => {
            const newProduct = req.body;
            const name = newProduct.name; // Change this to match your product's unique identifier

            // Check if a product with the same name already exists
            const existingProduct = await productCollection.findOne({ name });

            if (existingProduct) {
                // If a product with the same name exists, return an error response
                res.status(400).json({ error: 'Duplicate Product', message: 'This product is already in the database.' });
            } else {
                // If the product doesn't exist, add it to the database
                const result = await productCollection.insertOne(newProduct);
                res.json(result);
            }
        });


        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await productCollection.deleteOne(query);
            res.send(result)
        })

        app.put('/product/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updateProduct = req.body;
            const product = {
                $set: {


                    name: updateProduct.name,
                    quantity: updateProduct.quantity,
                    price: updateProduct.price,
                    company: updateProduct.company,
                    color: updateProduct.color,
                    details: updateProduct.details,
                    photo: updateProduct.photo,
                    category: updateProduct.category

                }
            }
            const result = await productCollection.updateOne(filter, product, options);

            res.send(result);
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


// middleware

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('brand shop server is running ')
})

app.listen(port, () => {
    console.log(`Brand shop server is running on port ${port}`)
})