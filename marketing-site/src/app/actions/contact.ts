"use server";

export async function submitContactForm(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const message = formData.get("message") as string;

  if (!name || !email || !message) {
    return { success: false, error: "All fields are required" };
  }

  // Uses local environment variable MAKE_WEBHOOK_URL
  const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL;

  if (makeWebhookUrl) {
    try {
      const response = await fetch(makeWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, message }),
      });

      if (!response.ok) {
        throw new Error("Failed to dispatch to Make.com webhook");
      }
    } catch (error) {
      console.error("Webhook Error:", error);
      return { success: false, error: "Failed to dispatch email automation" };
    }
  } else {
    console.warn("MAKE_WEBHOOK_URL is not defined in .env.local. Simulating a successful submission.");
  }

  return { success: true };
}
