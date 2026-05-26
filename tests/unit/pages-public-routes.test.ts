import express from "express";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const storageMock = {
  getPages: vi.fn(),
  getPage: vi.fn(),
  getPageBySlug: vi.fn(),
  getPageBlocks: vi.fn(),
};

vi.mock("../../server/storage", () => ({
  storage: storageMock,
}));

const { default: pagesRouter } = await import("../../server/routes/pages");

describe("public pages router", () => {
  let server: ReturnType<express.Express["listen"]>;
  let baseUrl: string;

  beforeEach(() => {
    vi.clearAllMocks();
    const app = express();
    app.use("/api/pages", pagesRouter);
    server = app.listen(0);
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  });

  it("filters out hidden and draft pages from the public listing", async () => {
    storageMock.getPages.mockResolvedValue([
      { id: 1, slug: "home", isVisible: true, isDraft: false },
      { id: 2, slug: "eventi", isVisible: false, isDraft: false },
      { id: 3, slug: "preview", isVisible: true, isDraft: true },
    ]);

    const response = await fetch(`${baseUrl}/api/pages`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual([{ id: 1, slug: "home", isVisible: true, isDraft: false }]);
  });

  it("does not expose blocks for a hidden page requested by numeric id", async () => {
    storageMock.getPage.mockResolvedValue({
      id: 5,
      slug: "eventi",
      isVisible: false,
      isDraft: false,
    });

    const response = await fetch(`${baseUrl}/api/pages/5/blocks`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual([]);
    expect(storageMock.getPageBlocks).not.toHaveBeenCalled();
  });

  it("does not expose blocks for a draft page requested by numeric id", async () => {
    storageMock.getPage.mockResolvedValue({
      id: 7,
      slug: "preview",
      isVisible: true,
      isDraft: true,
    });

    const response = await fetch(`${baseUrl}/api/pages/7/blocks`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual([]);
    expect(storageMock.getPageBlocks).not.toHaveBeenCalled();
  });
});
