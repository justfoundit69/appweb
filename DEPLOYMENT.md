# Deployment Guide - NadzMultiSend

## Langkah-langkah Deployment

### 1. Deploy Contract ke Robinhood Chain Mainnet

#### Option A: Menggunakan Remix IDE

1. Buka [Remix IDE](https://remix.ethereum.org/)
2. Buat file baru: `NadzMultiSend.sol`
3. Copy-paste seluruh isi dari `remix-contracts/NadzMultiSend.sol`
4. Compile contract:
   - Pilih compiler version: `0.8.20` atau lebih baru
   - Klik "Compile NadzMultiSend.sol"
5. Deploy contract:
   - Pilih tab "Deploy & Run Transactions"
   - Environment: Pilih "Injected Provider - MetaMask" dan pastikan wallet terhubung ke Robinhood Chain Mainnet
   - Deploy Constructor:
     - `_feeRecipient`: Masukkan alamat wallet yang akan menerima fee, contoh `0x...`
     - `_feeAmount`: Masukkan jumlah fee dalam wei, contoh `2350000000000000` untuk sekitar 0.00235 ETH
   - Klik "Deploy"
   - Copy address contract yang baru di-deploy

#### Option B: Menggunakan Hardhat

1. Install dependencies jika belum:

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

2. Setup `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    "robinhood-mainnet": {
      url: "https://rpc.mainnet.chain.robinhood.com",
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
```

3. Deploy:

```bash
FEE_RECIPIENT=0x... FEE_AMOUNT=2350000000000000 npx hardhat run scripts/deploy-nadz-multisend.js --network robinhood-mainnet
```

### 2. Setup Environment Variable

1. Buat file `.env.local` di root project jika belum ada
2. Tambahkan variabel berikut:

```env
NEXT_PUBLIC_MULTISEND=0x...your_contract_address_here...
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_EXPLORER=https://robinhoodchain.blockscout.com
NEXT_PUBLIC_APP_BASE_URL=https://app.chestfi.com
```

3. Restart development server:

```bash
npm run dev
```

### 3. Verifikasi Contract

1. Buka explorer Robinhood Chain: https://robinhoodchain.blockscout.com
2. Cari contract address yang sudah di-deploy
3. Verifikasi contract dengan upload source code
4. Verifikasi ABI yang tersedia di `src/lib/abis/multiSend.json`

### 4. Testing Multi-Send

1. Pastikan wallet terhubung ke Robinhood Chain Mainnet dengan Chain ID `4663`
2. Pastikan wallet memiliki cukup ETH untuk:
   - Fee multi-send, default sekitar 0.00235 ETH
   - Jumlah yang akan dikirim ke recipients
3. Test dengan native token ETH:
   - Pilih "Native Token (ETH)"
   - Tambahkan beberapa recipient
   - Isi jumlah yang akan dikirim
   - Klik "Send"
4. Test dengan ERC-20 token:
   - Pilih "Token"
   - Masukkan token address
   - Klik "Approve Tokens" terlebih dahulu
   - Tambahkan recipients
   - Klik "Send"

## Konfigurasi Fee

Default fee: sekitar 0.00235 ETH atau `2350000000000000` wei.

Untuk mengubah fee setelah deployment, hanya owner yang bisa menjalankan:

```javascript
await contract.setFeeAmount("4700000000000000");
```

## Troubleshooting

### Error: "Multi-Send Contract Not Configured"

- Pastikan `NEXT_PUBLIC_MULTISEND` sudah di-set di `.env.local`
- Restart development server setelah menambah environment variable

### Error: "Insufficient value"

- Pastikan wallet memiliki cukup ETH untuk fee + total amount yang akan dikirim

### Error: "Transfer from failed"

- Pastikan sudah approve token sebelum multi-send
- Pastikan allowance cukup untuk jumlah yang akan dikirim

### Contract tidak muncul di explorer

- Tunggu beberapa saat untuk sync
- Refresh browser
- Cek apakah transaction deployment sudah confirmed
