import { describe, expect, test, vi } from "vitest";
import { StripeSubscriptions, registerRoutes } from "./index.js";
import { components } from "./setup.test.js";

const stripeMocks = vi.hoisted(() => ({
  construct: vi.fn(),
  createCheckoutSession: vi.fn(),
  retrieveSubscription: vi.fn(),
  updateSubscriptionItem: vi.fn(),
}));

vi.mock("stripe", () => ({
  default: vi.fn().mockImplementation(function (apiKey, config) {
    stripeMocks.construct(apiKey, config);
    return {
      checkout: {
        sessions: {
          create: stripeMocks.createCheckoutSession,
        },
      },
      subscriptions: {
        retrieve: stripeMocks.retrieveSubscription,
      },
      subscriptionItems: {
        update: stripeMocks.updateSubscriptionItem,
      },
    };
  }),
}));

describe("StripeSubscriptions client", () => {
  test("should create Stripe client with component", async () => {
    const client = new StripeSubscriptions(components.stripe);
    expect(client).toBeDefined();
    expect(client.component).toBeDefined();
  });

  test("should accept STRIPE_SECRET_KEY option", async () => {
    const client = new StripeSubscriptions(components.stripe, {
      STRIPE_SECRET_KEY: "sk_test_123",
    });
    expect(client).toBeDefined();
    // The apiKey getter should return the provided key
    expect(client.apiKey).toBe("sk_test_123");
  });

  test("should pass Stripe SDK config to created clients", async () => {
    const client = new StripeSubscriptions(components.stripe, {
      STRIPE_SECRET_KEY: "sk_test_123",
      stripeConfig: { apiVersion: "2025-10-29.clover" },
    });

    client.getStripe();

    expect(stripeMocks.construct).toHaveBeenCalledWith("sk_test_123", {
      apiVersion: "2025-10-29.clover",
    });
  });

  test("should pass through additional checkout session params", async () => {
    stripeMocks.createCheckoutSession.mockResolvedValue({
      id: "cs_test_123",
      url: "https://checkout.stripe.test/session",
    });

    const ctx = {
      runAction: vi.fn(),
      runMutation: vi.fn(),
      runQuery: vi.fn(),
    };
    const client = new StripeSubscriptions(components.stripe, {
      STRIPE_SECRET_KEY: "sk_test_123",
    });

    const session = await client.createCheckoutSession(ctx, {
      priceId: "price_test",
      customerId: "cus_test",
      mode: "subscription",
      successUrl: "https://example.com/success",
      cancelUrl: "https://example.com/cancel",
      subscriptionMetadata: { userId: "user_123" },
      additionalParams: {
        allow_promotion_codes: true,
        automatic_tax: { enabled: true },
      },
    });

    expect(session).toEqual({
      sessionId: "cs_test_123",
      url: "https://checkout.stripe.test/session",
    });
    expect(stripeMocks.createCheckoutSession).toHaveBeenCalledWith({
      mode: "subscription",
      line_items: [{ price: "price_test", quantity: 1 }],
      success_url: "https://example.com/success",
      cancel_url: "https://example.com/cancel",
      metadata: {},
      customer: "cus_test",
      subscription_data: { metadata: { userId: "user_123" } },
      allow_promotion_codes: true,
      automatic_tax: { enabled: true },
    });
  });

  test("should throw error when accessing apiKey without key set", async () => {
    // Clear the environment variable temporarily
    const originalKey = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;

    const client = new StripeSubscriptions(components.stripe);

    expect(() => client.apiKey).toThrow(
      "STRIPE_SECRET_KEY environment variable is not set",
    );

    // Restore the environment variable
    if (originalKey) {
      process.env.STRIPE_SECRET_KEY = originalKey;
    }
  });

  test("should update Stripe then sync quantity via internal mutation", async () => {
    stripeMocks.retrieveSubscription.mockResolvedValue({
      items: { data: [{ id: "si_test_123" }] },
    });
    stripeMocks.updateSubscriptionItem.mockResolvedValue({});

    const ctx = {
      runAction: vi.fn(),
      runMutation: vi.fn().mockResolvedValue(null),
      runQuery: vi.fn(),
    };
    const client = new StripeSubscriptions(components.stripe, {
      STRIPE_SECRET_KEY: "sk_test_123",
    });

    await client.updateSubscriptionQuantity(ctx, {
      stripeSubscriptionId: "sub_test_123",
      quantity: 7,
    });

    expect(stripeMocks.retrieveSubscription).toHaveBeenCalledWith(
      "sub_test_123",
    );
    expect(stripeMocks.updateSubscriptionItem).toHaveBeenCalledWith(
      "si_test_123",
      { quantity: 7 },
    );
    expect(ctx.runMutation).toHaveBeenCalledWith(
      components.stripe.private.updateSubscriptionQuantityInternal,
      {
        stripeSubscriptionId: "sub_test_123",
        quantity: 7,
      },
    );
    expect(ctx.runAction).not.toHaveBeenCalled();
  });
});

describe("registerRoutes", () => {
  test("registerRoutes function should be exported", () => {
    expect(typeof registerRoutes).toBe("function");
  });
});
