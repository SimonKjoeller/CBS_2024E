DROP TABLE IF EXISTS customers;
CREATE TABLE customers ( 
    username TEXT, 
    email TEXT,
    password TEXT
);

DROP TABLE IF EXISTS products;
CREATE TABLE products (
    productName TEXT,
    imgsrc TEXT
);