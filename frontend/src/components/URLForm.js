import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    Paper,
    Grid,
    Divider,
} from '@mui/material';
import axios from 'axios';

const URLForm = () => {
    const [urls, setUrls] = useState(['', '', '', '', '']);
    const [validity, setValidity] = useState('');
    const [shortcode, setShortcode] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleUrlChange = (index, value) => {
        const newUrls = [...urls];
        newUrls[index] = value;
        setUrls(newUrls);
    };

    const validateUrl = (url) => {
        const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w\.-]*)*\/?$/;
        return urlPattern.test(url);
    };

    const validateShortcode = (code) => {
        const shortcodePattern = /^[a-zA-Z0-9]+$/;
        return shortcodePattern.test(code);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setResults([]);
        setLoading(true);

        const validUrls = urls.filter(url => url.trim() !== '');
        
        if (validUrls.length === 0) {
            setError('Please enter at least one URL');
            setLoading(false);
            return;
        }

        for (let url of validUrls) {
            if (!validateUrl(url)) {
                setError(`Invalid URL format: ${url}`);
                setLoading(false);
                return;
            }
        }

        if (validity && (isNaN(validity) || parseInt(validity) <= 0)) {
            setError('Validity must be a positive integer');
            setLoading(false);
            return;
        }

        if (shortcode && !validateShortcode(shortcode)) {
            setError('Shortcode must be alphanumeric');
            setLoading(false);
            return;
        }

        try {
            const promises = validUrls.map(async (url, index) => {
                const requestData = {
                    url: url.startsWith('http') ? url : `https://${url}`
                };

                if (validity) requestData.validity = parseInt(validity);
                if (shortcode && index === 0) requestData.shortcode = shortcode;

                const response = await axios.post('http://localhost:5000/shorturls', requestData);
                return response.data;
            });

            const responses = await Promise.all(promises);
            setResults(responses);
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred while shortening URLs');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 900, mx: 'auto', mt: 6, px: 2 }}>
            <Paper elevation={6} sx={{ p: 5, borderRadius: 4 }}>
                <Typography variant="h4" align="center" gutterBottom fontWeight={600}>
                    ✂️ Stylish URL Shortener
                </Typography>
                <Typography variant="subtitle1" align="center" sx={{ mb: 4, color: 'gray' }}>
                    Enter up to 5 URLs to generate shortened links with optional custom shortcode and expiry time.
                </Typography>

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        {urls.map((url, index) => (
                            <Grid item xs={12} sm={6} key={index}>
                                <TextField
                                    fullWidth
                                    label={`URL ${index + 1}`}
                                    value={url}
                                    onChange={(e) => handleUrlChange(index, e.target.value)}
                                    placeholder="https://example.com"
                                    variant="outlined"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        ))}

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Validity (minutes)"
                                type="number"
                                value={validity}
                                onChange={(e) => setValidity(e.target.value)}
                                placeholder="30"
                                helperText="Default: 30 minutes"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Custom Shortcode (optional)"
                                value={shortcode}
                                onChange={(e) => setShortcode(e.target.value)}
                                placeholder="abc123"
                                helperText="Alphanumeric only"
                            />
                        </Grid>

                        {error && (
                            <Grid item xs={12}>
                                <Alert severity="error">{error}</Alert>
                            </Grid>
                        )}

                        <Grid item xs={12}>
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="large"
                                sx={{
                                    background: 'linear-gradient(to right, #1976d2, #42a5f5)',
                                    color: '#fff',
                                    '&:hover': {
                                        background: 'linear-gradient(to right, #1565c0, #2196f3)',
                                    },
                                }}
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Shorten URLs'}
                            </Button>
                        </Grid>
                    </Grid>
                </form>

                {results.length > 0 && (
                    <Box sx={{ mt: 5 }}>
                        <Divider sx={{ mb: 3 }} />
                        <Typography variant="h6" gutterBottom>
                            🔗 Shortened Links
                        </Typography>
                        <Grid container spacing={2}>
                            {results.map((result, index) => (
                                <Grid item xs={12} md={6} key={index}>
                                    <Paper elevation={3} sx={{ p: 3, borderLeft: '5px solid #1976d2' }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            Short URL:
                                        </Typography>
                                        <Typography variant="body1" sx={{ mb: 1, fontWeight: 'bold' }}>
                                            <a href={result.shortLink} target="_blank" rel="noopener noreferrer">
                                                {result.shortLink}
                                            </a>
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Expires: {new Date(result.expiry).toLocaleString()}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default URLForm;
