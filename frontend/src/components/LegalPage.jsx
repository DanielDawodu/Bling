import React from 'react';
import SEO from '../components/SEO';
import './Legal.css';

const LegalPage = ({ title, content, lastUpdated }) => {
    return (
        <div className="legal-page">
            <SEO
                title={title}
                description={`Read our ${title} to understand your rights and our responsibilities on Bling.`}
            />
            <div className="legal-header sticky-header">
                <h2>{title}</h2>
                <div className="last-updated">Last Updated: {lastUpdated}</div>
            </div>
            <div className="legal-content">
                {content}
            </div>
        </div>
    );
};

export default LegalPage;
