import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { ethers } from 'ethers';
import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const INFURA_API_KEY = process.env.INFURA_API_KEY;
// const provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_API_KEY}`);
const provider = new ethers.JsonRpcProvider("https://mainnet.infura.io/v3/939651670c4246d18ab6f8f67b7d2edf");
const MOCK_HW_WALLET_DIR = path.join(__dirname, '../../mock_hardware_wallet/');

const PRIVATE_KEY = "f0c2a2e52ec5ded93040757807674359713001b16ecd4a83cc21a95c466e1150";
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

function isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
}

app.post('/create-unsigned-tx', async (req, res) => {
    try {
        const { recipient, amount, gasLimit, gasPrice } = req.body;
        const sender = "0xEAaFEE2d138187b98658efcCc40557D1bc59bAd0";
        console.log(req.body);
        if (!recipient || !isValidAddress(recipient)) {
            return res.status(400).json({ error: "Invalid recipient address" });
        }
      
        if (!amount || isNaN(amount)) {
        return res.status(400).json({ error: "Invalid amount" });
        }
      
        const amountInWei = ethers.parseEther(amount.toString());
        // gasLimit = ethers.toQuantity(gasLimit || "21000");
        // gasPrice = ethers.toQuantity(gasPrice || "20000000000");

        const nonce = await provider.getTransactionCount(sender);
        
        const tx : any = {
            nonce: ethers.toQuantity(nonce),
            gasLimit: ethers.toQuantity(gasLimit),
            gasPrice: ethers.toQuantity(ethers.parseUnits(gasPrice, 'gwei')),
            to: recipient,
            value: ethers.toQuantity(ethers.parseEther(amount)),
            chainId: 1 // Ethereum Mainnet
        };
        
        const unsignedTx = ethers.Transaction.from(tx).unsignedSerialized;
        res.json({ unsignedTx });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating unsigned transaction' });
    }
});

app.post('/sign-transaction', async (req, res) => {
    try {
        const { unsignedTx } = req.body;
        console.log(req.body);
        const signTxPath = path.join(MOCK_HW_WALLET_DIR, 'sign_tx');
        console.log(signTxPath);
        
        exec(`${signTxPath} ${unsignedTx}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error signing transaction: ${stderr}`);
                return res.status(500).json({ error: 'Error signing transaction' });
            }
            
            const signedTx = stdout.trim();
            const parsedTxPath = path.join(MOCK_HW_WALLET_DIR, 'parsed.txt');
            const parsedTx = fs.readFileSync(parsedTxPath, 'utf-8');
            
            res.json({ signedTx, parsedTx });
        });
        console.log("done");
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error signing transaction' });
    }
});

app.get('/generate-address', async (req, res) => {
    try {
        const generateAddressPath = path.join(MOCK_HW_WALLET_DIR, 'generate_address');
        
        exec(`${generateAddressPath}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error generating address: ${stderr}`);
                return res.status(500).json({ error: 'Error generating address' });
            }
            
            const address = stdout.trim();
            res.json({ address });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error generating address' });
    }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
