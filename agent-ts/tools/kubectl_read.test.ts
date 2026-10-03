import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertKubectlReadAllowed, parseKubectlArgs } from "./kubectl_read.js";

describe("kubectl_read allowlist", () => {
  it("allows read verbs", () => {
    assert.equal(assertKubectlReadAllowed("get pods -n tenant-a"), null);
    assert.equal(assertKubectlReadAllowed("describe pod cart -n tenant-a"), null);
    assert.equal(assertKubectlReadAllowed("logs deploy/frontend -n tenant-a --tail=50"), null);
    assert.equal(assertKubectlReadAllowed("top pods -n tenant-a"), null);
    assert.equal(assertKubectlReadAllowed("events -n tenant-a"), null);
  });

  it("blocks writes and secrets", () => {
    assert.match(assertKubectlReadAllowed("apply -f x.yaml") ?? "", /İzin yok/);
    assert.match(assertKubectlReadAllowed("delete pod x -n tenant-a") ?? "", /İzin yok/);
    assert.match(assertKubectlReadAllowed("get secret db -n tenant-a") ?? "", /İzin yok/);
    assert.match(assertKubectlReadAllowed("") ?? "", /İzin yok/);
  });

  it("tokenizes args", () => {
    assert.deepEqual(parseKubectlArgs("  get   pods -n tenant-a "), [
      "get",
      "pods",
      "-n",
      "tenant-a",
    ]);
  });
});
