import React from 'react';

interface OfferDisplayProps {
    offer: number | null;
}

const OfferDisplay: React.FC<OfferDisplayProps> = ({ offer }) => {
    return (
        <div className="offer-display">
            <h2>Current Offer</h2>
            {offer !== null ? (
                <p className="offer-amount">${offer.toLocaleString()}</p>
            ) : (
                <p className="muted">No offer yet. Open a few cases and ask the banker.</p>
            )}
        </div>
    );
};

export default OfferDisplay;