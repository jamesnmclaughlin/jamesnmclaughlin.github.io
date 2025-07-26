import React from 'react'
import { Link } from 'react-router'

const NotFound: React.FC = () => {
    return (
        <article>
            <h1>404</h1>
            <p>Page not found</p>
            <Link to="/">Go back to the home page</Link>
        </article>
    )
}

export default NotFound
