import React from "react";
import TransactionForm from "./components/TransactionForm";

const App: React.FC = () => {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">Ethereum Hardware Wallet Simulator</h1>
            <TransactionForm />
        </div>
    );
};

export default App;
