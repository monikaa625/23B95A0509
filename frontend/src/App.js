// filepath: c:\Users\bhars\Desktop\AffordExam\22B91A6206\url-shortener\frontend\src\App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import URLForm from './components/URLForm';
import ResultList from './components/ResultList';
import StatsPage from './components/StatsPage';
import { Container, AppBar, Toolbar, Typography } from '@mui/material';

function App() {
    return (
        <Router>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        URL Shortener
                    </Typography>
                </Toolbar>
            </AppBar>
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Routes>
                    <Route path="/" element={<URLForm />} />
                    <Route path="/results" element={<ResultList />} />
                    <Route path="/stats" element={<StatsPage />} />
                </Routes>
            </Container>
        </Router>
    );
}

export default App;
