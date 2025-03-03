DROP TABLE IF EXISTS users;
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY,
    email TEXT NOT NULL,
    email_iv TEXT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT NOT NULL,
    otp TEXT,
    otp_expiration DATETIME,
    verified INTEGER DEFAULT 0,
    subscribed_newsletter INTEGER DEFAULT 0,
    img_url TEXT
);


DROP TABLE IF EXISTS products;
        CREATE TABLE products (
            product_id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            imgsrc TEXT NOT NULL,
            price REAL NOT NULL
        );

DROP TABLE IF EXISTS chat;
CREATE TABLE chat (
    chat_id INTEGER PRIMARY KEY,          -- Unikt ID for hver besked, autoincrementerer automatisk
    sender_id INTEGER NOT NULL,           -- ID på brugeren, der sender beskeden
    recipient_id INTEGER NOT NULL,        -- ID på modtageren af beskeden
    message TEXT NOT NULL,                -- Selve beskedens indhold
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Tidspunkt for afsendelse af beskeden
    delivered INTEGER DEFAULT 0,          -- Indikerer om beskeden er leveret (0 = ikke leveret, 1 = leveret)
    FOREIGN KEY (sender_id) REFERENCES users(user_id),
    FOREIGN KEY (recipient_id) REFERENCES users(user_id)
);

DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
    order_id INTEGER PRIMARY KEY, -- Unik ID for hver bestilling
    user_id INTEGER NOT NULL,                   -- Reference til brugerens ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Tidspunkt for oprettelse
    FOREIGN KEY (user_id) REFERENCES users(user_id)  -- Relation til brugere
);

DROP TABLE IF EXISTS order_items;
CREATE TABLE order_items (
    order_item_id INTEGER PRIMARY KEY , -- Unik ID for hver post
    order_id INTEGER NOT NULL,                       -- Reference til en ordre
    product_id INTEGER NOT NULL,                     -- Reference til et produkt
    quantity INTEGER NOT NULL,                       -- Antal af produktet
    FOREIGN KEY (order_id) REFERENCES orders(order_id), -- Relation til ordre
    FOREIGN KEY (product_id) REFERENCES products(product_id) -- Relation til produkt
);