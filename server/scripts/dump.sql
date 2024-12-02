-- Customers table
INSERT INTO users
    (username, email, password, phone, verified)
VALUES
    ('anders', '00e642a9aeba510abfc6572c5cc96e9e3dbcbb348339b2c9030cde718dca3bd3', '$2b$10$pXQSGfwSRTFt40i6Oziz2uEdiy5iqor9O0IKZvXzrD/mmx7A7EA.W', 1, 1);
INSERT INTO users
    (username, email, password, phone, verified)
VALUES
    ('hjalte', '7e6b90c9681cbcbaa01702aa65fc7288b058a8c1fad9e6d7a13b73cb9118f3ba', '$2b$10$qOVztOwrJ8dyUXwQpOL8EOmHLVbvUHOm1HEptDNUL5tEwZzucQ4Py', 2, 1);
INSERT INTO users
    (username, email, password, phone, verified)
VALUES
    ('simon', 'e9efeb7e88502186c55f9d5f22079aee', '$2b$10$L1zB6LDc9KnkVjxUGUp55OzCun.IDDrlKcV3Fsl/SeG.Xo91NZvvC', 3, 1);



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
