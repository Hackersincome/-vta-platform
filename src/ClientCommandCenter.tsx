import { ArrowRight, ArrowUpRight, ArrowDownRight, CircleHelp, Clock3, Globe2, ShieldCheck, TerminalSquare, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';
import './vta-experience.css';

const accountReadouts = [
  { label: 'Trading accounts', value: '—', note: 'No account connected' },
  { label: 'Total balance', value: '—', note: 'Requires account access' },
  { label: 'Total equity', value: '—', note: 'Requires live account data' },
];

export default function ClientCommandCenter() {
  return (
    <div className="client-command">
      <section className="client-command__hero" aria-labelledby="client-command-title">
        <img className="client-command__earth" src="/assets/nasa-black-marble.jpg" alt="" />
        <div className="client-command__hero-shade" />
        <div className="client-command__hero-copy">
          <span className="eyebrow">VTA / PRIVATE CLIENT ENVIRONMENT</span>
          <div className="client-command__hero-state"><i /> PREVIEW · ACCOUNT NOT CONNECTED</div>
          <h2 id="client-command-title">A clearer view<br /><span>of your trading world.</span></h2>
          <p>Your account context, funding actions and trading tools belong in one considered workspace. Connect an approved account to see verified financial information.</p>
          <div className="client-command__hero-actions">
            <Link className="button" to="/portal/accounts">Explore accounts <ArrowRight size={16} /></Link>
            <Link className="client-command__text-link" to="/portal/terminal">VTA Web Trading Terminal <ArrowUpRight size={15} /></Link>
          </div>
        </div>
        <div className="client-command__hero-coordinate" aria-hidden="true">VTA / CLIENT 01<br />GLOBAL MARKETS</div>
      </section>

      <section className="client-command__account" aria-labelledby="client-account-title">
        <div className="client-command__section-intro">
          <div>
            <span className="eyebrow">ACCOUNT OVERVIEW</span>
            <h3 id="client-account-title">One account view. No invented numbers.</h3>
          </div>
          <span className="client-command__unavailable"><ShieldCheck size={14} /> VERIFIED DATA REQUIRED</span>
        </div>
        <div className="client-command__readouts">
          {accountReadouts.map((item) => (
            <div className="client-command__readout" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.note}</small>
            </div>
          ))}
        </div>
        <p className="client-command__account-note"><WalletCards size={15} /> No trading account is linked to this preview session. Balances, equity, margin and performance are unavailable.</p>
      </section>

      <section className="client-command__workspace" aria-label="Client actions and trading workspace">
        <div className="client-command__funds">
          <span className="eyebrow">ACCOUNT OPERATIONS</span>
          <h3>Move with clarity.</h3>
          <p>Deposit, withdrawal and transaction records stay attached to an eligible trading account.</p>
          <div className="client-command__action-links">
            <Link to="/portal/deposit"><span><ArrowDownRight size={16} /> Deposit</span><ArrowRight size={15} /></Link>
            <Link to="/portal/withdraw"><span><ArrowUpRight size={16} /> Withdraw</span><ArrowRight size={15} /></Link>
            <Link to="/portal/transactions"><span><Clock3 size={16} /> Transactions</span><ArrowRight size={15} /></Link>
          </div>
        </div>
        <div className="client-command__tools">
          <span className="eyebrow">VTA WEB TRADING TERMINAL</span>
          <h3>Research and trading tools.</h3>
          <p>The terminal includes market tools and VTA’s proprietary Momentum Booster automation. No broker is connected in this preview.</p>
          <div className="client-command__tool-links">
            <Link to="/portal/terminal"><TerminalSquare size={17} /><span><strong>VTA Web Trading Terminal</strong><small>Market workspace · Momentum Booster · preview only</small></span><ArrowUpRight size={14} /></Link>
          </div>
        </div>
      </section>

      <section className="client-command__market" aria-label="Market context">
        <div><Globe2 size={17} /><span className="eyebrow">GLOBAL MARKET CONTEXT</span></div>
        <p>Forex <i /> Gold <i /> Crypto <i /> Indices <span>Market data not connected</span></p>
        <Link to="/portal/markets" aria-label="Market information"><CircleHelp size={16} /></Link>
      </section>
    </div>
  );
}
