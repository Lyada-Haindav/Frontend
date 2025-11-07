import { db } from '@/db';
import { templates } from '@/db/schema';
import { randomUUID } from 'crypto';

async function main() {
    const sampleTemplates = [
        {
            id: randomUUID(),
            name: 'Contact Form',
            description: 'Simple contact form for general inquiries',
            icon: 'Mail',
            category: 'General',
            config: {
                steps: [
                    {
                        title: 'Contact Information',
                        fields: [
                            {
                                type: 'text',
                                label: 'Full Name',
                                required: true,
                                placeholder: 'Enter your full name'
                            },
                            {
                                type: 'email',
                                label: 'Email',
                                required: true,
                                placeholder: 'your@email.com'
                            },
                            {
                                type: 'textarea',
                                label: 'Message',
                                required: true,
                                placeholder: 'Enter your message'
                            }
                        ]
                    }
                ]
            },
            createdAt: new Date().toISOString(),
        },
        {
            id: randomUUID(),
            name: 'Survey Form',
            description: 'Multi-step survey to collect feedback',
            icon: 'ClipboardList',
            category: 'Survey',
            config: {
                steps: [
                    {
                        title: 'Personal Information',
                        fields: [
                            {
                                type: 'text',
                                label: 'Name',
                                required: true,
                                placeholder: 'Your name'
                            },
                            {
                                type: 'select',
                                label: 'Age Range',
                                required: true,
                                options: [
                                    { label: '18-24', value: '18-24' },
                                    { label: '25-34', value: '25-34' },
                                    { label: '35-44', value: '35-44' },
                                    { label: '45+', value: '45+' }
                                ]
                            }
                        ]
                    },
                    {
                        title: 'Survey Questions',
                        fields: [
                            {
                                type: 'radio',
                                label: 'How satisfied are you with our service?',
                                required: true,
                                options: [
                                    { label: 'Very Satisfied', value: 'very_satisfied' },
                                    { label: 'Satisfied', value: 'satisfied' },
                                    { label: 'Neutral', value: 'neutral' },
                                    { label: 'Dissatisfied', value: 'dissatisfied' },
                                    { label: 'Very Dissatisfied', value: 'very_dissatisfied' }
                                ]
                            },
                            {
                                type: 'textarea',
                                label: 'Additional Comments',
                                required: false,
                                placeholder: 'Share your thoughts...'
                            }
                        ]
                    }
                ]
            },
            createdAt: new Date().toISOString(),
        },
        {
            id: randomUUID(),
            name: 'Registration Form',
            description: 'Multi-step registration form',
            icon: 'UserPlus',
            category: 'Registration',
            config: {
                steps: [
                    {
                        title: 'Account Information',
                        fields: [
                            {
                                type: 'text',
                                label: 'Username',
                                required: true,
                                placeholder: 'Choose a username'
                            },
                            {
                                type: 'email',
                                label: 'Email Address',
                                required: true,
                                placeholder: 'your@email.com'
                            },
                            {
                                type: 'password',
                                label: 'Password',
                                required: true,
                                placeholder: 'Enter a strong password'
                            }
                        ]
                    },
                    {
                        title: 'Personal Details',
                        fields: [
                            {
                                type: 'text',
                                label: 'First Name',
                                required: true,
                                placeholder: 'First name'
                            },
                            {
                                type: 'text',
                                label: 'Last Name',
                                required: true,
                                placeholder: 'Last name'
                            },
                            {
                                type: 'tel',
                                label: 'Phone Number',
                                required: false,
                                placeholder: '+1 (555) 000-0000'
                            },
                            {
                                type: 'checkbox',
                                label: 'I agree to the terms and conditions',
                                required: true
                            }
                        ]
                    }
                ]
            },
            createdAt: new Date().toISOString(),
        },
        {
            id: randomUUID(),
            name: 'Feedback Form',
            description: 'Collect product or service feedback',
            icon: 'MessageSquare',
            category: 'Feedback',
            config: {
                steps: [
                    {
                        title: 'Your Feedback',
                        fields: [
                            {
                                type: 'text',
                                label: 'Name',
                                required: true,
                                placeholder: 'Your name'
                            },
                            {
                                type: 'email',
                                label: 'Email',
                                required: true,
                                placeholder: 'your@email.com'
                            },
                            {
                                type: 'select',
                                label: 'Feedback Category',
                                required: true,
                                options: [
                                    { label: 'Product Quality', value: 'product_quality' },
                                    { label: 'Customer Service', value: 'customer_service' },
                                    { label: 'Website Experience', value: 'website_experience' },
                                    { label: 'Pricing', value: 'pricing' },
                                    { label: 'Other', value: 'other' }
                                ]
                            },
                            {
                                type: 'rating',
                                label: 'Overall Rating',
                                required: true,
                                options: [
                                    { label: '1', value: '1' },
                                    { label: '2', value: '2' },
                                    { label: '3', value: '3' },
                                    { label: '4', value: '4' },
                                    { label: '5', value: '5' }
                                ]
                            },
                            {
                                type: 'textarea',
                                label: 'Detailed Feedback',
                                required: true,
                                placeholder: 'Please share your feedback in detail...'
                            }
                        ]
                    }
                ]
            },
            createdAt: new Date().toISOString(),
        }
    ];

    await db.insert(templates).values(sampleTemplates);
    
    console.log('✅ Templates seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});