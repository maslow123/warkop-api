const Product = require('../models/product').default;

const response = require('../helpers/response');

const getAllProduct = async (req, res) => {
    try {
        let { name_search, limit, page } = req.query;
        if(!limit) {
            limit = 10;
        }
        const offset = page ? (parseInt(page) - 1) * parseInt(limit) : 0;
        if(!page) {
            page = 1;
        }
        let results = await Product.getAll(name_search, limit, offset);
        if (results.length < 1) {
            return response.notFound(res);
        }
        response.success(res, results, results.length);
    } catch (error) {
        response.internalError(res, error.message);
    }
}
const getDetailProduct = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return response.falseRequirement(res, 'id');
    }

    try {
        let product = new Product(id);
        let result = await product.read();
        if (result == -1) {
            return response.notFound(res);
        }
        response.success(res, product);        
    } catch (error) {
        response.internalError(res, error.message);
    }
}

const createProduct = async (req, res) => {
    try {
        const { category_id, name, image_url, price, created_by, stock } = req.body;             
        if(!category_id) {
            return response.falseRequirement(res, 'category_id');
        }
        if(!name) {
            return response.falseRequirement(res, 'name');
        }
        if(!image_url) {
            return response.falseRequirement(res, 'image_url');
        }
        if(!price) {
            return response.falseRequirement(res, 'price');
        }
        if(!stock) {
            return response.falseRequirement(res, 'stock');
        }

        let product = new Product('', category_id, name, image_url, stock, price, 0);
        await product.create();
        return response.upsert(res, product, 'created');
    } catch (error) {
        response.internalError(res, error.message);
    }
}

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { category_id, name, image_url, stock, price, created_by } = req.body;             
        if(!category_id) {
            return response.falseRequirement(res, 'category_id');
        }
        if(!name) {
            return response.falseRequirement(res, 'name');
        }
        if(!image_url) {
            return response.falseRequirement(res, 'image_url');
        }
        if(!stock) {
            return response.falseRequirement(res, 'stock');
        }
        if(!price) {
            return response.falseRequirement(res, 'price');
        }  

        let product = new Product(id, category_id, name, image_url, stock, price, 0);
        const result = await product.update();
        if (!result) {
            return response.notFound(res);
        }
        response.upsert(res, product, 'updated');
    } catch (error) {
        response.internalError(res, error.message);
    }
}

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if(!id) {
            return response.falseRequirement(res, 'id');
        }
        let product = new Product(parseInt(id));
        const result = await product.delete();
        if(!result) {
            return response.notFound(res);
        }
        return response.upsert(res, product, 'deleted');
    } catch (error) {
        response.internalError(res, error.message);
    }
}
module.exports = {
    getAllProduct,
    getDetailProduct,
    createProduct,
    updateProduct,
    deleteProduct
};