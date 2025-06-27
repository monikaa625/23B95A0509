const urlDatabase = new Map();

const addUrl = (originalUrl, shortcode, validityMinutes) => {
    const createdAt = new Date();
    const expiryDate = new Date(createdAt.getTime() + validityMinutes * 60000);
    
    urlDatabase.set(shortcode, {
        originalUrl,
        createdAt,
        expiryDate,
        clickCount: 0,
        clickTimestamps: []
    });
    
    return { shortcode, expiryDate };
};

const getUrl = (shortcode) => {
    const urlData = urlDatabase.get(shortcode);
    if (urlData && new Date() < urlData.expiryDate) {
        return urlData;
    }
    // Return null if not found or expired
    return urlData || null;
};

const incrementClickCount = (shortcode) => {
    const urlData = urlDatabase.get(shortcode);
    if (urlData) {
        urlData.clickCount++;
        urlData.clickTimestamps.push(new Date());
        return true;
    }
    return false;
};

const getAllUrls = () => {
    return Array.from(urlDatabase.entries()).map(([shortcode, data]) => ({
        shortcode,
        originalUrl: data.originalUrl,
        createdAt: data.createdAt,
        expiryDate: data.expiryDate,
        clickCount: data.clickCount,
        clickTimestamps: data.clickTimestamps
    }));
};

const cleanupExpiredUrls = () => {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [shortcode, data] of urlDatabase.entries()) {
        if (now >= data.expiryDate) {
            urlDatabase.delete(shortcode);
            cleanedCount++;
        }
    }
    
    return cleanedCount;
};

module.exports = {
    addUrl,
    getUrl,
    incrementClickCount,
    getAllUrls,
    cleanupExpiredUrls
};