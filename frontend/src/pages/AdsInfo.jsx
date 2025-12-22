import React from 'react';
import LegalPage from '../components/LegalPage';

const AdsInfo = () => {
    const content = (
        <>
            <section>
                <h3>Advertising on Bling</h3>
                <p>We do not currently use traditional display ads. If we introduce advertising in the future, we will prioritize relevant, non-intrusive content for the developer community.</p>
            </section>
            <section>
                <h3>Your Choices</h3>
                <p>We respect your privacy. If we begin using advertising cookies, you will have the option to opt-out or manage your preferences through our cookie settings.</p>
            </section>
            <section>
                <h3>Developer Opportunities</h3>
                <p>Job postings and company highlights are our primary way of connecting developers with opportunities. These are curated to be valuable to our users.</p>
            </section>
        </>
    );

    return <LegalPage title="Ads Info" content={content} lastUpdated="December 18, 2025" />;
};

export default AdsInfo;
