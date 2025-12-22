import React from 'react';
import LegalPage from '../components/LegalPage';

const Accessibility = () => {
    const content = (
        <>
            <section>
                <h3>Our Commitment</h3>
                <p>Bling is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.</p>
            </section>
            <section>
                <h3>Standard</h3>
                <p>We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 level AA standards.</p>
            </section>
            <section>
                <h3>Features</h3>
                <p>To support accessibility, we:
                    <ul>
                        <li>Ensure sufficient color contrast.</li>
                        <li>Provide alt text for essential images.</li>
                        <li>Support keyboard-only navigation.</li>
                        <li>Use semantic HTML for screen readers.</li>
                    </ul>
                </p>
            </section>
        </>
    );

    return <LegalPage title="Accessibility" content={content} lastUpdated="December 18, 2025" />;
};

export default Accessibility;
