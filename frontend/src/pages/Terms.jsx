import React from 'react';
import LegalPage from '../components/LegalPage';

const Terms = () => {
    const content = (
        <>
            <section>
                <h3>1. Acceptance of Terms</h3>
                <p>Welcome to Bling. By accessing or using our platform, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>
            </section>
            <section>
                <h3>2. User Content</h3>
                <p>You retain ownership of the content you post on Bling. However, by posting, you grant us a worldwide, non-exclusive, royalty-free license to use, copy, reproduce, process, adapt, modify, publish, transmit, display, and distribute such content.</p>
            </section>
            <section>
                <h3>3. Prohibited Conduct</h3>
                <p>Users are prohibited from:
                    <ul>
                        <li>Harassing, abusing, or harming other users.</li>
                        <li>Posting illegal or infringing content.</li>
                        <li>Attempting to hack or disrupt the service.</li>
                        <li>Using automated systems (bots) without permission.</li>
                    </ul>
                </p>
            </section>
            <section>
                <h3>4. Termination</h3>
                <p>We reserve the right to suspend or terminate your account at any time for violations of these terms.</p>
            </section>
        </>
    );

    return <LegalPage title="Terms of Service" content={content} lastUpdated="December 18, 2025" />;
};

export default Terms;
