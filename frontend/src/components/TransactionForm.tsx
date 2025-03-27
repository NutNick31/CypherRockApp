import React, { useState } from "react";
import axios from "axios";

const TransactionForm: React.FC = () => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [gasLimit, setGasLimit] = useState("21000");
  const [gasPrice, setGasPrice] = useState("50");
  const [loading, setLoading] = useState(false);
  const [signedTransaction, setSignedTransaction] = useState<string | null>(null);
  const [parsedTransaction, setParsedTransaction] = useState<{
    unsignedTx?: string;
    from?: string;
    to?: string;
    value?: string;
    gas?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSignedTransaction(null);
    setParsedTransaction(null);

    try {
      const response = await axios.post("http://localhost:8000/create-unsigned-tx", {
        recipient,
        amount,
        gasLimit,
        gasPrice,
      });

      const unsignedTx = response.data.unsignedTx;
      const signResponse = await axios.post("http://localhost:8000/sign-transaction", { unsignedTx });
      setSignedTransaction(signResponse.data.signedTx);

      if (signResponse.data.parsedTx) {
        try {
          const parsedData = JSON.parse(signResponse.data.parsedTx);
          setParsedTransaction({
            unsignedTx: parsedData.UnsignedTx,
            from: parsedData.ParsedTx?.from,
            to: parsedData.ParsedTx?.to,
            value: parsedData.ParsedTx?.value,
            gas: parsedData.ParsedTx?.gas,
          });
        } catch (error) {
          console.error("Error parsing transaction JSON:", error);
          setParsedTransaction(null);
        }
      }
    } catch (err) {
      setError("Transaction signing failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white shadow-lg rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Ethereum Transaction</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 font-medium">Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium">Amount (ETH)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium">Gas Limit</label>
          <input
            type="number"
            value={gasLimit}
            onChange={(e) => setGasLimit(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium">Gas Price (Gwei)</label>
          <input
            type="number"
            value={gasPrice}
            onChange={(e) => setGasPrice(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Processing..." : "Sign Transaction"}
        </button>
      </form>
      
      {error && <p className="text-red-500 mt-4 text-center font-medium">{error}</p>}
      
      {signedTransaction && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg overflow-x-auto max-w-full">
          <h3 className="font-semibold text-gray-800">Signed Transaction:</h3>
          <pre className="text-sm break-words text-gray-700 bg-gray-50 p-3 rounded-lg">{signedTransaction}</pre>
        </div>
      )}

      {parsedTransaction && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg overflow-x-auto max-w-full">
          <h3 className="font-semibold text-gray-800">Parsed Transaction Details:</h3>
          <p className="text-gray-700 break-words"><strong>Unsigned Tx:</strong> {parsedTransaction.unsignedTx || "N/A"}</p>
          <p className="text-gray-700 break-words"><strong>From:</strong> {parsedTransaction.from || "N/A"}</p>
          <p className="text-gray-700 break-words"><strong>To:</strong> {parsedTransaction.to || "N/A"}</p>
          <p className="text-gray-700 break-words"><strong>Value:</strong> {parsedTransaction.value || "N/A"}</p>
          <p className="text-gray-700 break-words"><strong>Gas:</strong> {parsedTransaction.gas || "N/A"}</p>
        </div>
      )}
    </div>
  );
};

export default TransactionForm;
