import formData from 'form-data';
import Mailgun from 'mailgun.js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { riderName, number, email, horses } = await request.json();

    if (!riderName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!process.env.MAILGUN_API_KEY) {
      return NextResponse.json(
        { error: 'Mailgun not configured' },
        { status: 500 }
      );
    }

    const mg = new Mailgun(formData);
    const client = mg.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY,
    });

    const horseList =
      horses?.map((h) => `${h.horseName} (${h.competitionId})`).join('\n') ||
      'No horses';

    const result = await client.messages.create(
      'georgianequestrianfederation.ge',
      {
        from: 'Georgian Equestrian Federation <contact@georgianequestrianfederation.ge>',
        to: ['lazare.osiashvili9@gmail.com'],
        subject: `New registration: ${riderName}`,

        text: `
New Event Registration

Rider: ${riderName}
Phone: ${number}
Email: ${email}

Horses:
${horseList}
        `,

        html: `
          <h2>New Registration</h2>
          <p><b>Rider:</b> ${riderName}</p>
          <p><b>Phone:</b> ${number}</p>
          <p><b>Email:</b> ${email}</p>
          <h3>Horses</h3>
          <pre>${horseList}</pre>
        `,

        'h:Reply-To': email,
      }
    );

    console.log('MAILGUN SUCCESS:', result);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('MAILGUN ERROR:', error);

    return NextResponse.json(
      {
        error: 'Email failed',
        details: error?.message || error,
      },
      { status: 500 }
    );
  }
}
