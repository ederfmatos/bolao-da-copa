import {
  ApplicationServer,
  importVapidKeys,
  PushMessageError,
} from "./webPushLib.ts"

export interface PushSubscriptionData {
  endpoint: string
  p256dh_key: string
  auth_key: string
}

export interface NotificationPayload {
  title: string
  body: string
  data: Record<string, unknown>
}

export interface SendPushResult {
  success: boolean
  expired: boolean
  error?: string
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function vapidKeysToJwk(
  publicKeyBase64Url: string,
  privateKeyBase64Url: string,
) {
  const publicKeyBytes = base64UrlToUint8Array(publicKeyBase64Url)

  if (publicKeyBytes.length !== 65 || publicKeyBytes[0] !== 0x04) {
    throw new Error(
      "Invalid VAPID public key: expected 65-byte uncompressed EC point",
    )
  }

  const x = publicKeyBytes.slice(1, 33)
  const y = publicKeyBytes.slice(33, 65)
  const d = base64UrlToUint8Array(privateKeyBase64Url)

  if (d.length !== 32) {
    throw new Error("Invalid VAPID private key: expected 32-byte EC scalar")
  }

  return {
    publicKey: {
      kty: "EC",
      crv: "P-256",
      x: uint8ArrayToBase64Url(x),
      y: uint8ArrayToBase64Url(y),
    },
    privateKey: {
      kty: "EC",
      crv: "P-256",
      x: uint8ArrayToBase64Url(x),
      y: uint8ArrayToBase64Url(y),
      d: uint8ArrayToBase64Url(d),
    },
  }
}

let cachedServer: ApplicationServer | null = null
let cachedVapidKeys: CryptoKeyPair | null = null

async function getApplicationServer(): Promise<ApplicationServer> {
  const publicKey = Deno.env.get("VAPID_PUBLIC_KEY")
  const privateKey = Deno.env.get("VAPID_PRIVATE_KEY")
  const subject = Deno.env.get("VAPID_SUBJECT")

  if (!publicKey) {
    throw new Error("VAPID_PUBLIC_KEY environment variable is not set")
  }
  if (!privateKey) {
    throw new Error("VAPID_PRIVATE_KEY environment variable is not set")
  }
  if (!subject) {
    throw new Error("VAPID_SUBJECT environment variable is not set")
  }

  if (cachedServer && cachedVapidKeys) {
    return cachedServer
  }

  const jwk = vapidKeysToJwk(publicKey, privateKey)
  const vapidKeys = await importVapidKeys(jwk, { extractable: false })

  cachedVapidKeys = vapidKeys
  cachedServer = await ApplicationServer.new({
    contactInformation: subject,
    vapidKeys,
  })

  return cachedServer
}

export function resetServerCache(): void {
  cachedServer = null
  cachedVapidKeys = null
}

export async function sendPush(
  subscription: PushSubscriptionData,
  payload: NotificationPayload,
): Promise<SendPushResult> {
  if (!subscription.endpoint || !subscription.p256dh_key || !subscription.auth_key) {
    throw new Error(
      "Invalid subscription: endpoint, p256dh_key, and auth_key are required",
    )
  }

  try {
    const server = await getApplicationServer()

    const subscriber = server.subscribe({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh_key,
        auth: subscription.auth_key,
      },
    })

    await subscriber.pushTextMessage(JSON.stringify(payload), {})

    console.log(
      JSON.stringify({
        event: "push_sent",
        endpoint: subscription.endpoint.substring(0, 50) + "...",
        timestamp: new Date().toISOString(),
      }),
    )

    return { success: true, expired: false }
  } catch (error) {
    if (error instanceof Error && error.message.includes("environment variable is not set")) {
      throw error
    }

    if (error instanceof PushMessageError && error.isGone()) {
      console.log(
        JSON.stringify({
          event: "push_subscription_expired",
          endpoint: subscription.endpoint.substring(0, 50) + "...",
          timestamp: new Date().toISOString(),
        }),
      )
      return { success: false, expired: true }
    }

    const message = error instanceof Error ? error.message : "Unknown error"
    console.error(
      JSON.stringify({
        event: "push_failed",
        endpoint: subscription.endpoint.substring(0, 50) + "...",
        error: message,
        timestamp: new Date().toISOString(),
      }),
    )

    return { success: false, expired: false, error: message }
  }
}
