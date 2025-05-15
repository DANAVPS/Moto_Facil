export const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const generateRandomString = (length = 10) => {
    return Math.random().toString(36).substring(2, length + 2);
};

export const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency
    }).format(amount);
};

export const debounce = (func, wait = 300) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};