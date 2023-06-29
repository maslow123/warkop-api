const DBTable = require('./dbtable').default;
const Product = require('./product').default;
const User = require('./user').default;

const conn = require('./index');


exports.default = class Transaction extends DBTable {
    constructor(id = "", product_id = 0, user_id = 0, transactionCode = '', quantity = 0, total_amount = 0, created_at = 0) {
        super(id, created_at);
        this.product = new Product(product_id);
        this.user = new User(user_id);
        this.transaction_code = transactionCode;
        this.quantity = quantity;
        this.total_amount = total_amount;
    };

    create = async () => {

        const product = new Product(this.product.id);
        await product.read();

        const total = product.price * this.quantity;
        if (total !== this.total_amount) {
            throw new Error('invalid total amount');
        }
        
        const insufficientStock = (product.stock - this.quantity) < 0;
        if (insufficientStock) {
            throw new Error('inssuficient stock');
        }

        let q = `
            INSERT INTO transactions 
            (product_id, user_id, transaction_code, quantity, total_amount, created_at) 
            VALUES 
            (?, ?, ?, ?, ?, now())
        `;
        await conn.query(q, [this.product.id, this.user.id, this.transaction_code, this.quantity, this.total_amount]);    

        q = `
            UPDATE products SET stock = stock - ?
            WHERE id = ?
        `;        
        await conn.query(q, [this.quantity, this.product.id]);    

    }
    read = async () => {
        const q = `
            SELECT 
                t.id transaction_id,
                t.quantity transaction_quantity,
                t.total_amount transaction_total_amount,
                t.created_at transaction_created_at,

                p.name product_name,
                u.fullname user_fullname                
            FROM transactions t
            LEFT JOIN products p
                ON t.product_id = p.id
            LEFT JOIN users u
                ON t.user_id = u.id
            WHERE t.id = ?`;
        const results = await conn.query(q, [this.id]);

        if (results[0].length < 1) {
            return -1;
        }
        let result = results[0][0];
        this.id = result.transaction_id;
        this.product.name = result.product_name;
        this.user.fullname = result.user_fullname;
        this.quantity = result.transaction_quantity;
        this.total_amount = result.transaction_total_amount;
        this.created_at = result.transaction_created_at;

        delete this.product.category;
        delete this.product.created_by;
    }

    updateStatus = async () => {
        const q = `
            UPDATE transactions
            SET status = ? WHERE id = ?`;
        const results = await conn.query(q, [this.status, this.id]);
        if (results[0].affectedRows < 1) {
            return false;
        }
        await this.read();
        return true;
    }

    static getAll = async (startDate, endDate, userId) => {
        let where = ``;
        if (startDate && endDate) {
            where = `WHERE t.created_at BETWEEN '${startDate} 00:00:00' AND '${endDate} 23:59:59'`;
        }
        if (userId) {
            where = `WHERE t.user_id = ${userId}`;
        }
        const q = `
            SELECT 
                t.id transaction_id,
                t.quantity transaction_quantity,
                t.transaction_code transaction_transaction_code,
                t.total_amount transaction_total_amount,
                t.created_at transaction_created_at,

                p.id product_id,
                p.name product_name,
                p.price product_price,

                u.id user_id,
                u.fullname user_fullname                
            FROM transactions t
            LEFT JOIN products p
                ON t.product_id = p.id
            LEFT JOIN users u
                ON t.user_id = u.id
            ${where} 
            ORDER BY transaction_created_at ASC
         `;

        let results = await conn.query(q, []);
        if (results[0].length < 1) {
            return [];
        }
        return results[0].map(row => {
            const user = new User(row.user_id, '', '', row.user_fullname);
            const product = new Product(
                row.product_id,
                0,
                row.product_name,
                row.product_price,
                row.product_created_at,
                0
            );

            const transaction = new Transaction(
                row.transaction_id,
                0,
                0,
                row.transaction_transaction_code,
                row.transaction_quantity,
                row.transaction_total_amount,
                row.transaction_created_at,
            );


            delete product.category;
            delete product.created_by;

            transaction.product = product;
            transaction.user = user;


            return transaction;
        });
    }
}