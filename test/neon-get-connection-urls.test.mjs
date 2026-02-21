import test from "node:test";
import assert from "node:assert/strict";

import { selectConnectionHosts } from "../scripts/neon/get-connection-urls.mjs";

test("selectConnectionHosts prefers non-pooler for direct_url and pooler for database_url", () => {
  const endpoints = [
    {
      id: "ep_direct",
      branch_id: "br_123",
      type: "read_write",
      host: "ep-cool-grass-123.eu-west-2.aws.neon.tech",
      pooler_enabled: false,
    },
    {
      id: "ep_pooler",
      branch_id: "br_123",
      type: "read_write",
      host: "ep-cool-grass-123-pooler.eu-west-2.aws.neon.tech",
      pooler_enabled: true,
    },
  ];

  const selected = selectConnectionHosts(endpoints, "br_123");

  assert.equal(selected.directHost, "ep-cool-grass-123.eu-west-2.aws.neon.tech");
  assert.equal(selected.pooledHost, "ep-cool-grass-123-pooler.eu-west-2.aws.neon.tech");
});
