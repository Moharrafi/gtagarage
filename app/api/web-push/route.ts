import { NextResponse } from 'next/server'
import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:admin@gtagarage.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
)

// In a real app, this should be stored in a database (e.g. PostgreSQL, MongoDB, etc.)
// For demonstration, we use in-memory storage (will reset on server restart)
let subscriptions: any[] = []

export async function POST(req: Request) {
  try {
    const { action, subscription, payload } = await req.json()

    if (action === 'subscribe') {
      if (subscription) {
        // Prevent duplicate subscriptions
        const exists = subscriptions.find(
          (sub) => sub.endpoint === subscription.endpoint
        )
        if (!exists) {
          subscriptions.push(subscription)
        }
        return NextResponse.json({ success: true, message: 'Subscribed successfully.' })
      }
      return NextResponse.json({ success: false, message: 'Invalid subscription object.' }, { status: 400 })
    }

    if (action === 'send') {
      if (subscriptions.length === 0) {
        return NextResponse.json({ success: false, message: 'No subscriptions found.' }, { status: 404 })
      }

      const sendPromises = subscriptions.map((sub) =>
        webpush.sendNotification(sub, JSON.stringify(payload))
          .catch((error) => {
            if (error.statusCode === 404 || error.statusCode === 410) {
              // Subscription has expired or is no longer valid
              subscriptions = subscriptions.filter((s) => s.endpoint !== sub.endpoint)
            }
            console.error('Error sending push notification:', error)
          })
      )

      await Promise.all(sendPromises)
      return NextResponse.json({ success: true, message: 'Notification sent.' })
    }

    return NextResponse.json({ success: false, message: 'Invalid action.' }, { status: 400 })
  } catch (error) {
    console.error('Web Push Error:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
