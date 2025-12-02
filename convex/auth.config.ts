import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: process.env.AUTH0_DOMAIN!,
      applicationID: process.env.AUTH0_CLIENTID!,
    },
  ],
} satisfies AuthConfig;



