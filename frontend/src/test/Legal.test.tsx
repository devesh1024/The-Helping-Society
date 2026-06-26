import { vi, describe, test, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Legal from "../pages/Legal";

// Mock AuthContext
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    roles: [],
    adminType: null,
    loading: false,
    isVerified: false,
    isAdmin: false,
    isSuperAdmin: false,
    isKhabri: false,
    signOut: vi.fn(),
    refresh: vi.fn(),
    signIn: vi.fn(),
  }),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Legal Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("fetches and renders document content successfully", async () => {
    const mockMarkdown = `# Privacy Policy\nLast Updated: 26 June 2026\n\nThis is privacy policy content.\n\n## Section 1: Data Usage\nWe only use data to verify college accounts.`;
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => mockMarkdown,
    });

    render(
      <MemoryRouter initialEntries={["/legal/privacy"]}>
        <Routes>
          <Route path="/legal/:docId" element={<Legal />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify loading spinner is displayed initially
    expect(screen.getByRole("progressbar", { name: "Reading progress" })).toBeInTheDocument();

    // Wait for the document content to load and render
    await waitFor(() => {
      expect(screen.getByText(/privacy policy content/i)).toBeInTheDocument();
    });

    // Check headings and metadata
    expect(screen.getByRole("heading", { level: 1, name: "Privacy Policy" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Section 1: Data Usage" })).toBeInTheDocument();
    expect(screen.getByText("Updated: 26 June 2026")).toBeInTheDocument();
    expect(screen.getByText("Reading Time: 1 min")).toBeInTheDocument();

    // Verify TOC sidebar links are present
    const tocLink = screen.getByRole("link", { name: "Section 1: Data Usage" });
    expect(tocLink).toBeInTheDocument();
    expect(tocLink).toHaveAttribute("href", "#section-1-data-usage");
  });

  test("renders error message when document fetch fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network Error"));

    render(
      <MemoryRouter initialEntries={["/legal/privacy"]}>
        <Routes>
          <Route path="/legal/:docId" element={<Legal />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Error Loading Document" })).toBeInTheDocument();
    });
    
    expect(screen.getByText("Network Error")).toBeInTheDocument();
  });

  test("redirects to privacy policy when document ID is invalid", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => "# Privacy Policy\nSome content",
    });

    render(
      <MemoryRouter initialEntries={["/legal/invalid-doc-id"]}>
        <Routes>
          <Route path="/legal" element={<Legal />} />
          <Route path="/legal/:docId" element={<Legal />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for it to redirect and load privacy policy
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/legal/privacy_policy.md");
    });
  });

  test("redirects to privacy policy when visiting base path", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => "# Privacy Policy\nSome content",
    });

    render(
      <MemoryRouter initialEntries={["/legal"]}>
        <Routes>
          <Route path="/legal" element={<Legal />} />
          <Route path="/legal/:docId" element={<Legal />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/legal/privacy_policy.md");
    });
  });
});
