import { GoogleAuth } from "google-auth-library";

const ADS_API_VERSION = "v17";

async function getAccessToken(): Promise<string> {
  const credentials = JSON.parse(process.env.GOOGLE_ADS_SERVICE_ACCOUNT_JSON!);
  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/adwords"],
  });
  const client = await auth.getClient();
  const res = await client.getAccessToken();
  return res.token!;
}

export interface OfflineConversionParams {
  conversionDateTime: string; // "2024-01-15 14:30:00+00:00"
  transactionId: string;      // used as orderId for deduplication
  currencyCode: string;
  conversionValue: number;
}

export async function uploadOfflineConversion(params: OfflineConversionParams): Promise<void> {
  const token = await getAccessToken();
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!.replace(/-/g, "");
  const conversionAction =
    `customers/${customerId}/conversionActions/${process.env.GOOGLE_ADS_CONVERSION_ACTION_ID}`;

  const res = await fetch(
    `https://googleads.googleapis.com/${ADS_API_VERSION}/customers/${customerId}:uploadClickConversions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversions: [
          {
            conversionAction,
            conversionDateTime: params.conversionDateTime,
            orderId: params.transactionId,
            currencyCode: params.currencyCode,
            conversionValue: params.conversionValue,
          },
        ],
        partialFailure: true,
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Ads API ${res.status}: ${text}`);
  }

  const data = await res.json();
  if (data.partialFailureError) {
    throw new Error(`Google Ads partial failure: ${JSON.stringify(data.partialFailureError)}`);
  }
}

export function toGoogleAdsDateTime(date: Date): string {
  const p = (n: number) => n.toString().padStart(2, "0");
  return (
    `${date.getUTCFullYear()}-${p(date.getUTCMonth() + 1)}-${p(date.getUTCDate())} ` +
    `${p(date.getUTCHours())}:${p(date.getUTCMinutes())}:${p(date.getUTCSeconds())}+00:00`
  );
}
