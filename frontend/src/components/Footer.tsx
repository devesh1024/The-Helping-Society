import { Link } from "react-router-dom";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 mt-20">
      <div className="container py-10 grid gap-6 md:grid-cols-5">
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
          <ul className="text-sm text-muted-foreground space-y-1.5 flex flex-col">
            <li><Link to="/resources" className="hover:text-primary transition-smooth">Resource Hub</Link></li>
            <li><Link to="/opportunities" className="hover:text-primary transition-smooth">Opportunities</Link></li>
            <li><Link to="/community" className="hover:text-primary transition-smooth">Community</Link></li>
            <li><Link to="/support" className="hover:text-primary transition-smooth">Support</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-sm mb-2">Legal</p>
          <ul className="text-sm text-muted-foreground space-y-1.5 flex flex-col">
            <li><Link to="/legal/privacy" className="hover:text-primary transition-smooth">Privacy Policy</Link></li>
            <li><Link to="/legal/terms" className="hover:text-primary transition-smooth">Terms & Conditions</Link></li>
            <li><Link to="/legal/cookies" className="hover:text-primary transition-smooth">Cookie Policy</Link></li>
            <li><Link to="/legal/disclaimer" className="hover:text-primary transition-smooth">Disclaimer</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-sm mb-2">Quick Contact</p>
          <ul className="text-sm text-muted-foreground space-y-2 flex flex-col">
            <li className="leading-relaxed">
              📍 The Helping Society<br />
              <span className="pl-5 block">
                Ujjain Engineering College,<br />
                Indore-Ujjain Road,<br />
                Ujjain, MP 456010
              </span>
            </li>
            <li>
              📞 <a href="tel:+919407097642" className="hover:text-primary transition-smooth">+91+91 94070 97642</a>
            </li>
            <li>
              💬 <a href="https://wa.me/917879453082" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-smooth">+917879453082</a>
            </li>
            <li>
              ✉ <a href="mailto:support@thehelpingsociety.in" className="hover:text-primary transition-smooth">support@thehelpingsociety.in</a>
            </li>
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
