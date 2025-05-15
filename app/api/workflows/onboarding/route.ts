import { serve } from "@upstash/workflow/nextjs";
import { eq } from "drizzle-orm";

import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import config from "@/lib/config";

type UserState = "non-active" | "active";

type InitialData = {
  email: string;
  fullName: string;
};

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
const THREE_DAYS_IN_MS = 3 * ONE_DAY_IN_MS;
const THIRTY_DAYS_IN_MS = 30 * ONE_DAY_IN_MS;

const getUserState = async (email: string): Promise<UserState> => {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (user.length === 0) return "non-active";

  const lastActivityDate = new Date(user[0].lastActivityDate!);
  const now = new Date();
  const timeDifference = now.getTime() - lastActivityDate.getTime();

  if (
    timeDifference > THREE_DAYS_IN_MS &&
    timeDifference <= THIRTY_DAYS_IN_MS
  ) {
    return "non-active";
  }

  return "active";
};

export const { POST } = serve<InitialData>(async (context) => {
  const { email, fullName } = context.requestPayload;

  //welcom Email
  await context.api.resend.call("new-signup", {
    token: config.env.resendToken,
    body: {
      from: "Welcom <welcome@danielportfolio.ca>",
      to: [email],
      subject: "Welcome to BookWise",
      html: `<p>Welcome ${fullName}!</p>`,
    },
    headers: {
      "content-type": "application/json",
    },
  });

  await context.sleep("wait-for-3-days", 60 * 60 * 24 * 3);

  while (true) {
    const state = await context.run("check-user-state", async () => {
      return await getUserState(email);
    });

    if (state === "non-active") {
      await context.api.resend.call("send-email-non-active", {
        token: config.env.resendToken,
        body: {
          from: "Welcom <welcome@danielportfolio.ca>",
          to: [email],
          subject: "Long Time No See On Bookwise",
          html: `<p>Hi ${fullName}! It's time to get some new books.</p>`,
        },
        headers: {
          "content-type": "application/json",
        },
      });
    } else if (state === "active") {
      await context.api.resend.call("send-email-active", {
        token: config.env.resendToken,
        body: {
          from: "Welcom <welcome@danielportfolio.ca>",
          to: [email],
          subject: "Well done!",
          html: `<p>Hi ${fullName}!Check our new books.</p>`,
        },
        headers: {
          "content-type": "application/json",
        },
      });
    }

    await context.sleep("wait-for-1-month", 60 * 60 * 24 * 30);
  }
});
