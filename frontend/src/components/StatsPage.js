import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert,
    CircularProgress
} from '@mui/material';
import axios from 'axios';

const StatsPage = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await axios.get('http://localhost:5000/stats');
            setStats(response.data);
        } catch (err) {
            setError('Failed to fetch statistics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                URL Statistics
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {stats.length === 0 ? (
                <Typography variant="body1">
                    No statistics available yet.
                </Typography>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Short URL</TableCell>
                                <TableCell>Original URL</TableCell>
                                <TableCell>Created</TableCell>
                                <TableCell>Expires</TableCell>
                                <TableCell>Clicks</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {stats.map((stat, index) => (
                                <TableRow key={index}>
                                    <TableCell>{stat.shortLink}</TableCell>
                                    <TableCell>{stat.originalUrl}</TableCell>
                                    <TableCell>{new Date(stat.createdAt).toLocaleString()}</TableCell>
                                    <TableCell>{new Date(stat.expiresAt).toLocaleString()}</TableCell>
                                    <TableCell>{stat.clickCount || 0}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

export default StatsPage;