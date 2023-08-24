import React, { useState } from 'react';
import DOMPurify from 'dompurify';

const SecureInput = ({ label, type, placeholder, onChange, validator }) => {
    const [value, setValue] = useState('');
    const [error, setError] = useState(null);

    const handleInputChange = (e) => {
        const inputValue = e.target.value;
        const sanitizedValue = DOMPurify.sanitize(inputValue);

        // Optional custom validation
        if (validator && !validator(sanitizedValue)) {
            setError('Invalid input');
        } else {
            setError(null);
        }

        setValue(sanitizedValue);
        onChange && onChange(sanitizedValue);
    };

    return (
        <div>
            {label && <label>{label}</label>}
            <input
                type={type || 'text'}
                placeholder={placeholder}
                value={value}
                onChange={handleInputChange}
            />
            {error && <div className="error">{error}</div>}
        </div>
    );
};

export default SecureInput;
