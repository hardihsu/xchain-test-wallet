/* eslint-disable no-constant-binary-expression */
import React, { useEffect, useState } from "react";
import { getBalance, sendTransaction, mine, getChain, getPendingTransactions, getFaucet } from "./api";
import * as CryptoJS from "crypto-js";
import { ec as EC } from "elliptic";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";

const ec = new EC("secp256k1");

interface Wallet {
  privateKey: string;
  publicKey: string;
  address: string;
}

interface Block {
  index: number;
  timestamp: number;
  transactions: any[];
  previousHash: string;
  hash: string;
  nonce: number;
}

const App: React.FC = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [chain, setChain] = useState<Block[]>([]);
  const [pendingTxs, setPendingTxs] = useState<any[]>([]);

  // 自动刷新链和交易池
  useEffect(() => {
    fetchChain();
    fetchPendingTxs();
    const timer = setInterval(() => {
      fetchChain();
      fetchPendingTxs();
      if (wallet) fetchBalance(wallet.address);
    }, 5000);
    return () => clearInterval(timer);
  }, [wallet]);

  // 生成新钱包
  function createWallet() {
    const key = ec.genKeyPair();
    const privateKey = key.getPrivate("hex");
    const publicKey = key.getPublic("hex");
    const address = CryptoJS.SHA256(publicKey).toString().slice(-40);
    setWallet({ privateKey, publicKey, address });
    fetchBalance(address);
  }

  // 导入钱包
  function importWallet(privateKey: string) {
    try {
      const key = ec.keyFromPrivate(privateKey, "hex");
      const publicKey = key.getPublic("hex");
      const address = CryptoJS.SHA256(publicKey).toString().slice(-40);
      setWallet({ privateKey, publicKey, address });
      fetchBalance(address);
    } catch {
      alert("私钥无效");
    }
  }

  async function fetchBalance(address: string) {
    const data = await getBalance(address);
    setBalance(data.balance);
  }

  async function fetchChain() {
    const data = await getChain();
    setChain(data.chain || []);
  }

  async function fetchPendingTxs() {
    // const data = await getPendingTransactions();
    // setPendingTxs(data.pendingTransactions || []);
    setPendingTxs([]);
  }

  async function handleSendTx() {
    if (!wallet) return;
    const key = ec.keyFromPrivate(wallet.privateKey, "hex");
    const tx = {
      from: wallet.address,
      to,
      amount,
      timestamp: Date.now(),
      publicKey: wallet.publicKey,
    };
    // const txHash = CryptoJS.SHA256(JSON.stringify(tx)).toString();
    // 确保字段顺序固定
    const message = `${tx.from}|${tx.to}|${tx.amount}|${tx.timestamp}|${tx.publicKey}`;
    const msgHash = CryptoJS.SHA256(message).toString(CryptoJS.enc.Hex);
    const signature = key.sign(msgHash, "base64").toDER("hex");
    (tx as any).signature = signature;

    const res = await sendTransaction(tx);
    console.log("交易结果:", res);
    fetchBalance(wallet.address);
    fetchPendingTxs();
  }

  async function handleMine() {
    if (!wallet) return;
    const res = await mine(wallet.address);
    console.log("挖矿结果:", res);
    fetchBalance(wallet.address);
    fetchChain();
    fetchPendingTxs();
  }

  async function handleFaucet() {
    if (!wallet) return;
    await getFaucet(wallet.address);
    fetchBalance(wallet.address);
    fetchChain();
    fetchPendingTxs();
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">XChain Wallet</h1>
      {Boolean(wallet) &&
        <Button className="float-right -mt-12" onClick={handleFaucet}>给点</Button>
      }

      {!wallet ? (
        <Card>
          <CardHeader>
            <CardTitle>钱包登录</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={createWallet} className="w-full">生成新钱包</Button>
            <input
              type="text"
              placeholder="导入私钥"
              id="importKey"
              className="border p-2 w-full rounded"
            />
            <Button
              onClick={() => {
                const key = (document.getElementById("importKey") as HTMLInputElement).value;
                importWallet(key);
              }}
              className="w-full"
            >
              导入钱包
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {/* 钱包信息 */}
          <Card className="col-span-1">
            <CardHeader><CardTitle>钱包</CardTitle></CardHeader>
            <CardContent>
              <p><b>地址:</b> {wallet.address}</p>
              <p><b>余额:</b> {balance}</p>
              <p><b>私钥:</b> {wallet.privateKey}</p>
            </CardContent>
          </Card>

          {/* 转账功能 */}
          <Card className="col-span-1">
            <CardHeader><CardTitle>转账</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <input
                type="text"
                placeholder="收款地址"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="border p-2 w-full rounded"
              />
              <input
                type="number"
                placeholder="金额"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="border p-2 w-full rounded"
              />
              <Button onClick={handleSendTx} className="w-full">发送</Button>
            </CardContent>
          </Card>

          {/* 挖矿 */}
          <Card className="col-span-1">
            <CardHeader><CardTitle>挖矿</CardTitle></CardHeader>
            <CardContent>
              <Button onClick={handleMine} className="w-full">挖矿</Button>
            </CardContent>
          </Card>

          {/* 交易池 */}
          {false && <Card className="col-span-3">
            <CardHeader><CardTitle>交易池</CardTitle></CardHeader>
            <CardContent>
              {pendingTxs.length === 0 ? (
                <p>暂无待处理交易</p>
              ) : (
                <ul className="space-y-2">
                  {pendingTxs.map((tx, i) => (
                    <li key={i} className="border p-2 rounded">
                      {tx.from} → {tx.to} : {tx.amount}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>}

          {/* 区块链 */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>区块链 (共 {chain?.length} 个区块)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {chain.map((block, i) => (
                  <li key={i} className="border p-3 rounded">
                    <p><b>区块 #{block.index}</b> - {new Date(block.timestamp).toLocaleString()}</p>
                    <p><b>Hash:</b> {block.hash}</p>
                    <p><b>前一个 Hash:</b> {block.previousHash}</p>
                    <p><b>Nonce:</b> {block.nonce}</p>
                    <p><b>交易数:</b> {block?.transactions?.length}</p>
                    {block?.transactions?.length > 0 && (
                      <ul className="pl-4 mt-2 space-y-1 text-sm text-gray-600">
                        {block?.transactions?.map((tx, j) => (
                          <li key={j}>{tx.from} → {tx.to} : {tx.amount}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default App;
