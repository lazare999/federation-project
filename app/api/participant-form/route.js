import formData from 'form-data';
import Mailgun from 'mailgun.js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { riderName, number, email, horses } = await request.json();

  // Validate required fields
  if (!riderName || !email || !number) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const mg = new Mailgun(formData);
  const client = mg.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY, // Only environment variable needed
  });

  try {
    // Build horses list
    const horseListHtml =
      horses
        ?.map((h) => `<li>${h.horseName} (${h.horseClass})</li>`)
        .join('') || '<li>No horses added</li>';
    const horseListText =
      horses?.map((h) => `${h.horseName} (${h.horseClass})`).join('\n') ||
      'No horses added';

    // Send email
    const result = await client.messages.create(
      'georgianequestrianfederation.ge',
      {
        // verified domain
        from: 'Event Registration <contact@georgianequestrianfederation.ge>', // hardcoded
        to: ['lazare.osiashvili9@gmail.com'], // hardcoded recipient
        subject: 'New Event Participant Registration',
        text: `Rider Name: ${riderName}
Phone: ${number}
Email: ${email}
Horses:
${horseListText}`,
        html: `
        <h2>New Event Participant Registration</h2>
        <p><strong>Rider Name:</strong> ${riderName}</p>
        <p><strong>Phone:</strong> ${number}</p>
        <p><strong>Email:</strong> ${email}</p>
        <h3>Horses:</h3>
        <ol>${horseListHtml}</ol>
      `,
        'h:Reply-To': email, // reply goes to participant
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
