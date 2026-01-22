import React from 'react';

interface DealPanelProps {
    offer: number | null;
    disabled?: boolean;
    dealAccepted?: boolean;
    onAccept: () => void;
    onReject: () => void;
}

const DealPanel: React.FC<DealPanelProps> = ({ offer, disabled, dealAccepted, onAccept, onReject }) => {
    return (
        <div className="deal-panel">
            {offer !== null ? (
                <>
                    <h2>Banker's Offer</h2>
                    <p className="offer-amount">${offer.toLocaleString()}</p>
                    <div className="deal-actions">
                        <button onClick={onAccept} disabled={disabled || dealAccepted}>
                            Deal
                        </button>
                        <button onClick={onReject} disabled={disabled || dealAccepted}>
                            No Deal
                        </button>
                    </div>
                </>
            ) : (
                <h2>No Offer Yet</h2>
            )}
        </div>
    );
};

export default DealPanel;