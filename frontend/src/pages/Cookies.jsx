import React from 'react';
import LegalPage from '../components/LegalPage';

const Cookies = () => {
    const content = (
        <>
            <section>
                <h3>What are Cookies?</h3>
                <p>Cookies are small text files stored on your device that help our website function and improve your experience.</p>
            </section>
            <section>
                <h3>Essential Cookies</h3>
                <p>These are necessary for the platform to function, such as keeping you logged in and maintaining security.</p>
            </section>
            <section>
                <h3>Preference Cookies</h3>
                <p>We use cookies to remember your settings, such as your theme choice (Dark/Light mode).</p>
            </section>
            <section>
                <h3>Managing Cookies</h3>
                <p>You can control and manage cookies through your browser settings. Note that disabling essential cookies may impact your ability to use the site.</p>
            </section>
        </>
    );

    return <LegalPage title="Cookies Policy" content={content} lastUpdated="December 18, 2025" />;
};

export default Cookies;
