import React from 'react';
import PropTypes from 'prop-types';

/**
 * A wrapper component that applies a custom scrollbar style to its children.
 * Uses native CSS scrollbars (styled in index.css) for better performance 
 * than JavaScript-based scrollbar libraries.
 */
const Scrollbar = ({
    children,
    className = '',
    dark = false,
    horizontal = false,
    as: Component = 'div',
    ...props
}) => {
    // We rely on the global scrollbar styles defined in index.css
    // .custom-scrollbar is specifically styled for darker backgrounds (like the sidebar)

    const scrollClasses = [
        horizontal ? 'overflow-x-auto overflow-y-hidden' : 'overflow-y-auto overflow-x-hidden',
        dark ? 'custom-scrollbar' : '', // If dark mode/sidebar, use custom-scrollbar 
        className
    ].filter(Boolean).join(' ');

    return (
        <Component className={scrollClasses} {...props}>
            {children}
        </Component>
    );
};

Scrollbar.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    dark: PropTypes.bool,
    horizontal: PropTypes.bool,
    as: PropTypes.elementType
};

export default Scrollbar;
