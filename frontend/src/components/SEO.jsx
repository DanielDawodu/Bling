import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, image, url, type = 'website' }) => {
    const siteTitle = 'Bling';
    const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
    const siteDescription = description || 'Bling - The modern developer social network for sharing code and ideas.';
    const siteUrl = window.location.origin;
    const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
    const fullImage = image || `${siteUrl}/sidebar-logo.png`;

    return (
        <Helmet>
            {/* Standard metadata tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={siteDescription} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={siteDescription} />
            <meta property="og:image" content={fullImage} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={fullUrl} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={siteDescription} />
            <meta name="twitter:image" content={fullImage} />
        </Helmet>
    );
};

export default SEO;
