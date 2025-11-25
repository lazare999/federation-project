import formData from 'form-data';
import Mailgun from 'mailgun.js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { name, phone, email, message } = await request.json();

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const mg = new Mailgun(formData);
  const client = mg.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY, // private key from env
  });

  try {
    const result = await client.messages.create(
      'georgianequestrianfederation.ge', // verified domain
      {
        from: 'New contact form <contact@georgianequestrianfederation.ge>', // hardcoded
        to: ['lazare.osiashvili9@gmail.com'], // hardcoded
        subject: 'New Contact Form Submission',
        text: `Name: ${name}\nPhone: ${phone}\nEmail: ${email}\nMessage: ${message}`,
        html: `
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong><br>${message}</p>
        `,
        'h:Reply-To': email, // reply goes to user
      }
    );

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Mailgun Error Full:', error);
    return NextResponse.json(
      {
        error: 'Failed to send email',
        details: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      },
      { status: 500 }
    );
  }
}
