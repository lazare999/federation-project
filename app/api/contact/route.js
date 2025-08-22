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
    key: process.env.MAILGUN_API_KEY,
  });

  try {
    const result = await client.messages.create(process.env.MAILGUN_DOMAIN, {
      from: `Website Contact <contact@${process.env.MAILGUN_DOMAIN}>`,
      to: ['lazare.osiashvili9@gmail.com'],
      subject: 'New Contact Form Submission',
      text: `
        Name: ${name}
        Phone: ${phone}
        Email: ${email}
        Message: ${message}
      `,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    );
  }
}
