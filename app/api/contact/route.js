import formData from 'form-data';
import Mailgun from 'mailgun.js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { name, phone, email, message } = await request.json();

  // Validate required fields
  if (!name || !email || !message) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  // 🔒 Basic sanitization (removes links → reduces spam score)
  const cleanMessage = message.replace(/https?:\/\/\S+/g, '[link removed]');

  const mg = new Mailgun(formData);
  const client = mg.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY,
  });

  try {
    const result = await client.messages.create(
      'georgianequestrianfederation.ge',
      {
        from: 'Georgian Equestrian Federation <contact@georgianequestrianfederation.ge>', // ✅ branded sender
        to: ['lazare.osiashvili9@gmail.com'], // ⚠️ keep single at first for testing
        subject: 'New Contact Form Submission',

        // ✅ Clean structured TEXT version
        text: `New Contact Form Submission

Name: ${name}
Phone: ${phone || 'Not provided'}
Email: ${email}

Message:
${cleanMessage}

---
Sent from georgianequestrianfederation.ge
`,

        // ✅ Professional HTML version (VERY important)
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>New Contact Form Submission</h2>

            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Email:</strong> ${email}</p>

            <hr />

            <p><strong>Message:</strong></p>
            <p>${cleanMessage}</p>

            <hr />

            <p style="font-size:12px; color:gray;">
              This message was sent from the contact form on
              georgianequestrianfederation.ge
            </p>
          </div>
        `,

        // ✅ Safe reply-to
        'h:Reply-To': email,
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
