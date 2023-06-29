const DBTable = require('./dbtable').default;
const Category = require('./category').default;
const conn = require('./index');


exports.default = class Product extends DBTable {
    constructor(id = "", category_id = 0, name = '', image = '', stock = 0, price = 0, created_at = 0, created_by = 0) {
        super(id, created_at);
        this.category = new Category(category_id);
        this.name = name;
        this.image = image;
        this.stock = stock;
        this.price = price;
    }

    create = async () => {
        const q = `
            INSERT INTO products 
            (category_id, name, image_url, stock, price, created_at) 
            VALUES 
            (?, ?, ?, ?, ?, now())
        `;
        const results = await conn.query(q, [this.category.id, this.name, this.image, this.stock, this.price]);
        this.id = results[0].insertId;
        await this.read();
    }

    read = async () => {
        const q = `
            SELECT 
                p.id product_id,
                p.name product_name,
                p.image_url product_image_url,
                p.stock product_stock,
                p.price product_price,

                c.id category_id,
                c.name category_name
            FROM products p
            LEFT JOIN categories c
                ON p.category_id = c.id
            WHERE p.id = ?`;
        const results = await conn.query(q, [this.id]);

        if (results[0].length < 1) {
            return -1;
        }
        let result = results[0][0];
        this.id = result.product_id;
        this.name = result.product_name;
        this.image_url = result.product_image_url;
        this.stock = result.product_stock;
        this.price = result.product_price;

        this.category_id = result.category_id;
        this.category.name = result.category_name;
    }

    update = async () => {
        const q = `
            UPDATE products
            SET category_id = ?, name = ?, image_url = ?, stock = ?, price = ?
            WHERE id = ?`;
        const results = await conn.query(q, [this.category.id, this.name, this.image_url, this.stock, this.price, this.id]);
        if (results[0].affectedRows < 1) {
            return false;
        }
        await this.read();
        return true;
    }

    delete = async () => {
        const q = `
            DELETE FROM products            
            WHERE id = ?`;

        const results = await conn.query(q, [this.id]);
        return results[0].affectedRows > 0;
    }

    static getAll = async (nameSearch = "%%", limit = 10, offset = 0) => {
        const q = `
            SELECT 
                p.id product_id,
                p.name product_name,
                p.image_url product_image_url,
                p.stock product_stock,
                p.price product_price,
                p.created_at product_created_at,

                c.id category_id,
                c.name category_name
            FROM products p
            LEFT JOIN categories c
                ON p.category_id = c.id
            WHERE p.name LIKE ? 
        `;
        let results = await conn.query(q, [nameSearch]);
        if (results[0].length < 1) {
            return [];
        }
        return results[0].map(row => {
            const category = new Category(row.category_id, row.category_name);
            const product = new Product (
                row.product_id,
                0,
                row.product_name,
                row.product_image_url,
                row.product_stock,
                row.product_price,
                row.product_created_at,                
            );
            
            product.category = category;

            return product;
        });
    }
}