import React from 'react'
import { Outlet } from 'react-router'
import Header from './Header'

const Layout: React.FC = () => {
    return (
        <>
            <Header />
            <main>
                <Outlet />
            </main>
        </>
    )
}

export default Layout
