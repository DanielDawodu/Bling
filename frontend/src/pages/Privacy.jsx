import React from 'react';
import LegalPage from '../components/LegalPage';

const Privacy = () => {
    const content = (
        <>
            <section>
                <h3>1. Information We Collect</h3>
                <p>We collect information you provide directly to us when creating an account, such as your username, email, and profile details. We also collect content you post and interactions with others.</p>
            </section>
            <section>
                <h3>2. How We Use Information</h3>
                <p>We use your information to provide and improve our services, communicate with you, and personalize your experience. We do not sell your personal data to third parties.</p>
            </section>
            <section>
                <h3>3. Data Security</h3>
                <p>We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure.</p>
            </section>
            <section>
                <h3>4. Your Rights</h3>
                <p>You have the right to access, correct, or delete your personal information. You can manage most of these settings directly through your profile.</p>
            </section>
        </>
    );

    return <LegalPage title="Privacy Policy" content={content} lastUpdated="December 18, 2025" />;
};

export default Privacy;
