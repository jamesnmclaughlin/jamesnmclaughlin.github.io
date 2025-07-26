import React from 'react'
import { Routes, Route } from 'react-router'
import { Home, NotFound } from './pages'
import Layout from './features/Layout.tsx'

const AppRouter: React.FC = () => {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes>
    )
}

export default AppRouter
