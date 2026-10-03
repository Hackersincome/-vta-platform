import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import QRCode from 'react-qr-code';
import {
  ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUpRight, Banknote, Check, CheckCircle2,
  CircleAlert, Clock3, Copy, CreditCard, FileCheck2, Landmark, LockKeyhole, ReceiptText,
  ShieldCheck, Upload, WalletCards, X,
} from 'lucide-react';
import './portal-funds.css';

type FundsView = 'Wallet' | 'Deposit' | 'Withdraw' | 'Transactions';
type FundingMethod = 'Bank Transfer' | 'Cryptocurrency' | 'Cards';
type CryptoAsset = 'USDT' | 'BTC' | 'ETH';
type FundingStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed';
type FlowStep = 'method' | 'option' | 'network' | 'details' | 'review' | 'processing' | 'result';
type OutcomeChoice = 'Pending' | 'Completed' | 'Failed';

type FundingTransaction = {
  id: string;
  type: 'Deposit' | 'Withdrawal';
  method: FundingMethod;
  asset: string;
  network: string;
  amount: number;
  fee: number;
  currency: string;
  createdAt: string;
  status: FundingStatus;
  details: { label: string; value: string }[];
};

const TRANSACTION_STORAGE_KEY = 'vta-funding-sandbox-history-v1';
const ASSETS: { code: CryptoAsset; name: string; logo: string; description: string }[] = [
  { code: 'USDT', name: 'Tether', logo: 'tether', description: 'USD-pegged stablecoin' },
  { code: 'BTC', name: 'Bitcoin', logo: 'bitcoin', description: 'Bitcoin network' },
  { code: 'ETH', name: 'Ethereum', logo: 'ethereum', description: 'Ethereum network' },
];
const NETWORKS: Record<CryptoAsset, { name: string; code: string; logo: string; eta: string; fee: number; minimum: number }[]> = {
  USDT: [
    { name: 'TRON', code: 'TRC20', logo: 'tron', eta: '2–10 min', fee: 1, minimum: 10 },
    { name: 'Ethereum', code: 'ERC20', logo: 'ethereum', eta: '5–30 min', fee: 4.5, minimum: 25 },
    { name: 'BNB Smart Chain', code: 'BEP20', logo: 'binance', eta: '2–8 min', fee: 0.8, minimum: 10 },
  ],
  BTC: [{ name: 'Bitcoin', code: 'BTC', logo: 'bitcoin', eta: '10–45 min', fee: 0.0001, minimum: 0.001 }],
  ETH: [{ name: 'Ethereum', code: 'ERC20', logo: 'ethereum', eta: '5–30 min', fee: 0.002, minimum: 0.01 }],
};
const BANK_OPTIONS = [
  { name: 'International wire', note: 'SWIFT · 1–3 business days' },
  { name: 'SEPA transfer', note: 'EUR · usually 1 business day' },
  { name: 'Local bank transfer', note: 'Availability depends on your bank' },
];
const CURRENCIES = ['USD', 'EUR', 'GBP'];
const METHOD_CARDS: { name: FundingMethod; description: string; icon: typeof Landmark }[] = [
  { name: 'Bank Transfer', description: 'Wire, SEPA or local bank rail', icon: Landmark },
  { name: 'Cryptocurrency', description: 'USDT, Bitcoin or Ethereum', icon: WalletCards },
  { name: 'Cards', description: 'Visa or Mastercard · sandbox only', icon: CreditCard },
];

function readDemoFundingTransactions(): FundingTransaction[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(TRANSACTION_STORAGE_KEY) || '[]');
    if (!Array.isArray(saved)) return [];
    return saved.filter(isFundingTransaction).slice(0, 100);
  } catch {
    return [];
  }
}

function saveDemoFundingTransactions(transactions: FundingTransaction[]) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(transactions.slice(0, 100)));
  } catch {
    // Session history is optional; a blocked browser storage API must not interrupt a sandbox flow.
  }
}

function isFundingTransaction(value: unknown): value is FundingTransaction {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<FundingTransaction>;
  return typeof item.id === 'string'
    && (item.type === 'Deposit' || item.type === 'Withdrawal')
    && ['Bank Transfer', 'Cryptocurrency', 'Cards'].includes(item.method || '')
    && typeof item.asset === 'string'
    && typeof item.network === 'string'
    && typeof item.amount === 'number'
    && typeof item.fee === 'number'
    && typeof item.currency === 'string'
    && typeof item.createdAt === 'string'
    && ['Pending', 'Processing', 'Completed', 'Failed'].includes(item.status || '')
    && Array.isArray(item.details);
}

