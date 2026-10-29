const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const lemonApiKey = process.env.LEMONSQUEEZY_API_KEY;

if (!supabaseUrl || !serviceRoleKey || !lemonApiKey) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and LEMONSQUEEZY_API_KEY before running this one-time backfill."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const subscriptions = [];
  const pageSize = 500;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("user_id, lemon_squeezy_subscription_id")
      .is("subscription_started_at", null)
      .order("user_id", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error("Could not load subscriptions for backfill.");
    }

    subscriptions.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
    offset += pageSize;
  }

  const results = {
    scanned: subscriptions.length,
    populated: 0,
    missingProviderIds: 0,
    providerLookupFailures: 0,
    databaseFailures: 0,
    concurrentlyPopulatedOrRemoved: 0,
  };

  for (const subscription of subscriptions) {
    const subscriptionId = subscription.lemon_squeezy_subscription_id;
    if (!subscriptionId) {
      results.missingProviderIds += 1;
      continue;
    }

    let response;
    try {
      response = await fetch(
        `https://api.lemonsqueezy.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`,
        {
          headers: {
            Accept: "application/vnd.api+json",
            Authorization: `Bearer ${lemonApiKey}`,
          },
          signal: AbortSignal.timeout(15000),
        }
      );
    } catch {
      results.providerLookupFailures += 1;
      continue;
    }

    if (!response.ok) {
      results.providerLookupFailures += 1;
      continue;
    }

    let providerData;
    try {
      providerData = await response.json();
    } catch {
      results.providerLookupFailures += 1;
      continue;
    }

    const createdAt = providerData?.data?.attributes?.created_at;
    const providerId = providerData?.data?.id?.toString();
    if (
      providerId !== subscriptionId.toString() ||
      typeof createdAt !== "string" ||
      Number.isNaN(new Date(createdAt).getTime())
    ) {
      results.providerLookupFailures += 1;
      continue;
    }

    const { data: updatedRows, error: updateError } = await supabase
      .from("subscriptions")
      .update({ subscription_started_at: createdAt })
      .eq("user_id", subscription.user_id)
      .eq("lemon_squeezy_subscription_id", subscriptionId)
      .is("subscription_started_at", null)
      .select("user_id");

    if (updateError) {
      results.databaseFailures += 1;
    } else if (updatedRows?.length) {
      results.populated += updatedRows.length;
    } else {
      results.concurrentlyPopulatedOrRemoved += 1;
    }
  }

  console.log(JSON.stringify(results, null, 2));
  if (results.providerLookupFailures || results.databaseFailures) {
    process.exitCode = 1;
  }
}

main().catch(() => {
  console.error("Subscription-start backfill did not complete.");
  process.exitCode = 1;
});
