import React from 'react';
import { Typography, Box } from '@mui/material';

const ResultList = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Results
            </Typography>
            <Typography variant="body1">
                This page will show URL shortening results.
            </Typography>
        </Box>
    );
};

export default ResultList;