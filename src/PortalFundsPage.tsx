import { ArrowRight, Banknote, CircleHelp, Clock3, CreditCard, LockKeyhole, ShieldCheck, WalletCards } from 'lucide-react';

type FundsView = 'Wallet' | 'Deposit' | 'Withdraw' | 'Transactions';

const methodOptions = [
  { label: 'Bank', description: 'Bank transfer', icon: Banknote },
  { label: 'Card', description: 'Cards', icon: CreditCard },
  { label: 'Cryptocurrency', description: 'USDT', icon: WalletCards },
];

export default function PortalFundsPage({ active }: { active: FundsView }) {
  const withdrawal = active === 'Withdraw';
  const title = withdrawal ? 'Withdraw from your trading account.' : active === 'Deposit' ? 'Funding, with a clear account context.' : active === 'Transactions' ? 'Account activity, when connected.' : 'Your funds, in one place.';

  return (
    <div className="portal-funds">
      <header className="portal-funds__intro">
        <div>
          <span className="eyebrow">CLIENT OPERATIONS / {active.toUpperCase()}</span>
          <h2>{title}</h2>
          <p>{withdrawal ? 'Withdrawals are tied to a selected trading account. Choose the account first; its verified balance, equity and available funds will appear before you choose a method.' : 'Financial information and payment actions only appear when they can be verified against a connected account and provider.'}</p>
        </div>
        <span className="portal-funds__state"><i /> PREVIEW · NOT CONNECTED</span>
      </header>

      {active === 'Transactions' ? (
        <section className="portal-funds__empty" aria-label="Transactions unavailable">
          <ClockMark />
          <div><span className="eyebrow">ACCOUNT ACTIVITY</span><h3>No verified transactions</h3><p>Transaction history will appear after an approved account and funding provider are connected. Nothing is simulated here.</p></div>
        </section>
      ) : active === 'Wallet' ? (
        <section className="portal-funds__empty" aria-label="Wallet unavailable">
          <WalletCards size={20} />
          <div><span className="eyebrow">CLIENT WALLET</span><h3>No connected wallet</h3><p>Wallet balances and addresses are unavailable. This preview does not create wallet addresses or hold funds.</p></div>
        </section>
      ) : (
        <>
          <section className="portal-funds__account" aria-labelledby="funding-account-title">
            <div className="portal-funds__account-heading">
              <span className="portal-funds__step">01</span>
              <div><span className="eyebrow">TRADING ACCOUNT</span><h3 id="funding-account-title">Select an account to continue</h3></div>
            </div>
            <label className="portal-funds__select-label" htmlFor="funding-account">ACCOUNT</label>
            <select id="funding-account" aria-label="Trading account" disabled defaultValue="">
              <option value="">No trading account connected</option>
            </select>
            <p className="portal-funds__account-note"><ShieldCheck size={15} /> Account selection is unavailable until a verified trading account is linked.</p>
          </section>

          {withdrawal && (
            <section className="portal-funds__context" aria-label="Selected account financial context">
              <div><span>Balance</span><strong>—</strong><small>Unavailable</small></div>
              <div><span>Equity</span><strong>—</strong><small>Unavailable</small></div>
              <div><span>Available to withdraw</span><strong>—</strong><small>Cannot be confirmed</small></div>
            </section>
          )}

          <section className={`portal-funds__methods${withdrawal ? ' portal-funds__methods--withdraw' : ''}`} aria-labelledby="funding-method-title">
            <div className="portal-funds__methods-heading">
              <span className="portal-funds__step">02</span>
              <div><span className="eyebrow">PAYMENT METHOD</span><h3 id="funding-method-title">Choose a method</h3><p>{withdrawal ? 'Methods unlock after you select a connected trading account.' : 'Payment setup is not available until an account and payment provider are connected.'}</p></div>
              <LockKeyhole size={16} aria-label="Payment methods unavailable" />
            </div>
            <div className="portal-funds__method-list">
              {methodOptions.map(({ label, description, icon: Icon }) => (
                <div className="portal-funds__method" key={label} aria-disabled="true">
                  <span className="portal-funds__method-icon"><Icon size={19} /></span>
                  <span className="portal-funds__method-copy"><strong>{label}</strong><small>{description}</small></span>
                  {label === 'Card' ? <span className="portal-funds__card-brands"><img src="/assets/payment/visa.svg" alt="Visa" /><img src="/assets/payment/mastercard.svg" alt="Mastercard" /></span> : label === 'Cryptocurrency' ? <span className="portal-funds__usdt"><img src="/assets/payment/tether.svg" alt="" />USDT</span> : <span className="portal-funds__method-state">NOT CONNECTED</span>}
                  <ArrowRight size={15} />
                </div>
              ))}
            </div>
            <p className="portal-funds__truth-note"><CircleHelp size={15} /> No deposits, withdrawals, wallet addresses or payment instructions are generated in this environment.</p>
          </section>
        </>
      )}
    </div>
  );
}

function ClockMark() {
  return <span className="portal-funds__clock-mark" aria-hidden="true"><Clock3 size={19} /></span>;
}
