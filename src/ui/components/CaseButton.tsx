import React from 'react';

interface CaseButtonProps {
    index: number;
    isOpened: boolean;
    isPlayerCase: boolean;
    isRevealing?: boolean;
    disabled?: boolean;
    onClick: () => void;
}

const CaseButton: React.FC<CaseButtonProps> = ({ index, isOpened, isPlayerCase, isRevealing, disabled, onClick }) => {
    const status = isOpened ? 'opened' : isPlayerCase ? 'player' : 'sealed';

    return (
        <button
            className={`case-button ${status} ${isRevealing ? 'revealing' : ''}`.trim()}
            onClick={onClick}
            disabled={disabled || isOpened}
        >
            <span className="case-label">{index + 1}</span>
        </button>
    );
};

export default CaseButton;