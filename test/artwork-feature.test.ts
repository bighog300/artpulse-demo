import test from "node:test";
import assert from "node:assert/strict";
import { getNavItems } from "@/components/navigation/nav-config";
import { artworkListQuerySchema } from "@/lib/validators";

test("navigation includes artwork tab", () => {
  const publicItems = getNavItems(false);
  assert.equal(publicItems.some((item) => item.href === "/artwork"), true);
});

test("artwork list query schema caps page size", () => {
  const parsed = artworkListQuerySchema.safeParse({ pageSize: "200" });
  assert.equal(parsed.success, false);
});
