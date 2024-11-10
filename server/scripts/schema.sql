DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INTEGER PRIMARY KEY,  -- Unikt ID for hver bruger, autoincrementerer automatisk
    username TEXT, 
    email TEXT,
    password TEXT
);

DROP TABLE IF EXISTS products;
CREATE TABLE products (
    product_id INTEGER PRIMARY KEY,  -- Unikt ID for hvert produkt, autoincrementerer automatisk
    productName TEXT,
    imgsrc TEXT
);

DROP TABLE IF EXISTS chat;
CREATE TABLE chat (
    chat_id INTEGER PRIMARY KEY,          -- Unikt ID for hver besked, autoincrementerer automatisk
    sender_id INTEGER NOT NULL,           -- ID på brugeren, der sender beskeden
    recipient_id INTEGER NOT NULL,        -- ID på modtageren af beskeden
    message TEXT NOT NULL,                -- Selve beskedens indhold
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Tidspunkt for afsendelse af beskeden
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (recipient_id) REFERENCES users(id)
);
