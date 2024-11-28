const express = require("express");
const shakeRoutes = express.Router();
const cookieParser = require("cookie-parser");
const db = require("../db");
require('dotenv').config();
const checkAuth = require("../checkAuth");

shakeRoutes.use(express.json());
shakeRoutes.use(cookieParser());

const secretKey = process.env.JWT_SECRET; // Bruger miljøvariabel til sikkerhed


// Endpoint to fetch all products
shakeRoutes.get('/products', checkAuth, (req, res) => {
    const query = `SELECT * FROM products`;
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to fetch products' });
        } else {
            res.json(rows); // Send products as JSON
        }
    });
});


// Endpoint to place an order
shakeRoutes.post('/order', checkAuth, (req, res) => {
    console.log('Incoming Order Request:', req.body);

    console.log("est")

    const user_id = req.user?.user_id; // Extract userId from token
    const { items } = req.body; // Get the order items from the request body

    // Validate input
    if (!user_id) {
        console.error('User ID is missing or invalid');
        return res.status(400).json({ error: 'User ID is missing or invalid' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
        console.error('Invalid or empty order items');
        return res.status(400).json({ error: 'Invalid or empty order items' });
    }

    // Start database transaction
    db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).json({ error: 'Database transaction error' });
        }

        // Insert a new order into the orders table
        const insertOrderQuery = `INSERT INTO orders (user_id) VALUES (?)`;
        db.run(insertOrderQuery, [user_id], function (err) {
            if (err) {
                console.error('Error creating order:', err);
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Failed to create order' });
            }

            const order_id = this.lastID; // Get the auto-generated order ID
            console.log('New Order ID:', order_id);

            // Insert the order items into the order_items table
            const insertOrderItemsQuery = `
                INSERT INTO order_items (order_id, product_id, quantity)
                VALUES ${items.map(() => '(?, ?, ?)').join(', ')}
            `;
            const orderItemsParams = items.flatMap(item => [order_id, item.product_id, item.quantity]);

            db.run(insertOrderItemsQuery, orderItemsParams, function (err) {
                if (err) {
                    console.error('Error adding order items:', err);
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Failed to add order items' });
                }

                // Commit the transaction
                db.run('COMMIT', (err) => {
                    if (err) {
                        console.error('Error committing transaction:', err);
                        return res.status(500).json({ error: 'Failed to commit transaction' });
                    }

                    // Successfully inserted order and order items
                    console.log('Order successfully committed to database');
                    return res.status(201).json({ message: 'Order created successfully', order_id });
                });
            });
        });
    });
});

module.exports = shakeRoutes;