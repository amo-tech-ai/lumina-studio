import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mocked Hyperdrive binding — structurally identical to the real `Hyperdrive`
// runtime binding's `connectionString` field (workers-types), without needing
// the generated cloudflare-env types. Mirrors the official Vitest Hyperdrive
// recipe's approach of injecting a connection string in place of the binding.
const FAKE_HYPERDRIVE = { connectionString: "postgres://user:pass@127.0.0.1:5432/db" };

describe("queryFresh (IPI-620 Part A)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.doUnmock("pg");
    vi.resetModules();
    vi.restoreAllMocks();
  });

  async function loadHelper(client: {
    connect: ReturnType<typeof vi.fn>;
    query: ReturnType<typeof vi.fn>;
    end: ReturnType<typeof vi.fn>;
  }) {
    const ClientCtor = vi.fn(() => client);
    vi.doMock("pg", () => ({ Client: ClientCtor }));
    const mod = await import("./hyperdrive-query");
    return { ...mod, ClientCtor };
  }

  it("connects with hyperdrive.connectionString and runs a parameterized query", async () => {
    const client = {
      connect: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue({ rows: [{ id: 1, name: "brand" }] }),
      end: vi.fn().mockResolvedValue(undefined),
    };
    const { queryFresh, ClientCtor } = await loadHelper(client);

    const rows = await queryFresh(FAKE_HYPERDRIVE, "SELECT * FROM brands WHERE id = $1", [1]);

    expect(ClientCtor).toHaveBeenCalledWith({ connectionString: FAKE_HYPERDRIVE.connectionString });
    expect(client.connect).toHaveBeenCalledTimes(1);
    expect(client.query).toHaveBeenCalledWith("SELECT * FROM brands WHERE id = $1", [1]);
    expect(rows).toEqual([{ id: 1, name: "brand" }]);
    // Workers auto-clean Hyperdrive edge clients — do not call end().
    expect(client.end).not.toHaveBeenCalled();
  });

  it("does not call client.end() after a successful query", async () => {
    const client = {
      connect: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue({ rows: [] }),
      end: vi.fn().mockResolvedValue(undefined),
    };
    const { queryFresh } = await loadHelper(client);

    await queryFresh(FAKE_HYPERDRIVE, "SELECT 1");

    expect(client.end).not.toHaveBeenCalled();
  });

  it("sanitizes the error message and does not call end() on query failure", async () => {
    const client = {
      connect: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockRejectedValue(
        new Error(`syntax error at or near "FORM" — connectionString=postgres://user:secret@host/db`),
      ),
      end: vi.fn().mockResolvedValue(undefined),
    };
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { queryFresh } = await loadHelper(client);

    await expect(queryFresh(FAKE_HYPERDRIVE, "SELECT * FORM brands")).rejects.toThrow(
      "Database query failed",
    );
    await expect(queryFresh(FAKE_HYPERDRIVE, "SELECT * FORM brands")).rejects.not.toThrow(/secret/);
    expect(client.end).not.toHaveBeenCalled();
  });

  it("does not call end() when connect() itself fails", async () => {
    const client = {
      connect: vi.fn().mockRejectedValue(new Error("connection refused")),
      query: vi.fn(),
      end: vi.fn().mockResolvedValue(undefined),
    };
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { queryFresh } = await loadHelper(client);

    await expect(queryFresh(FAKE_HYPERDRIVE, "SELECT 1")).rejects.toThrow("Database query failed");
    expect(client.query).not.toHaveBeenCalled();
    expect(client.end).not.toHaveBeenCalled();
  });
});
