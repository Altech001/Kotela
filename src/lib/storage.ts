
export type Wallet = {
    id: string;
    networkName: string;
    address: string;
    balance: number;
}

export type Withdrawal = {
    id: string;
    amount: number;
    date: string; // ISO string
    status: 'pending' | 'approved' | 'rejected';
    paymentMethod: any;
}


const CURRENCY_KEY = 'kotela-currency';
const WALLETS_KEY = 'kotela-wallets';
const WITHDRAWALS_KEY = 'kotela-withdrawals';

function generateRandomAddress(prefix = "0x", length = 40) {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = prefix;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function initializeData() {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(CURRENCY_KEY)) {
        localStorage.setItem(CURRENCY_KEY, '1000');
    }
    if (!localStorage.getItem(WALLETS_KEY)) {
        const defaultWallets: Wallet[] = [
            { id: 'wallet-main-kotela', networkName: 'Kotela', address: generateRandomAddress("KTC_"), balance: 1000 }
        ];
        localStorage.setItem(WALLETS_KEY, JSON.stringify(defaultWallets));
    }
     if (!localStorage.getItem(WITHDRAWALS_KEY)) {
        localStorage.setItem(WITHDRAWALS_KEY, JSON.stringify([]));
    }
}

initializeData();

export const getCurrency = (): number => {
    if (typeof window === 'undefined') return 0;
    return parseFloat(localStorage.getItem(CURRENCY_KEY) || '0');
};

export const addCurrency = (amount: number): boolean => {
    if (typeof window === 'undefined') return false;
    const currentBalance = getCurrency();
    const newBalance = currentBalance + amount;
    localStorage.setItem(CURRENCY_KEY, newBalance.toString());
    
    // Also update the main Kotela wallet balance
    const wallets = getWallets();
    const mainWalletIndex = wallets.findIndex(w => w.networkName === 'Kotela');
    if (mainWalletIndex !== -1) {
        wallets[mainWalletIndex].balance = newBalance;
        localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets));
    }
    
    window.dispatchEvent(new Event('storage'));
    return true;
};

export const spendCurrency = (amount: number): boolean => {
    if (typeof window === 'undefined') return false;
    const currentBalance = getCurrency();
    if (currentBalance < amount) {
        return false;
    }
    const newBalance = currentBalance - amount;
    localStorage.setItem(CURRENCY_KEY, newBalance.toString());

    // Also update the main Kotela wallet balance
    const wallets = getWallets();
    const mainWalletIndex = wallets.findIndex(w => w.networkName === 'Kotela');
    if (mainWalletIndex !== -1) {
        wallets[mainWalletIndex].balance = newBalance;
        localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets));
    }

    window.dispatchEvent(new Event('storage'));
    return true;
};


export const getWallets = (): Wallet[] => {
    if (typeof window === 'undefined') return [];
    const walletsJson = localStorage.getItem(WALLETS_KEY);
    return walletsJson ? JSON.parse(walletsJson) : [];
}

export const addWallet = (networkName: string) => {
    if (typeof window === 'undefined') return;
    const wallets = getWallets();
    const newWallet: Wallet = {
        id: `wallet-${Date.now()}`,
        networkName: networkName,
        address: generateRandomAddress(),
        balance: 0
    };
    wallets.push(newWallet);
    localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets));
    window.dispatchEvent(new Event('storage'));
}

export const deleteWallet = (walletId: string) => {
    if (typeof window === 'undefined') return;
    let wallets = getWallets();
    wallets = wallets.filter(w => w.id !== walletId);
    localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets));
    window.dispatchEvent(new Event('storage'));
}


export const getWithdrawals = (): Withdrawal[] => {
    if (typeof window === 'undefined') return [];
    const withdrawalsJson = localStorage.getItem(WITHDRAWALS_KEY);
    if (withdrawalsJson) {
        return JSON.parse(withdrawalsJson).sort((a: Withdrawal, b: Withdrawal) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return [];
};

export const addWithdrawal = (withdrawal: Omit<Withdrawal, 'id'>) => {
    if (typeof window === 'undefined') return;
    const withdrawals = getWithdrawals();
    const newWithdrawal: Withdrawal = {
        ...withdrawal,
        id: `wd-${Date.now()}`,
    };
    withdrawals.unshift(newWithdrawal);
    localStorage.setItem(WITHDRAWALS_KEY, JSON.stringify(withdrawals));
    window.dispatchEvent(new Event('storage'));
};
