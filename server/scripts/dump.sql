-- Customers table
INSERT INTO users
    (username, email, email_iv, password, phone, verified)
VALUES
    ('anders', 'ca0aa743a48746c14836b82886ac1388e28a4528d0be04b81e56cb302bcfe647', 'b2bed30607c6cee07b1334c0e54f90c8', '$2b$10$pXQSGfwSRTFt40i6Oziz2uEdiy5iqor9O0IKZvXzrD/mmx7A7EA.W', 1, 1);
INSERT INTO users
    (username, email, email_iv, password, phone, verified)
VALUES
    ('hjalte', '0ffcc96523c11c404af5817836a18651431206ab8ee0f20cba2e5bad52fbb5c8', 'b2bed30607c6cee07b1334c0e54f90c8', '$2b$10$qOVztOwrJ8dyUXwQpOL8EOmHLVbvUHOm1HEptDNUL5tEwZzucQ4Py', 2, 1);
INSERT INTO users
    (username, email, email_iv, password, phone, verified)
VALUES
    ('simon', '4f7883803dc713fefdadc4426bb7c71f', 'b2bed30607c6cee07b1334c0e54f90c8','$2b$10$L1zB6LDc9KnkVjxUGUp55OzCun.IDDrlKcV3Fsl/SeG.Xo91NZvvC', 3, 1);



-- Product table
INSERT INTO products
    (name, price, imgsrc)
VALUES
    ('Orange Juice', 45, 'orange_juice.jpg');
INSERT INTO products
    (name, price, imgsrc)
VALUES
    ('Apple Juice', 45, 'apple_juice.jpg');
INSERT INTO products
    (name, price, imgsrc)
VALUES
    ('Grape Juice', 45, 'grapes.jpg');
INSERT INTO products
    (name, price, imgsrc)
VALUES
    ('Pineapple Juice', 45, 'pineapple_juice.jpg');
INSERT INTO products
    (name, price, imgsrc)
VALUES
    ('Espresso', 35, 'espresso.jpg');
INSERT INTO products
    (name, price, imgsrc)
VALUES
    ('Cappuccino', 35,'cappuccino.jpg');