export default function PortalFundsPage({ active }: { active: FundsView }) {
  const withdrawal = active === 'Withdraw';
  const [transactions, setTransactions] = useState<FundingTransaction[]>([]);
  const [step, setStep] = useState<FlowStep>('method');
  const [method, setMethod] = useState<FundingMethod | null>(null);
  const [option, setOption] = useState('');
  const [asset, setAsset] = useState<CryptoAsset>('USDT');
  const [networkCode, setNetworkCode] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [senderName, setSenderName] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [reference, setReference] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [txHash, setTxHash] = useState('');
  const [networkConfirmed, setNetworkConfirmed] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [cardholder, setCardholder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [sandboxOutcome, setSandboxOutcome] = useState<OutcomeChoice>('Pending');
  const [error, setError] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [modalTransaction, setModalTransaction] = useState<FundingTransaction | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentNetwork = NETWORKS[asset].find((item) => item.code === networkCode);
  const numericAmount = Number(amount);
  const fee = method === 'Cards'
    ? Math.round((numericAmount * 0.029 + 0.3) * 100) / 100
    : method === 'Cryptocurrency' && withdrawal && currentNetwork
      ? currentNetwork.fee
      : 0;
  const estimatedReceived = withdrawal ? numericAmount : Math.max(0, numericAmount - fee);
  const assetName = ASSETS.find((item) => item.code === asset)?.name || asset;
  const resultStatus = transactions.find((item) => item.id === transactionId)?.status || sandboxOutcome;

  useEffect(() => {
    setTransactions(readDemoFundingTransactions());
  }, []);

  useEffect(() => {
    setStep('method');
    setMethod(null);
    setOption('');
    setNetworkCode('');
    setAmount('');
    setSenderName('');
    setBeneficiaryName('');
    setBankName('');
    setAccountNumber('');
    setSwiftCode('');
    setReference('');
    setWalletAddress('');
    setTxHash('');
    setNetworkConfirmed(false);
    setCardholder('');
    setCardNumber('');
    setExpiry('');
    setCvv('');
    setProofFile(null);
    setError('');
    setTransactionId('');
    setModalTransaction(null);
    setIsLoading(false);
  }, [active]);

  useEffect(() => {
    if (!modalTransaction) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModalTransaction(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [modalTransaction]);

  const flowSteps = useMemo(() => method === 'Cryptocurrency'
    ? ['Method', 'Asset', 'Network', 'Details', 'Review', 'Status']
    : ['Method', 'Option', 'Details', 'Review', 'Status'], [method]);
  const stepIndex = step === 'method' ? 0
    : step === 'option' ? 1
      : step === 'network' ? 2
        : step === 'details' ? (method === 'Cryptocurrency' ? 3 : 2)
          : step === 'review' ? (method === 'Cryptocurrency' ? 4 : 3)
            : (method === 'Cryptocurrency' ? 5 : 4);

  function recordTransaction(transaction: FundingTransaction) {
    setTransactions((current) => {
      const updated = [transaction, ...current].slice(0, 100);
      saveDemoFundingTransactions(updated);
      return updated;
    });
  }

  function updateTransactionStatus(id: string, status: FundingStatus) {
    setTransactions((current) => {
      const updated = current.map((transaction) => transaction.id === id ? { ...transaction, status } : transaction);
      saveDemoFundingTransactions(updated);
      return updated;
    });
  }

  function chooseMethod(next: FundingMethod) {
    setMethod(next);
    setOption('');
    setNetworkCode('');
    setError('');
    setStep('option');
  }

  function chooseOption(next: string) {
    setOption(next);
    setError('');
    if (method === 'Cryptocurrency') {
      setAsset(next as CryptoAsset);
      setNetworkCode('');
      setStep('network');
      return;
    }
    setStep('details');
  }

  function handleProofChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    if (file && file.size > 5 * 1024 * 1024) {
      setError('Proof files must be 5 MB or smaller.');
      event.target.value = '';
      setProofFile(null);
      return;
    }
    if (file && !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      setError('Upload a PDF, JPG or PNG proof document.');
      event.target.value = '';
      setProofFile(null);
      return;
    }
    setError('');
    setProofFile(file);
  }

  function validateDetails() {
    const parsedAmount = Number(amount);
    if (!amount.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > 1_000_000) {
      return 'Enter an amount greater than zero and no more than 1,000,000.';
    }
    if (method === 'Cryptocurrency' && currentNetwork && parsedAmount < currentNetwork.minimum) {
      return `The sandbox minimum for this asset and network is ${currentNetwork.minimum} ${asset}.`;
    }
    if (method === 'Bank Transfer') {
      if (withdrawal && (!beneficiaryName.trim() || !bankName.trim() || !accountNumber.trim() || !swiftCode.trim())) {
        return 'Enter the beneficiary, bank, account/IBAN and SWIFT details to continue.';
      }
      if (withdrawal && !/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}(?:[A-Z0-9]{3})?$/i.test(swiftCode.trim())) {
        return 'Enter a valid 8 or 11 character SWIFT / BIC code.';
      }
      if (!withdrawal && !senderName.trim()) return 'Enter the sender name to continue.';
    }
    if (method === 'Cryptocurrency') {
      if (withdrawal && !isWalletAddressValid(walletAddress, asset, networkCode)) {
        return `Enter a valid ${asset} address for the selected ${networkCode} network.`;
      }
      if (!withdrawal && txHash.trim() && !/^(0x[a-fA-F0-9]{64}|[A-Za-z0-9]{32,100})$/.test(txHash.trim())) {
        return 'Enter a valid transaction hash or leave the field empty.';
      }
      if (withdrawal && !networkConfirmed) return 'Confirm the network and destination before continuing.';
    }
    if (method === 'Cards') {
      const digits = cardNumber.replace(/\D/g, '');
      if (!cardholder.trim()) return 'Enter the cardholder name.';
      if (!isLuhnValid(digits)) return 'Check the card number and try again.';
      if (option === 'Visa' && !digits.startsWith('4')) return 'Enter a Visa card number for this sandbox method.';
      if (option === 'Mastercard') {
        const twoDigitPrefix = Number(digits.slice(0, 2));
        const fourDigitPrefix = Number(digits.slice(0, 4));
        if (!((twoDigitPrefix >= 51 && twoDigitPrefix <= 55) || (fourDigitPrefix >= 2221 && fourDigitPrefix <= 2720))) {
          return 'Enter a Mastercard card number for this sandbox method.';
        }
      }
      if (!isExpiryValid(expiry)) return 'Enter a valid future expiry date in MM/YY format.';
      if (!/^\d{3,4}$/.test(cvv)) return 'Enter a valid 3 or 4 digit security code.';
    }
    return '';
  }

  function continueToReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateDetails();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setStep('review');
  }

  async function copySandboxReference() {
    try {
      await navigator.clipboard.writeText(`VTA-SANDBOX-NOT-A-WALLET:${asset}:${networkCode}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError('Clipboard access is unavailable in this browser.');
    }
  }

  function createTransactionId() {
    const suffix = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
      : Math.random().toString(36).slice(2, 10).toUpperCase();
    return `VTA-${Date.now().toString(36).toUpperCase()}-${suffix}`;
  }

  function submitSandboxTransaction() {
    if (isLoading || !method) return;
    setIsLoading(true);
    setError('');
    const id = createTransactionId();
    setTransactionId(id);
    const detailRows: FundingTransaction['details'] = [
      { label: 'Selected option', value: option },
      ...(method === 'Cryptocurrency' ? [{ label: 'Network', value: currentNetwork?.name || networkCode }] : []),
      ...(method === 'Bank Transfer' ? [{ label: 'Currency', value: currency }] : []),
      ...(method === 'Cards' ? [{ label: 'Card', value: `${option} · ending ${cardNumber.replace(/\D/g, '').slice(-4)}` }] : []),
      ...(method === 'Cryptocurrency' && withdrawal ? [{ label: 'Destination', value: `••••${walletAddress.slice(-6)}` }] : []),
      ...(method === 'Cryptocurrency' && !withdrawal ? [{ label: 'Deposit address', value: 'Not issued · sandbox only' }] : []),
      ...(method === 'Cryptocurrency' && !withdrawal && txHash ? [{ label: 'TXID', value: `••••${txHash.slice(-8)}` }] : []),
      ...(method === 'Bank Transfer' && withdrawal ? [{ label: 'Beneficiary details', value: 'Entered in this session · not retained' }] : []),
      ...(method === 'Bank Transfer' && !withdrawal ? [{ label: 'Sender details', value: 'Entered in this session · not retained' }] : []),
      ...(method === 'Bank Transfer' && !withdrawal && proofFile ? [{ label: 'Proof', value: 'Attached in this session · not retained' }] : []),
      ...(method === 'Cards' ? [{ label: 'Cardholder', value: 'Entered in this session · not retained' }] : []),
    ];
    const transaction: FundingTransaction = {
      id,
      type: withdrawal ? 'Withdrawal' : 'Deposit',
      method,
      asset: method === 'Cryptocurrency' ? asset : method === 'Cards' ? 'Card' : currency,
      network: method === 'Cryptocurrency' ? networkCode : '—',
      amount: numericAmount,
      fee: Math.round(fee * 100000000) / 100000000,
      currency: method === 'Cryptocurrency' ? asset : currency,
      createdAt: new Date().toISOString(),
      status: 'Processing',
      details: detailRows,
    };
    recordTransaction(transaction);
    setStep('processing');
    setTimeout(() => {
      updateTransactionStatus(id, sandboxOutcome);
      setIsLoading(false);
      setStep('result');
      setCardNumber('');
      setExpiry('');
      setCvv('');
      setProofFile(null);
    }, 1100);
  }

  function resetFlow() {
    setStep('method');
    setMethod(null);
    setOption('');
    setNetworkCode('');
    setAmount('');
    setSenderName('');
    setBeneficiaryName('');
    setBankName('');
    setAccountNumber('');
    setSwiftCode('');
    setReference('');
    setWalletAddress('');
    setTxHash('');
    setCardholder('');
    setError('');
    setTransactionId('');
    setProofFile(null);
    setCardNumber('');
    setExpiry('');
    setCvv('');
    setNetworkConfirmed(false);
    setSandboxOutcome('Pending');
  }

  const title = active === 'Transactions'
    ? 'A clear record of every sandbox request.'
    : withdrawal
      ? 'Withdraw with control.'
      : 'Fund with clarity.';

  return (
    <div className="portal-funds">
      <header className="portal-funds__intro">
        <div>
          <span className="eyebrow">CLIENT OPERATIONS / {active.toUpperCase()}</span>
          <h2>{title}</h2>
          <p>{active === 'Transactions'
            ? 'Review the funding activity created in this browser session. Records are sandbox-only and do not represent settled money.'
            : active === 'Wallet'
              ? 'Wallet balances and addresses only become available when a verified custody provider is connected.'
              : `${withdrawal ? 'Withdrawal' : 'Deposit'} workflows are available as a guided preview. No payment, bank or blockchain provider is connected.`}</p>
        </div>
        <span className="portal-funds__state"><i /> SANDBOX · NO LIVE PROVIDER</span>
      </header>

      {active === 'Transactions' ? (
        <TransactionsDashboard transactions={transactions} onOpen={setModalTransaction} />
      ) : active === 'Wallet' ? (
        <section className="portal-funds__empty" aria-label="Wallet provider unavailable">
          <WalletCards size={20} />
          <div><span className="eyebrow">CLIENT WALLET</span><h3>No custody provider connected</h3><p>This preview does not create wallet addresses, hold funds or display a live balance. Use the Deposit and Withdraw sandbox to explore the workflow safely.</p></div>
        </section>
      ) : (
        <>
          <section className="funding-banner" aria-label="Sandbox funding disclosure">
            <span className="funding-banner__icon"><ShieldCheck size={17} /></span>
            <span><strong>Sandbox preview</strong><small>No real money moves. Do not send funds, enter a production wallet, or use a real payment card.</small></span>
            {step !== 'method' && <button className="funding-text-button" type="button" onClick={resetFlow}><ArrowLeft size={14} /> Start over</button>}
          </section>

          <section className="funding-flow" aria-label={`${active} flow`}>
            <div className="funding-flow__heading">
              <div><span className="eyebrow">{withdrawal ? 'WITHDRAWAL REQUEST' : 'DEPOSIT REQUEST'} / PAPER LEDGER</span><h3>{step === 'result' ? 'Request recorded' : step === 'processing' ? 'Preparing sandbox status' : withdrawal ? 'Withdraw from your account' : 'Add funds to your account'}</h3></div>
              <span className="funding-preview-tag">PREVIEW ONLY</span>
            </div>

            <ol className="funding-progress" aria-label="Progress">
              {flowSteps.map((label, index) => <li className={index === stepIndex ? 'is-current' : index < stepIndex ? 'is-done' : ''} key={label} aria-current={index === stepIndex ? 'step' : undefined}><span>{index < stepIndex ? <Check size={13} /> : index + 1}</span><small>{label}</small></li>)}
            </ol>

            {step === 'method' && (
              <div className="funding-panel">
                <div className="funding-panel__intro"><span className="funding-step-label">STEP 01</span><h3>Choose a payment method</h3><p>Select one of the supported sandbox rails to see its available options.</p></div>
                <div className="funding-method-grid">
                  {METHOD_CARDS.map(({ name, description, icon: Icon }) => <button className="funding-method-card" type="button" key={name} onClick={() => chooseMethod(name)}>
                    <span className="funding-method-card__icon"><Icon size={19} /></span><span className="funding-method-card__copy"><strong>{name}</strong><small>{description}</small></span><ArrowRight size={16} />
                    {name === 'Cards' && <span className="funding-method-card__brands"><BrandLogo brand="visa" /><BrandLogo brand="mastercard" /></span>}
                    {name === 'Cryptocurrency' && <span className="funding-method-card__tokens"><BrandLogo brand="tether" /><BrandLogo brand="bitcoin" /><BrandLogo brand="ethereum" /></span>}
                  </button>)}
                </div>
                <p className="funding-honesty"><LockKeyhole size={14} /> This sandbox does not authorize, settle or transmit any transaction.</p>
              </div>
            )}

            {step === 'option' && method && (
              <div className="funding-panel">
                <div className="funding-panel__intro"><span className="funding-step-label">STEP 02 / {method.toUpperCase()}</span><h3>{method === 'Bank Transfer' ? 'Choose a transfer rail' : method === 'Cryptocurrency' ? 'Choose a crypto asset' : 'Choose your card network'}</h3><p>{method === 'Bank Transfer' ? 'Available transfer types are shown for review only; VTA bank instructions are not connected.' : method === 'Cryptocurrency' ? 'Select the asset first, then choose its exact blockchain network. This preview does not issue a receiving wallet.' : 'Select a card brand for the sandbox checkout. No card information is transmitted.'}</p></div>
                {method === 'Cryptocurrency' ? <div className="funding-asset-grid">{ASSETS.map((item) => <button type="button" key={item.code} className="funding-asset-option" onClick={() => chooseOption(item.code)}><BrandLogo brand={item.logo} large /><span><strong>{item.code}</strong><small>{item.name} · {item.description}</small></span><ArrowRight size={14} /></button>)}</div> : <div className="funding-option-list">
                  {method === 'Bank Transfer' ? BANK_OPTIONS.map((item) => <button type="button" key={item.name} className="funding-option" onClick={() => chooseOption(item.name)}><span className="funding-option__icon"><Banknote size={19} /></span><span><strong>{item.name}</strong><small>{item.note}</small></span><ArrowRight size={15} /></button>) : method === 'Cards' ? (['Visa', 'Mastercard'] as const).map((brand) => <button type="button" key={brand} className="funding-option funding-option--card" onClick={() => chooseOption(brand)}><BrandLogo brand={brand.toLowerCase() as 'visa' | 'mastercard'} large /><span><strong>{brand}</strong><small>Secure card checkout · sandbox</small></span><ArrowRight size={15} /></button>) : null}
                </div>}
                <BackButton onClick={() => setStep('method')} label="Back to methods" />
              </div>
            )}

            {step === 'network' && method === 'Cryptocurrency' && (
              <div className="funding-panel">
                <div className="funding-panel__intro"><span className="funding-step-label">STEP 03 / {asset}</span><h3>Select a network</h3><p>Choose the exact network separately. It must match the network on your sending or destination wallet.</p></div>
                <div className="funding-network-list">
                  {NETWORKS[asset].map((item) => <button type="button" key={item.code} className={`funding-network${networkCode === item.code ? ' is-selected' : ''}`} onClick={() => { setNetworkCode(item.code); setError(''); }} aria-pressed={networkCode === item.code}>
                    <BrandLogo brand={item.logo} large /><span className="funding-network__copy"><strong>{item.name}</strong><small>{item.code} · {item.eta} · Sandbox fee estimate {item.fee} {asset}</small></span><span className="funding-network__check">{networkCode === item.code ? <CheckCircle2 size={18} /> : null}</span>
                  </button>)}
                </div>
                <div className="funding-risk-notice"><CircleAlert size={17} /><p><strong>Network mismatch can permanently lose funds.</strong> Always confirm the asset and network match on both sides. This is a sandbox: no real deposit address is provided.</p></div>
                {error && <p className="funding-error" role="alert">{error}</p>}
                <div className="funding-actions"><BackButton onClick={() => setStep('option')} label="Back to assets" /><button className="funding-primary" type="button" disabled={!networkCode} onClick={() => { setStep('details'); setError(''); }}>Continue with {networkCode || 'network'} <ArrowRight size={16} /></button></div>
              </div>
            )}

            {step === 'details' && method && (
              <form className="funding-panel" noValidate onSubmit={continueToReview}>
                <div className="funding-panel__intro"><span className="funding-step-label">STEP {method === 'Cryptocurrency' ? '04' : '03'} / YOUR DETAILS</span><h3>{method === 'Bank Transfer' ? withdrawal ? 'Beneficiary and amount' : 'Sender and amount' : method === 'Cryptocurrency' ? withdrawal ? 'Destination and amount' : 'Deposit details' : 'Secure card details'}</h3><p>{method === 'Cards' ? 'Card details stay in this tab only and are cleared after this sandbox test. Do not use a real card.' : 'Information entered here stays in this browser session and is not sent to a payment provider.'}</p></div>

                {method === 'Cryptocurrency' && <div className="funding-asset-summary"><BrandLogo brand={ASSETS.find((item) => item.code === asset)?.logo || 'tether'} large /><span><strong>{assetName} ({asset})</strong><small>{currentNetwork?.name} · {networkCode}</small></span><button type="button" onClick={() => setStep('network')}>Change network</button></div>}

                {method === 'Cryptocurrency' && !withdrawal && <div className="funding-receive-preview">
                  <div className="funding-receive-preview__address"><span className="funding-field-kicker">WALLET ADDRESS</span><strong>Not issued</strong><p>A verified custody provider is required to issue an actual receiving address. No deposit address is generated in this preview.</p><button type="button" className="funding-copy" onClick={() => void copySandboxReference()}><Copy size={14} />{copied ? 'Copied preview reference' : 'Copy sandbox reference'}</button></div>
                  <div className="funding-qr-panel"><div className="funding-qr-frame"><QRCode value={`VTA-SANDBOX-NOT-A-WALLET|${asset}|${networkCode}|DO-NOT-SEND`} size={116} bgColor="#ffffff" fgColor="#102220" /></div><strong>Preview QR only</strong><small>Not a wallet address. Do not send assets.</small></div>
                </div>}

                <div className="funding-form-grid">
                  {method === 'Bank Transfer' && (withdrawal ? <>
                    <Field label="Beneficiary name" value={beneficiaryName} onChange={setBeneficiaryName} placeholder="Name on the receiving account" autoComplete="off" />
                    <Field label="Beneficiary bank" value={bankName} onChange={setBankName} placeholder="Receiving bank" autoComplete="off" />
                    <Field label="Account number / IBAN" value={accountNumber} onChange={setAccountNumber} placeholder="Account or IBAN" autoComplete="off" />
                    <Field label="SWIFT / BIC" value={swiftCode} onChange={(value) => setSwiftCode(value.toUpperCase().replace(/\s/g, '').slice(0, 11))} placeholder="8–11 character code" autoComplete="off" maxLength={11} />
                  </> : <>
                    <Field label="Sender name" value={senderName} onChange={setSenderName} placeholder="Name shown on transfer" autoComplete="name" />
                    <Field label="Reference / transaction ID (optional)" value={reference} onChange={setReference} placeholder="Your transfer reference" autoComplete="off" />
                  </>)}
                  {method === 'Cryptocurrency' && withdrawal && <label className="funding-field funding-field--wide"><span>Destination wallet address</span><input value={walletAddress} onChange={(event) => setWalletAddress(event.target.value.trim())} placeholder={`Paste ${asset} address for ${networkCode}`} autoComplete="off" spellCheck={false} /></label>}
                  {method === 'Cryptocurrency' && !withdrawal && <label className="funding-field funding-field--wide"><span>Transaction hash / TXID <small>Optional · if already sent to your own test wallet</small></span><input value={txHash} onChange={(event) => setTxHash(event.target.value.trim())} placeholder="Paste a transaction hash, if applicable" autoComplete="off" spellCheck={false} /></label>}
                  {method === 'Cards' && <>
                    <Field label="Cardholder name" value={cardholder} onChange={setCardholder} placeholder="Name as shown on card" autoComplete="off" />
                    <label className="funding-field funding-field--wide"><span>Card number</span><input inputMode="numeric" autoComplete="off" value={cardNumber} onChange={(event) => setCardNumber(formatCardNumber(event.target.value))} placeholder="0000 0000 0000 0000" maxLength={23} /></label>
                    <Field label="Expiry date" value={expiry} onChange={setExpiry} placeholder="MM/YY" autoComplete="off" maxLength={5} />
                    <label className="funding-field"><span>Security code (CVV)</span><input inputMode="numeric" type="password" autoComplete="new-password" value={cvv} onChange={(event) => setCvv(event.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="•••" maxLength={4} /></label>
                  </>}
                  <label className="funding-field"><span>Amount</span><div className="funding-amount-input"><input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1'))} placeholder={method === 'Cryptocurrency' ? `Minimum ${currentNetwork?.minimum} ${asset}` : '0.00'} aria-label={`Amount in ${method === 'Cryptocurrency' ? asset : currency}`} /><b>{method === 'Cryptocurrency' ? asset : currency}</b></div></label>
                  {method !== 'Cryptocurrency' && <label className="funding-field"><span>Currency</span><select value={currency} onChange={(event) => setCurrency(event.target.value)}>{CURRENCIES.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>}
                  {method === 'Bank Transfer' && !withdrawal && <label className="funding-upload funding-field--wide"><input type="file" accept="application/pdf,image/jpeg,image/png" onChange={handleProofChange} /><span className="funding-upload__icon"><Upload size={16} /></span><span><strong>{proofFile ? proofFile.name : 'Upload transfer proof'}</strong><small>PDF, JPG or PNG · optional · max 5 MB · not retained</small></span><FileCheck2 size={16} /></label>}
                  {withdrawal && method === 'Cryptocurrency' && <label className="funding-confirmation funding-field--wide"><input type="checkbox" checked={networkConfirmed} onChange={(event) => setNetworkConfirmed(event.target.checked)} /><span>I have verified the destination address and selected network. I understand a network mismatch may result in permanent loss.</span></label>}
                </div>

                {method === 'Cryptocurrency' && currentNetwork && <div className="funding-fee-summary">{withdrawal ? <><span>Network fee <strong>{currentNetwork.fee} {asset}</strong></span><span>Estimated total deducted <strong>{numericAmount > 0 ? (numericAmount + currentNetwork.fee).toFixed(asset === 'BTC' || asset === 'ETH' ? 8 : 2) : '—'} {asset}</strong></span></> : <><span>Network fee estimate <strong>{currentNetwork.fee} {asset} · paid by sender</strong></span><span>Estimated received <strong>{numericAmount > 0 ? formatAmount(estimatedReceived, asset) : '—'}</strong></span></>}<span>Estimated processing <strong>{currentNetwork.eta}</strong></span></div>}
                {method === 'Bank Transfer' && <p className="funding-processing-note"><Clock3 size={14} /> {withdrawal ? 'Bank processing time varies by destination and clearing network. This preview does not submit a transfer.' : 'Bank transfers typically take 1–3 business days. No VTA receiving account is configured.'}</p>}
                {method === 'Cards' && <div className="funding-secure-note"><LockKeyhole size={14} /><span><strong>Secure sandbox checkout</strong><small>Test data only · never use your real card details here</small></span><span className="funding-brand-pair"><BrandLogo brand="visa" /><BrandLogo brand="mastercard" /></span></div>}
                {error && <p className="funding-error" role="alert" aria-live="polite">{error}</p>}
                <div className="funding-actions"><BackButton onClick={() => { setError(''); setStep(method === 'Cryptocurrency' ? 'network' : 'option'); }} label="Back" /><button className="funding-primary" type="submit">Review request <ArrowRight size={16} /></button></div>
              </form>
            )}

            {step === 'review' && method && (
              <div className="funding-panel">
                <div className="funding-panel__intro"><span className="funding-step-label">STEP {method === 'Cryptocurrency' ? '05' : '04'} / REVIEW</span><h3>Review before confirming</h3><p>Check the summary, then choose the outcome for this sandbox-only request.</p></div>
                <div className="funding-review-layout">
                  <div className="funding-review-list">
                    <ReviewRow label="Request type" value={withdrawal ? 'Withdrawal' : 'Deposit'} />
                    <ReviewRow label="Method" value={method} />
                    <ReviewRow label="Option" value={option} />
                    {method === 'Cryptocurrency' && <ReviewRow label="Asset / network" value={`${asset} · ${currentNetwork?.name} (${networkCode})`} />}
                    <ReviewRow label="Amount" value={`${amount} ${method === 'Cryptocurrency' ? asset : currency}`} />
                    <ReviewRow label={withdrawal ? 'Amount to destination' : 'Estimated amount received'} value={formatAmount(estimatedReceived, method === 'Cryptocurrency' ? asset : currency)} />
                    {method === 'Bank Transfer' && <ReviewRow label={withdrawal ? 'Beneficiary details' : 'Sender details'} value="Entered for preview · not retained" />}
                    <ReviewRow label={withdrawal ? 'Estimated total fee' : 'Sandbox fee'} value={`${fee.toFixed(method === 'Cryptocurrency' && (asset === 'BTC' || asset === 'ETH') ? 8 : 2)} ${method === 'Cryptocurrency' ? asset : currency}`} />
                    {withdrawal && method === 'Cryptocurrency' && <ReviewRow label="Estimated total deducted" value={`${(numericAmount + fee).toFixed(asset === 'BTC' || asset === 'ETH' ? 8 : 2)} ${asset}`} />}
                    {withdrawal && method === 'Cryptocurrency' && <ReviewRow label="Destination" value={`••••${walletAddress.slice(-6)}`} />}
                    {method === 'Cards' && <ReviewRow label="Payment card" value={`${option} · ending ${cardNumber.replace(/\D/g, '').slice(-4)}`} />}
                  </div>
                  <aside className="funding-order-summary"><span className="funding-field-kicker">ORDER SUMMARY</span><strong>{amount || '0.00'} <small>{method === 'Cryptocurrency' ? asset : currency}</small></strong><div><span>Demo fee estimate</span><b>{fee.toFixed(2)} {method === 'Cryptocurrency' ? asset : currency}</b></div><div><span>Provider</span><b>Not connected</b></div><p>No live payment, blockchain transaction or bank instruction will be created.</p></aside>
                </div>
                <label className="funding-outcome-select"><span>Sandbox outcome</span><select value={sandboxOutcome} onChange={(event) => setSandboxOutcome(event.target.value as OutcomeChoice)}><option value="Pending">Pending · awaiting simulated review</option><option value="Completed">Completed · sandbox success</option><option value="Failed">Failed · simulate an error</option></select><small>This test setting only changes the demo record, not a real transaction.</small></label>
                {error && <p className="funding-error" role="alert">{error}</p>}
                <div className="funding-actions"><BackButton onClick={() => setStep('details')} label="Edit details" /><button className="funding-primary" type="button" onClick={submitSandboxTransaction} disabled={isLoading} aria-busy={isLoading}>{isLoading ? 'Creating request…' : withdrawal ? 'Confirm sandbox withdrawal' : 'Confirm sandbox deposit'} <LockKeyhole size={15} /></button></div>
              </div>
            )}

            {step === 'processing' && <div className="funding-status-panel" role="status" aria-live="polite"><span className="funding-spinner" /><span className="eyebrow">SANDBOX / PROCESSING</span><h3>Recording your preview request</h3><p>A demo transaction ID has been assigned. No provider has received this request and no funds are moving.</p><strong>{transactionId}</strong></div>}

            {step === 'result' && <div className="funding-status-panel funding-status-panel--result" role="status" aria-live="polite">
              <span className={`funding-result-icon funding-result-icon--${resultStatus.toLowerCase()}`}>{resultStatus === 'Completed' ? <Check size={24} /> : resultStatus === 'Failed' ? <X size={24} /> : <Clock3 size={24} />}</span>
              <span className="eyebrow">SANDBOX / {resultStatus.toUpperCase()}</span>
              <h3>{resultStatus === 'Completed' ? 'Preview completed' : resultStatus === 'Failed' ? 'Preview marked failed' : resultStatus === 'Processing' ? 'Request processing' : 'Request awaiting review'}</h3>
              <p>{resultStatus === 'Completed' ? 'The sandbox request is marked complete for this preview only. No money has been received or transferred.' : resultStatus === 'Failed' ? 'The sandbox request was marked failed. No payment was attempted and no funds were transferred.' : resultStatus === 'Processing' ? 'The sandbox request is marked as processing. No provider has received the request and no funds have moved.' : 'The sandbox request remains pending, just as it would while awaiting provider review. No funds have moved.'}</p>
              <div className="funding-result-id"><span>TRANSACTION ID</span><strong>{transactionId}</strong><span className={`funding-status-pill funding-status-pill--${resultStatus.toLowerCase()}`}>{resultStatus}</span></div>
              <div className="funding-actions funding-actions--center"><button className="funding-secondary" type="button" onClick={resetFlow}>Start another {withdrawal ? 'withdrawal' : 'deposit'}</button><button className="funding-primary" type="button" onClick={() => { const found = transactions.find((item) => item.id === transactionId); if (found) setModalTransaction(found); else setStep('method'); }}>View transaction <ReceiptText size={15} /></button></div>
            </div>}
          </section>
        </>
      )}

      {modalTransaction && <TransactionDialog transaction={modalTransaction} onClose={() => setModalTransaction(null)} onUpdate={(status) => { updateTransactionStatus(modalTransaction.id, status); setModalTransaction({ ...modalTransaction, status }); }} />}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, autoComplete = 'off', maxLength }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; autoComplete?: string; maxLength?: number }) {
  return <label className="funding-field"><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete={autoComplete} maxLength={maxLength} /></label>;
}

function BrandLogo({ brand, large = false }: { brand: string; large?: boolean }) {
  const labels: Record<string, string> = { visa: 'Visa', mastercard: 'Mastercard', tether: 'Tether', bitcoin: 'Bitcoin', ethereum: 'Ethereum', tron: 'TRON', binance: 'BNB Smart Chain' };
  return <span className={`funding-brand funding-brand--${brand}${large ? ' funding-brand--large' : ''}`}><img src={`/assets/payment/${brand}.svg`} alt={labels[brand] || brand} /></span>;
}

function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return <button className="funding-back" type="button" onClick={onClick}><ArrowLeft size={15} /> {label}</button>;
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return <div className="funding-review-row"><span>{label}</span><strong>{value}</strong></div>;
}

function TransactionsDashboard({ transactions, onOpen }: { transactions: FundingTransaction[]; onOpen: (transaction: FundingTransaction) => void }) {
  const counts = {
    deposits: transactions.filter((item) => item.type === 'Deposit').length,
    withdrawals: transactions.filter((item) => item.type === 'Withdrawal').length,
    pending: transactions.filter((item) => item.status === 'Pending').length,
    completed: transactions.filter((item) => item.status === 'Completed').length,
    failed: transactions.filter((item) => item.status === 'Failed').length,
  };
  return <section className="funding-history" aria-label="Sandbox transaction history">
    <div className="funding-history__summary">
      <SummaryCard label="Total deposits" value={counts.deposits} icon={<ArrowDownLeft size={17} />} note="Sandbox requests" />
      <SummaryCard label="Total withdrawals" value={counts.withdrawals} icon={<ArrowUpRight size={17} />} note="Sandbox requests" />
      <SummaryCard label="Pending" value={counts.pending} icon={<Clock3 size={17} />} note="Awaiting review" />
      <SummaryCard label="Completed" value={counts.completed} icon={<CheckCircle2 size={17} />} note="Demo outcomes" />
      <SummaryCard label="Failed" value={counts.failed} icon={<CircleAlert size={17} />} note="Demo outcomes" />
    </div>
    <div className="funding-history__table-card">
      <div className="funding-history__heading"><div><span className="eyebrow">PAPER LEDGER / SESSION HISTORY</span><h3>Recent transactions</h3></div><span className="funding-preview-tag">{transactions.length} RECORD{transactions.length === 1 ? '' : 'S'}</span></div>
      {transactions.length === 0 ? <div className="funding-history__empty"><span><ReceiptText size={20} /></span><h4>No sandbox transactions yet</h4><p>Completed demo requests will appear here with their status and transaction details.</p></div> : <div className="funding-table-scroll"><table className="funding-table"><thead><tr><th>Transaction ID</th><th>Type</th><th>Method</th><th>Asset / currency</th><th>Network</th><th>Amount</th><th>Fee</th><th>Date &amp; time</th><th>Status</th><th><span className="sr-only">Details</span></th></tr></thead><tbody>{transactions.map((transaction) => <tr key={transaction.id}><td className="funding-table__id">{transaction.id}</td><td><span className={`funding-type funding-type--${transaction.type.toLowerCase()}`}>{transaction.type === 'Deposit' ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}{transaction.type}</span></td><td>{transaction.method}</td><td>{transaction.asset}</td><td>{transaction.network}</td><td className="funding-table__amount">{formatAmount(transaction.amount, transaction.currency)}</td><td>{formatAmount(transaction.fee, transaction.currency)}</td><td>{formatDate(transaction.createdAt)}</td><td><StatusPill status={transaction.status} /></td><td><button className="funding-details-button" type="button" onClick={() => onOpen(transaction)}>Details</button></td></tr>)}</tbody></table></div>}
    </div>
    <p className="funding-history__disclosure"><ShieldCheck size={14} /> Session-only demo records. No real deposits, withdrawals, payment authorizations or settlement have occurred.</p>
  </section>;
}

function SummaryCard({ label, value, icon, note }: { label: string; value: number; icon: React.ReactNode; note: string }) {
  return <article className="funding-summary-card"><span className="funding-summary-card__icon">{icon}</span><span className="funding-summary-card__label">{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function StatusPill({ status }: { status: FundingStatus }) {
  return <span className={`funding-status-pill funding-status-pill--${status.toLowerCase()}`}><i />{status}</span>;
}

function TransactionDialog({ transaction, onClose, onUpdate }: { transaction: FundingTransaction; onClose: () => void; onUpdate: (status: FundingStatus) => void }) {
  return <div className="funding-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="funding-modal" role="dialog" aria-modal="true" aria-labelledby="funding-modal-title">
      <div className="funding-modal__header"><span className="eyebrow">SESSION / TRANSACTION DETAILS</span><button type="button" onClick={onClose} aria-label="Close transaction details"><X size={18} /></button></div>
      <h3 id="funding-modal-title">{transaction.type} request</h3><p className="funding-modal__id">{transaction.id}</p>
      <div className="funding-modal__status"><span>Current status</span><StatusPill status={transaction.status} /></div>
      <div className="funding-modal__rows"><ReviewRow label="Method" value={transaction.method} /><ReviewRow label="Asset / currency" value={transaction.asset} /><ReviewRow label="Network" value={transaction.network} /><ReviewRow label="Amount" value={formatAmount(transaction.amount, transaction.currency)} /><ReviewRow label="Fee estimate" value={formatAmount(transaction.fee, transaction.currency)} /><ReviewRow label="Created" value={formatDate(transaction.createdAt)} />{transaction.details.map((item) => <ReviewRow key={item.label} label={item.label} value={item.value} />)}</div>
      <div className="funding-modal__controls"><span className="funding-field-kicker">SIMULATE A SANDBOX STATUS</span><div>{(['Pending', 'Processing', 'Completed', 'Failed'] as FundingStatus[]).map((status) => <button type="button" key={status} className={transaction.status === status ? 'is-active' : ''} onClick={() => onUpdate(status)} aria-pressed={transaction.status === status}>{status}</button>)}</div><small>Status simulation updates only this browser's preview ledger. It does not reflect real settlement.</small></div>
      <button className="funding-primary funding-modal__close" type="button" onClick={onClose}>Close details</button>
    </section>
  </div>;
}

function isWalletAddressValid(address: string, asset: CryptoAsset, network: string) {
  const value = address.trim();
  if (asset === 'BTC') return /^(bc1[ac-hj-np-z02-9]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{24,33})$/.test(value);
  if (network === 'TRC20') return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(value);
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function isLuhnValid(value: string) {
  if (!/^\d{13,19}$/.test(value)) return false;
  let sum = 0;
  let doubleDigit = false;
  for (let index = value.length - 1; index >= 0; index -= 1) {
    let digit = Number(value[index]);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }
  return sum % 10 === 0;
}

function isExpiryValid(value: string) {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value);
  if (!match) return false;
  const now = new Date();
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
}

function formatCardNumber(value: string) {
  return value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
}

function formatAmount(value: number, currency: string) {
  const precision = currency === 'BTC' || currency === 'ETH' ? 8 : 2;
  return `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: precision }).format(value)} ${currency}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
