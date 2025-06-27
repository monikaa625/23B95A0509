export const validateURL = (url) => {
    const urlPattern = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(:\d+)?(\/[^\s]*)?$/i;
    return urlPattern.test(url);
};

export const validateInteger = (value) => {
    const intPattern = /^\d+$/;
    return intPattern.test(value);
};

export const validateShortcode = (shortcode) => {
    const shortcodePattern = /^[a-zA-Z0-9]+$/;
    return shortcodePattern.test(shortcode);
};