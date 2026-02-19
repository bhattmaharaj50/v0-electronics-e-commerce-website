import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
    const handleButtonClick = (e) => {
        e.preventDefault();
        // Additional logic can be added here if needed
    };

    return (
        <Link to={`/products/${product.id}`}>  
            <div className="product-card">
                <h2>{product.name}</h2>
                <p>{product.description}</p>
                <button onClick={handleButtonClick}>Details</button>
            </div>
        </Link>
    );
};

export default ProductCard;