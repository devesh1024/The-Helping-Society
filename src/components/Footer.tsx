import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 mt-20">
      <div className="container py-10 grid gap-6 md:grid-cols-3">
        <div className="flex items-start gap-3">
          <Logo className="h-10 w-10" />
          <div>
            <p className="font-display font-bold text-foreground">The Helping Society</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Verified college community for students, alumni & faculty of UECU.
            </p>
          </div>
        </div>
        <div>
          <p className="font-semibold text-sm mb-2">Modules</p>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li>Resource Hub</li>
            <li>Opportunities</li>
            <li>Community</li>
            <li>Support</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-sm mb-2">Verified domain</p>
          <p className="text-sm text-muted-foreground">
            Only <span className="text-primary font-medium">@uecu.ac.in</span> emails get full access.
          </p>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} The Helping Society. Built with care.
      </div>
    </footer>
  );
}
